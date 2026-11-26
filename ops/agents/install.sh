#!/usr/bin/env bash
# Idempotent Mac Mini installer for the FairWork 4-agent swarm & tuned Ollama LaunchAgent.
# Usage:
#   ./ops/agents/install.sh [--dry-run] [--with-swarm-agent]

set -euo pipefail

OPS_AGENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${OPS_AGENTS_DIR}/../.." && pwd)"

DRY_RUN=0
WITH_SWARM_AGENT=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --with-swarm-agent)
      WITH_SWARM_AGENT=1
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--with-swarm-agent]"
      echo "  --dry-run           Preview rendered files and actions without modifying system state"
      echo "  --with-swarm-agent  Also install and load com.fairwork.swarm LaunchAgent"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

CONFIG_DIR="${HOME}/.config/fairwork-agents"
CONFIG_FILE="${CONFIG_DIR}/config.env"
STATE_DIR="${HOME}/.local/state/fairwork-agents"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"

OLLAMA_BIN="$(command -v ollama 2>/dev/null || echo "/opt/homebrew/bin/ollama")"
LAUNCHD_PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${HOME}/.local/bin"

render_template() {
  local src="$1"
  local dest="$2"

  sed \
    -e "s|__HOME__|${HOME}|g" \
    -e "s|__REPO_DIR__|${REPO_DIR}|g" \
    -e "s|__STATE_DIR__|${STATE_DIR}|g" \
    -e "s|__CONFIG_FILE__|${CONFIG_FILE}|g" \
    -e "s|__OLLAMA_BIN__|${OLLAMA_BIN}|g" \
    -e "s|__PATH__|${LAUNCHD_PATH}|g" \
    "${src}" > "${dest}"
}

echo "=== FairWork Mac Mini Agent Installer ==="
echo "Repo dir          : ${REPO_DIR}"
echo "Config file       : ${CONFIG_FILE}"
echo "State dir         : ${STATE_DIR}"
echo "Ollama binary     : ${OLLAMA_BIN}"
echo "Dry run           : ${DRY_RUN}"
echo "Install swarm job : ${WITH_SWARM_AGENT}"
echo ""

# Check dependencies (warn in dry-run, fail on real install)
MISSING_DEPS=0
for dep in git gh jq curl; do
  if ! command -v "${dep}" >/dev/null 2>&1; then
    echo "[WARN] Missing dependency in PATH: ${dep}"
    MISSING_DEPS=$((MISSING_DEPS + 1))
  else
    echo "[OK] Found ${dep}: $(command -v "${dep}")"
  fi
done

for opt_dep in ollama claude; do
  if ! command -v "${opt_dep}" >/dev/null 2>&1; then
    echo "[WARN] Missing runtime tool in PATH: ${opt_dep}"
    if [ "${DRY_RUN}" -eq 0 ]; then
      MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
  else
    echo "[OK] Found ${opt_dep}: $(command -v "${opt_dep}")"
  fi
done

if [ "${DRY_RUN}" -eq 0 ] && [ "${MISSING_DEPS}" -gt 0 ]; then
  echo "[ERROR] Install missing dependencies above before re-running install.sh" >&2
  exit 1
fi

if [ "${DRY_RUN}" -eq 1 ]; then
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "${TMP_DIR}"' EXIT

  render_template \
    "${OPS_AGENTS_DIR}/launchd/com.fairwork.ollama.plist.template" \
    "${TMP_DIR}/com.fairwork.ollama.plist"
  echo "[DRY-RUN] Rendered com.fairwork.ollama.plist successfully"

  if [ "${WITH_SWARM_AGENT}" -eq 1 ]; then
    render_template \
      "${OPS_AGENTS_DIR}/launchd/com.fairwork.swarm.plist.template" \
      "${TMP_DIR}/com.fairwork.swarm.plist"
    echo "[DRY-RUN] Rendered com.fairwork.swarm.plist successfully"
  fi

  if command -v plutil >/dev/null 2>&1; then
    plutil -lint "${TMP_DIR}/com.fairwork.ollama.plist"
    if [ "${WITH_SWARM_AGENT}" -eq 1 ]; then
      plutil -lint "${TMP_DIR}/com.fairwork.swarm.plist"
    fi
  fi

  echo "[DRY-RUN] Would create ${CONFIG_DIR}, ${STATE_DIR}/{logs,locks,worktrees}, ${LAUNCH_AGENTS_DIR}"
  echo "[DRY-RUN] Would copy env.example -> ${CONFIG_FILE} if absent"
  echo "[DRY-RUN] Complete. No system changes made."
  exit 0
fi

# 1. Create config and state directories
mkdir -p "${CONFIG_DIR}" "${STATE_DIR}/logs" "${STATE_DIR}/locks" "${STATE_DIR}/worktrees" "${LAUNCH_AGENTS_DIR}"

# 2. Seed config.env once (never overwrite existing user settings)
if [ ! -f "${CONFIG_FILE}" ]; then
  sed "s|^FAIRWORK_REPO_DIR=.*|FAIRWORK_REPO_DIR=\"${REPO_DIR}\"|" \
    "${OPS_AGENTS_DIR}/env.example" > "${CONFIG_FILE}"
  chmod 600 "${CONFIG_FILE}"
  echo "[OK] Created ${CONFIG_FILE}"
else
  echo "[OK] Preserved existing ${CONFIG_FILE}"
fi

# 3. Ensure executable permissions on agent scripts
chmod +x \
  "${OPS_AGENTS_DIR}/install.sh" \
  "${OPS_AGENTS_DIR}/scripts/common.sh" \
  "${OPS_AGENTS_DIR}/scripts/run-agent.sh" \
  "${OPS_AGENTS_DIR}/scripts/swarm-loop.sh" \
  "${OPS_AGENTS_DIR}/scripts/healthcheck.sh"

# 4. Render Ollama LaunchAgent plist
OLLAMA_PLIST="${LAUNCH_AGENTS_DIR}/com.fairwork.ollama.plist"
render_template "${OPS_AGENTS_DIR}/launchd/com.fairwork.ollama.plist.template" "${OLLAMA_PLIST}"
echo "[OK] Wrote ${OLLAMA_PLIST}"

if [ "${WITH_SWARM_AGENT}" -eq 1 ]; then
  SWARM_PLIST="${LAUNCH_AGENTS_DIR}/com.fairwork.swarm.plist"
  render_template "${OPS_AGENTS_DIR}/launchd/com.fairwork.swarm.plist.template" "${SWARM_PLIST}"
  echo "[OK] Wrote ${SWARM_PLIST}"
fi

# 5. Validate & reload LaunchAgents on macOS
if [ "$(uname -s)" = "Darwin" ]; then
  UID_NUM="$(id -u)"

  plutil -lint "${OLLAMA_PLIST}"
  launchctl bootout "gui/${UID_NUM}/com.fairwork.ollama" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/${UID_NUM}" "${OLLAMA_PLIST}"
  launchctl kickstart -k "gui/${UID_NUM}/com.fairwork.ollama" >/dev/null 2>&1 || true
  echo "[OK] Loaded LaunchAgent com.fairwork.ollama"

  # Ensure qwen3-coder:30b (or configured OLLAMA_MODEL) is pulled
  # shellcheck disable=SC1090
  source "${CONFIG_FILE}"
  MODEL_TO_PULL="${OLLAMA_MODEL:-qwen3-coder:30b}"
  echo "[INFO] Waiting for Ollama API to come up..."
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS --max-time 2 "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! ollama list 2>/dev/null | awk '{print $1}' | grep -Fxq "${MODEL_TO_PULL}"; then
    echo "[INFO] Pulling ${MODEL_TO_PULL}..."
    ollama pull "${MODEL_TO_PULL}"
  else
    echo "[OK] Model already available: ${MODEL_TO_PULL}"
  fi

  if [ "${WITH_SWARM_AGENT}" -eq 1 ]; then
    plutil -lint "${SWARM_PLIST}"
    launchctl bootout "gui/${UID_NUM}/com.fairwork.swarm" >/dev/null 2>&1 || true
    launchctl bootstrap "gui/${UID_NUM}" "${SWARM_PLIST}"
    echo "[OK] Loaded LaunchAgent com.fairwork.swarm"
  fi
else
  echo "[INFO] Non-macOS host detected; skipped launchctl bootstrap."
fi

echo ""
echo "Installation complete. Run ${OPS_AGENTS_DIR}/scripts/healthcheck.sh to verify."
