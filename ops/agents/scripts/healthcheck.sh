#!/usr/bin/env bash
# Health check for the FairWork Mac Mini 4-agent swarm (safe to invoke over SSH from MacBook Air).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

FAILURES=0

echo "=== FairWork Mac Mini Swarm Healthcheck ==="
echo "Timestamp : $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Repo      : ${FAIRWORK_GH_REPO} (${FAIRWORK_REPO_DIR})"
echo "Model     : ${OLLAMA_MODEL} @ ${OLLAMA_BASE_URL}"
echo "WIP Cap   : ${MAX_IN_FLIGHT}"
echo ""

# 1. Ollama service & model check
if check_ollama_ready; then
  echo "[OK] Ollama API reachable at ${OLLAMA_BASE_URL}"
  if curl -fsS --max-time 5 "${OLLAMA_BASE_URL}/api/tags" | jq -e --arg m "${OLLAMA_MODEL}" '.models[]? | select(.name == $m)' >/dev/null 2>&1; then
    echo "[OK] Model present: ${OLLAMA_MODEL}"
  else
    echo "[FAIL] Model missing in Ollama: ${OLLAMA_MODEL} (run: ollama pull ${OLLAMA_MODEL})"
    FAILURES=$((FAILURES + 1))
  fi

  running_models="$(curl -fsS --max-time 5 "${OLLAMA_BASE_URL}/api/ps" | jq -r '[.models[]?.name] | join(", ")' 2>/dev/null || true)"
  echo "[INFO] Loaded in memory: ${running_models:-none}"
else
  echo "[FAIL] Ollama API unreachable at ${OLLAMA_BASE_URL}"
  FAILURES=$((FAILURES + 1))
fi

# 2. GitHub CLI auth & WIP summary
if gh auth status >/dev/null 2>&1; then
  echo "[OK] gh CLI authenticated"
  open_prs="$(count_open_prs)"
  ready_issues="$(count_issues_with_label "status:ready")"
  in_progress="$(count_issues_with_label "in-progress")"
  ready_to_merge="$(gh pr list -R "${FAIRWORK_GH_REPO}" --state open --label "ready-to-merge" --limit 50 --json number --jq 'length')"
  changes_req="$(count_prs_changes_requested)"
  echo "[INFO] WIP Summary: open_prs=${open_prs} (ready-to-merge=${ready_to_merge}, changes-requested=${changes_req}), status:ready=${ready_issues}, in-progress=${in_progress}, total_wip=$((open_prs + ready_issues + in_progress))/${MAX_IN_FLIGHT}"
else
  echo "[FAIL] gh CLI is not authenticated"
  FAILURES=$((FAILURES + 1))
fi

# 3. Active locks & worktrees
if [ -d "${FAIRWORK_LOCK_DIR}" ]; then
  active_locks="$(find "${FAIRWORK_LOCK_DIR}" -maxdepth 1 -name '*.lock' -exec basename {} \; 2>/dev/null | tr '\n' ' ' || true)"
  echo "[INFO] Active locks: ${active_locks:-none}"
fi

if [ -d "${FAIRWORK_REPO_DIR}/.git" ]; then
  wt_count="$(git -C "${FAIRWORK_REPO_DIR}" worktree list 2>/dev/null | wc -l | tr -d ' ')"
  echo "[INFO] Git worktrees: ${wt_count}"
fi

# 4. Recent log files
if [ -d "${FAIRWORK_LOG_DIR}" ]; then
  echo ""
  echo "Recent logs (${FAIRWORK_LOG_DIR}):"
  ls -lt "${FAIRWORK_LOG_DIR}" 2>/dev/null | head -n 8 || true
fi

if [ "${FAILURES}" -gt 0 ]; then
  echo ""
  echo "Healthcheck finished with ${FAILURES} failure(s)."
  exit 1
fi

echo ""
echo "Healthcheck PASSED."
