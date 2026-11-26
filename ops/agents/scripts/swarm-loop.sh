#!/usr/bin/env bash
# Continuous coordinator loop for the FairWork 4-agent Mac Mini swarm.
# Runs Approver-y -> SWE-y -> PM-y -> Tester-y sequentially with stagger & clean shutdown.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

ensure_state_dirs

if ! acquire_lock "swarm-loop"; then
  log_msg "ERROR" "swarm-loop is already running; exiting"
  exit 1
fi

STOP_REQUESTED=0
handle_signal() {
  log_msg "INFO" "Received stop signal; finishing current step and exiting cleanly"
  STOP_REQUESTED=1
}
trap handle_signal INT TERM
trap 'release_lock "swarm-loop"' EXIT

log_msg "INFO" "Starting FairWork swarm loop (repo=${FAIRWORK_GH_REPO}, model=${OLLAMA_MODEL}, max_in_flight=${MAX_IN_FLIGHT})"

AGENTS=(approver-y swe-y pm-y tester-y)

while [ "${STOP_REQUESTED}" -eq 0 ]; do
  if ! check_ollama_ready; then
    log_msg "WARN" "Ollama not ready at ${OLLAMA_BASE_URL}; retrying in 30s"
    sleep 30
    continue
  fi

  for agent in "${AGENTS[@]}"; do
    if [ "${STOP_REQUESTED}" -ne 0 ]; then
      break
    fi

    if ! "${SCRIPT_DIR}/run-agent.sh" "${agent}"; then
      log_msg "WARN" "${agent} exited non-zero; continuing swarm cycle"
    fi

    if [ "${STOP_REQUESTED}" -eq 0 ]; then
      sleep "${SWARM_AGENT_STAGGER_SECONDS}"
    fi
  done

  if [ "${STOP_REQUESTED}" -eq 0 ]; then
    log_msg "INFO" "Cycle complete; sleeping ${SWARM_CYCLE_INTERVAL_SECONDS}s"
    sleep "${SWARM_CYCLE_INTERVAL_SECONDS}"
  fi
done

log_msg "INFO" "FairWork swarm loop stopped"
