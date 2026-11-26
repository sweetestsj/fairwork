#!/usr/bin/env bash
# Runs a single guarded tick for one FairWork agent: pm-y | swe-y | approver-y | tester-y

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  echo "Usage: $0 <pm-y|swe-y|approver-y|tester-y>" >&2
  exit 1
}

[ $# -eq 1 ] || usage
AGENT="$1"

case "${AGENT}" in
  pm-y|swe-y|approver-y|tester-y) ;;
  *) usage ;;
esac

PROMPT_FILE="${OPS_AGENTS_DIR}/prompts/${AGENT}.md"
if [ ! -f "${PROMPT_FILE}" ]; then
  log_msg "ERROR" "Prompt file missing: ${PROMPT_FILE}"
  exit 1
fi

ensure_state_dirs
prune_old_logs

if ! acquire_lock "${AGENT}"; then
  log_msg "INFO" "${AGENT}: already running (lock held); skipping tick"
  exit 0
fi
trap 'release_lock "${AGENT}"' EXIT

require_cmd git
require_cmd gh
require_cmd jq
require_cmd curl

if ! check_ollama_ready; then
  log_msg "ERROR" "${AGENT}: Ollama is not reachable at ${OLLAMA_BASE_URL}"
  exit 1
fi

LOG_FILE="${FAIRWORK_LOG_DIR}/${AGENT}-$(date -u '+%Y%m%d-%H%M%S').log"

# Keep origin refs fresh without touching local working trees
git -C "${FAIRWORK_REPO_DIR}" fetch origin --prune >/dev/null 2>&1 || true

run_tester_deterministic_checks() {
  local test_wt="${FAIRWORK_WORKTREE_DIR}/tester-main"
  local test_log="$1"

  git -C "${FAIRWORK_REPO_DIR}" worktree prune >/dev/null 2>&1 || true
  if [ -d "${test_wt}" ]; then
    git -C "${FAIRWORK_REPO_DIR}" worktree remove --force "${test_wt}" >/dev/null 2>&1 || rm -rf "${test_wt}"
  fi
  git -C "${FAIRWORK_REPO_DIR}" worktree add --detach "${test_wt}" origin/main >/dev/null 2>&1

  local status=0
  {
    echo "=== Tester-y deterministic run on origin/main ($(git -C "${test_wt}" rev-parse --short HEAD)) ==="
    echo "--- Backend: npm ci && npm test ---"
    (cd "${test_wt}/backend" && npm ci --no-audit --no-fund && npm test)
    echo "--- Frontend: npm ci && typecheck && test && build ---"
    (cd "${test_wt}/frontend" && npm ci --no-audit --no-fund && npm run typecheck && npm test && npm run build)
  } > "${test_log}" 2>&1 || status=$?

  git -C "${FAIRWORK_REPO_DIR}" worktree remove --force "${test_wt}" >/dev/null 2>&1 || rm -rf "${test_wt}"
  return "${status}"
}

# Pre-flight deterministic shell gates prevent wasted LLM cycles and duplicate issues
case "${AGENT}" in
  pm-y)
    active_wip="$(count_active_wip)"
    if [ "${active_wip}" -ge "${MAX_IN_FLIGHT}" ]; then
      log_msg "INFO" "pm-y: WIP cap reached (${active_wip}/${MAX_IN_FLIGHT}); skipping LLM"
      exit 0
    fi
    context="Repository: ${FAIRWORK_GH_REPO}
Active WIP: ${active_wip}/${MAX_IN_FLIGHT}
Worktree root: ${FAIRWORK_WORKTREE_DIR}"
    log_msg "INFO" "pm-y: starting tick (WIP ${active_wip}/${MAX_IN_FLIGHT}) -> ${LOG_FILE}"
    invoke_claude_ollama "${PROMPT_FILE}" "${context}" "${FAIRWORK_REPO_DIR}" > "${LOG_FILE}" 2>&1
    ;;

  swe-y)
    changes_req="$(count_prs_changes_requested)"
    open_prs="$(count_open_prs)"
    ready_issues="$(count_issues_with_label "status:ready")"

    if [ "${changes_req}" -eq 0 ] && { [ "${ready_issues}" -eq 0 ] || [ "${open_prs}" -ge "${MAX_IN_FLIGHT}" ]; }; then
      log_msg "INFO" "swe-y: nothing actionable (changes-requested=${changes_req}, open_prs=${open_prs}/${MAX_IN_FLIGHT}, ready=${ready_issues}); skipping LLM"
      exit 0
    fi

    context="Repository: ${FAIRWORK_GH_REPO}
Open PRs: ${open_prs}/${MAX_IN_FLIGHT}
PRs needing changes: ${changes_req}
Ready issues: ${ready_issues}
Isolated worktree directory to use: ${FAIRWORK_WORKTREE_DIR}"
    log_msg "INFO" "swe-y: starting tick (changes_req=${changes_req}, ready=${ready_issues}, open_prs=${open_prs}/${MAX_IN_FLIGHT}) -> ${LOG_FILE}"
    invoke_claude_ollama "${PROMPT_FILE}" "${context}" "${FAIRWORK_REPO_DIR}" > "${LOG_FILE}" 2>&1
    ;;

  approver-y)
    pending_reviews="$(count_prs_needing_review)"
    if [ "${pending_reviews}" -eq 0 ]; then
      log_msg "INFO" "approver-y: no open PRs awaiting review; skipping LLM"
      exit 0
    fi

    context="Repository: ${FAIRWORK_GH_REPO}
Open PRs awaiting review: ${pending_reviews}
Worktree directory for PR checkout verification: ${FAIRWORK_WORKTREE_DIR}
REMINDER: NEVER run gh pr merge. Only label ready-to-merge or changes-requested."
    log_msg "INFO" "approver-y: reviewing ${pending_reviews} pending PR(s) -> ${LOG_FILE}"
    invoke_claude_ollama "${PROMPT_FILE}" "${context}" "${FAIRWORK_REPO_DIR}" > "${LOG_FILE}" 2>&1
    ;;

  tester-y)
    TEST_LOG="${FAIRWORK_LOG_DIR}/tester-y-checks-$(date -u '+%Y%m%d-%H%M%S').log"
    if run_tester_deterministic_checks "${TEST_LOG}"; then
      log_msg "INFO" "tester-y: origin/main deterministic checks PASSED (${TEST_LOG}); skipping LLM"
      exit 0
    fi

    active_wip="$(count_active_wip)"
    log_msg "WARN" "tester-y: origin/main checks FAILED (${TEST_LOG}); invoking LLM for deduplicated triage -> ${LOG_FILE}"
    context="Repository: ${FAIRWORK_GH_REPO}
Active WIP: ${active_wip}/${MAX_IN_FLIGHT}
Failure log file: ${TEST_LOG}
Last 60 lines of failure output:
$(tail -n 60 "${TEST_LOG}")"
    invoke_claude_ollama "${PROMPT_FILE}" "${context}" "${FAIRWORK_REPO_DIR}" > "${LOG_FILE}" 2>&1
    ;;
esac

log_msg "INFO" "${AGENT}: tick completed (${LOG_FILE})"
