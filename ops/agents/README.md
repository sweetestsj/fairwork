# FairWork Mac Mini Agent Ops (`ops/agents/`)

Version-controlled, sanitized automation for running the 4-agent FairWork swarm (`PM-y`, `SWE-y`, `Approver-y`, `Tester-y`) on an **Apple M4 Pro Mac Mini (48 GB RAM)** using **Claude Code + Ollama 0.40.16 (`qwen3-coder:30b`)**, with manual PR review and merge oversight from a MacBook Air.

## Architecture & Guardrails

| Agent | Responsibility | Pre-flight Shell Gate |
| --- | --- | --- |
| **PM-y** | Plans next non-overlapping vertical slice (`<= 4` files / `<= 250` LOC) from `ROADMAP.md` & `PRODUCT.md`, deduplicates issues, applies `status:ready`. | Skips LLM if open PRs + `status:ready` + `in-progress` issues >= `MAX_IN_FLIGHT` (`2`). |
| **SWE-y** | Addresses `changes-requested` PRs first; otherwise claims one non-overlapping `status:ready` issue in an isolated git worktree (`feat/<issue>-work`), runs backend + frontend tests, opens PR. | Skips LLM if there are no `changes-requested` PRs and no actionable `status:ready` issues under the WIP cap. |
| **Approver-y** | Reviews open PRs lacking `ready-to-merge` / `changes-requested`, verifies diff size & test suite, labels `ready-to-merge` or `changes-requested`. **Never merges PRs.** | Skips LLM if no open PR needs review. |
| **Tester-y** | Runs deterministic backend Jest + frontend typecheck/Vitest/build checks on `main`; invokes LLM only on failure to file a single deduplicated `bug` issue. | Deterministic shell test run executes first; zero LLM tokens spent when `main` is green. |

### Locked-in Operational Policies
- **Manual PR merges only:** Agents never run `gh pr merge`; human reviews `ready-to-merge` PRs from the MacBook Air.
- **Max 2 in flight:** At most `2` non-overlapping issues/PRs in flight simultaneously (`MAX_IN_FLIGHT=2`).
- **Local inference only:** `ANTHROPIC_BASE_URL` points to `http://127.0.0.1:11434` and `ANTHROPIC_API_KEY` is explicitly unset so Claude Code never bills external Anthropic APIs.
- **No secrets in git:** Local machine paths and overrides live in `~/.config/fairwork-agents/config.env` (created from `env.example`).

## M4 Pro 48 GB Ollama Tuning (`com.fairwork.ollama.plist.template`)

| Setting | Value | Rationale |
| --- | --- | --- |
| `OLLAMA_HOST` | `127.0.0.1:11434` | Loopback-only binding. |
| `OLLAMA_FLASH_ATTENTION` | `1` | Faster attention and lower KV memory on Apple Silicon Metal. |
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | Cuts KV cache RAM ~50% with negligible quality loss for 32k context. |
| `OLLAMA_CONTEXT_LENGTH` | `32768` | Fits Claude Code prompts, tool calls, and diffs cleanly inside 48 GB RAM. |
| `OLLAMA_NUM_PARALLEL` | `2` | Matches `MAX_IN_FLIGHT=2` without memory pressure. |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Prevents loading a second 20 GB model and swapping. |
| `OLLAMA_KEEP_ALIVE` | `30m` | Keeps `qwen3-coder:30b` resident between ticks to avoid cold-load pauses. |

## Mac Mini Installation

```bash
# 1. Pull latest main on the Mac Mini
git pull origin main

# 2. Preview what install.sh will configure (no system changes)
./ops/agents/install.sh --dry-run

# 3. Install tuned Ollama LaunchAgent + local config (~/.config/fairwork-agents/config.env)
./ops/agents/install.sh

# 4. (Optional) Also install the background swarm LaunchAgent
./ops/agents/install.sh --with-swarm-agent
```

Edit `~/.config/fairwork-agents/config.env` if your repo checkout path differs from `~/fairwork`.

## Day-to-Day Commands

```bash
# Check Ollama, model readiness, gh auth, WIP counts, and recent logs
./ops/agents/scripts/healthcheck.sh

# Run a single agent tick manually
./ops/agents/scripts/run-agent.sh pm-y
./ops/agents/scripts/run-agent.sh swe-y
./ops/agents/scripts/run-agent.sh approver-y
./ops/agents/scripts/run-agent.sh tester-y

# Run the foreground swarm loop (e.g. inside tmux)
./ops/agents/scripts/swarm-loop.sh
```

## Remote Oversight from MacBook Air

```bash
# Review PRs approved by Approver-y
gh pr list -R sweetestsj/fairwork --label ready-to-merge

# Check Mac Mini health over SSH
ssh <mac-mini-host> '~/fairwork/ops/agents/scripts/healthcheck.sh'

# Tail swarm logs over SSH
ssh <mac-mini-host> 'tail -n 100 -f ~/.local/state/fairwork-agents/logs/swarm.stdout.log'
```
