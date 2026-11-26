#!/usr/bin/env bash
# Shared helper library for FairWork Mac Mini 4-agent swarm scripts.
# Compatible with macOS default Bash 3.2+ and Linux Bash.

set -euo pipefail

OPS_AGENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_REPO_DIR="$(cd "${OPS_AGENTS_DIR}/../.." && pwd)"

# Load user config if present, then apply sanitized defaults
FAIRWORK_AGENT_CONFIG="${FAIRWORK_AGENT_CONFIG:-${HOME}/.config/fairwork-agents/config.env}"
if [ -f "${FAIRWORK_AGENT_CONFIG}" ]; then
  # shellcheck disable=SC1090
  source "${FAIRWORK_AGENT_CONFIG}"
fi

FAIRWORK_GH_REPO="${FAIRWORK_GH_REPO:-sweetestsj/fairwork}"
FAIRWORK_REPO_DIR="${FAIRWORK_REPO_DIR:-${DEFAULT_REPO_DIR}}"
FAIRWORK_STATE_DIR="${FAIRWORK_STATE_DIR:-${HOME}/.local/state/fairwork-agents}"
FAIRWORK_WORKTREE_DIR="${FAIRWORK_WORKTREE_DIR:-${FAIRWORK_STATE_DIR}/worktrees}"
FAIRWORK_LOG_DIR="${FAIRWORK_STATE_DIR}/logs"
FAIRWORK_LOCK_DIR="${FAIRWORK_STATE_DIR}/locks"

OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3-coder:30b}"
ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-ollama}"

MAX_IN_FLIGHT="${MAX_IN_FLIGHT:-2}"
AGENT_MAX_TURNS="${AGENT_MAX_TURNS:-30}"
AGENT_TIMEOUT_SECONDS="${AGENT_TIMEOUT_SECONDS:-900}"
CLAUDE_EXTRA_ARGS="${CLAUDE_EXTRA_ARGS:---dangerously-skip-permissions}"
SWARM_CYCLE_INTERVAL_SECONDS="${SWARM_CYCLE_INTERVAL_SECONDS:-180}"
SWARM_AGENT_STAGGER_SECONDS="${SWARM_AGENT_STAGGER_SECONDS:-10}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-14}"

ensure_state_dirs() {
  mkdir -p "${FAIRWORK_LOG_DIR}" "${FAIRWORK_LOCK_DIR}" "${FAIRWORK_WORKTREE_DIR}"
}

log_msg() {
  local level="$1"
  shift
  printf '[%s] [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "${level}" "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log_msg "ERROR" "Required command not found in PATH: ${cmd}"
    return 1
  fi
}

# Portable atomic lock using mkdir with stale-PID recovery
acquire_lock() {
  local name="$1"
  local lock_path="${FAIRWORK_LOCK_DIR}/${name}.lock"
  local pid_file="${lock_path}/pid"

  ensure_state_dirs

  if mkdir "${lock_path}" 2>/dev/null; then
    echo "$$" > "${pid_file}"
    return 0
  fi

  # Check if existing lock belongs to a dead process
  if [ -f "${pid_file}" ]; then
    local existing_pid
    existing_pid="$(cat "${pid_file}" 2>/dev/null || true)"
    if [ -n "${existing_pid}" ] && ! kill -0 "${existing_pid}" 2>/dev/null; then
      log_msg "WARN" "Removing stale lock for ${name} (dead PID ${existing_pid})"
      rm -rf "${lock_path}"
      if mkdir "${lock_path}" 2>/dev/null; then
        echo "$$" > "${pid_file}"
        return 0
      fi
    fi
  fi

  return 1
}

release_lock() {
  local name="$1"
  local lock_path="${FAIRWORK_LOCK_DIR}/${name}.lock"
  rm -rf "${lock_path}"
}

check_ollama_ready() {
  curl -fsS --max-time 5 "${OLLAMA_BASE_URL}/api/tags" >/dev/null 2>&1
}

count_open_prs() {
  gh pr list -R "${FAIRWORK_GH_REPO}" --state open --limit 50 --json number --jq 'length'
}

count_issues_with_label() {
  local label="$1"
  gh issue list -R "${FAIRWORK_GH_REPO}" --state open --label "${label}" --limit 50 --json number --jq 'length'
}

count_active_wip() {
  local open_prs ready_issues in_progress_issues
  open_prs="$(count_open_prs)"
  ready_issues="$(count_issues_with_label "status:ready")"
  in_progress_issues="$(count_issues_with_label "in-progress")"
  echo $((open_prs + ready_issues + in_progress_issues))
}

count_prs_needing_review() {
  gh pr list -R "${FAIRWORK_GH_REPO}" --state open --limit 50 --json number,labels \
    --jq '[.[] | select((.labels | map(.name) | index("ready-to-merge") | not) and (.labels | map(.name) | index("changes-requested") | not))] | length'
}

count_prs_changes_requested() {
  gh pr list -R "${FAIRWORK_GH_REPO}" --state open --label "changes-requested" --limit 50 --json number --jq 'length'
}

# Run a command with a wall-clock timeout (uses timeout/gtimeout when available, falls back to POSIX watchdog)
run_with_timeout() {
  local seconds="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout "${seconds}" "$@"
    return $?
  fi

  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout "${seconds}" "$@"
    return $?
  fi

  "$@" &
  local cmd_pid=$!
  (
    sleep "${seconds}"
    if kill -0 "${cmd_pid}" 2>/dev/null; then
      kill -TERM "${cmd_pid}" 2>/dev/null || true
      sleep 5
      kill -KILL "${cmd_pid}" 2>/dev/null || true
    fi
  ) &
  local watchdog_pid=$!

  local status=0
  wait "${cmd_pid}" || status=$?
  kill "${watchdog_pid}" 2>/dev/null || true
  wait "${watchdog_pid}" 2>/dev/null || true
  return "${status}"
}

# Invoke Claude Code strictly against local Ollama (never hits paid Anthropic API)
invoke_claude_ollama() {
  local prompt_file="$1"
  local extra_context="${2:-}"
  local workdir="${3:-${FAIRWORK_REPO_DIR}}"

  require_cmd claude

  local prompt_text
  prompt_text="$(cat "${prompt_file}")"
  if [ -n "${extra_context}" ]; then
    prompt_text="${prompt_text}

---
## Runtime Context
${extra_context}"
  fi

  # Split optional CLAUDE_EXTRA_ARGS safely for Bash 3.2
  local extra_args=()
  if [ -n "${CLAUDE_EXTRA_ARGS}" ]; then
    # shellcheck disable=SC2206
    extra_args=(${CLAUDE_EXTRA_ARGS})
  fi

  (
    cd "${workdir}"
    unset ANTHROPIC_API_KEY
    export ANTHROPIC_BASE_URL="${OLLAMA_BASE_URL}"
    export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN}"
    export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

    run_with_timeout "${AGENT_TIMEOUT_SECONDS}" \
      claude -p "${prompt_text}" \
        --model "${OLLAMA_MODEL}" \
        --max-turns "${AGENT_MAX_TURNS}" \
        "${extra_args[@]}"
  )
}

prune_old_logs() {
  if [ -d "${FAIRWORK_LOG_DIR}" ]; then
    find "${FAIRWORK_LOG_DIR}" -type f -name '*.log' -mtime "+${LOG_RETENTION_DAYS}" -delete 2>/dev/null || true
  fi
}
