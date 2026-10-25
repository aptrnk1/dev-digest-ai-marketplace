# Phase 4 — execute the plan wave by wave

Goal: every check still runs; tokens are saved by not repeating work.
This is the single source of the execution procedure (a plan's own
`## Execution` section only adds plan-specific notes — this file wins).

**Single-agent mode** (`Execution mode: single-agent`): you run the tasks
yourself in wave order on the feature branch, each task's Verify after it,
loading only the task's `Skills:`. Skip Dispatch §1–3 and Merge §5. Progress,
the per-wave gate + commit, and Phases 5–7 still apply.

## Dispatch

1. One `sdd-engineering:implementer` per task. Delegation message, in this
   order (the shared part first and byte-identical across a wave, so parallel
   workers hit the prompt cache; the task-specific part last):
   ```
   plan: <plans_dir>/<feature>.md
   <wave notes: interfaces from earlier tasks, known host limits, project rules>
   branch: feature/<slug>           # worktree runs: ff-merge this first
   report: <reports_dir>/<feature>/T<n>.md
   commit: yes                      # worktree runs only
   skip-verify: <cmd> — <reason>    # only if a Verify command can't run here
   task: T<n>
   ```
   Pass only interfaces later tasks consume — not whole earlier reports.
   The implementer writes its full report to `report:` and returns ≤15 lines.
2. Per task pick the cheapest route that keeps its Verify (the task's
   `Route:` field is the planner's suggestion):
   | Task shape | Route |
   |---|---|
   | ≤ ~10 lines in one `Owns`, no design (fixture, copy, a constant) | you do it inline + run its Verify |
   | mechanical: wording, renames, fixture tweaks, exact-list follow-ups | `implementer` with `model: "haiku"` |
   | real logic, security, cross-layer | `implementer` (default `sonnet`) |
3. `isolation: "worktree"` only for `[P]` tasks big enough to gain from
   parallelism; a small or lone task runs on the feature branch in the main
   checkout. If a `bootstrap` command is set (input or plan `## Commands`),
   run it in each new worktree right after the Agent calls return, before
   workers need dependencies.
4. Never dispatch a task whose result is known in advance: a Verify command
   documented as unable to run on this host (repo docs, an earlier report)
   goes into `skip-verify`.

## Merge, gate, commit

5. Merge worktree results into `feature/<slug>` one at a time; a conflict
   means the tasks were not independent — stop and escalate (review-fix.md
   §Plan change), not fix the code.
6. After the wave: run the package gate from the plan's `## Commands` once
   per touched module — the only place the full suite runs during a wave.
   Append a short result (command · pass/fail · failing lines only) to
   `<reports_dir>/<feature>/verify-<sha>.md`. A red gate → the owning
   implementer gets the failure via `SendMessage` (≤2 tries), then escalate
   to the user.
7. Update `## Progress` from the short reports (workers never edit the plan).
   `NEEDS_CONTEXT` / `BLOCKED` → resolve before the next wave (answer from
   the plan/code, ask the user, or escalate a plan change); never re-dispatch an
   unchanged task. `DONE_WITH_CONCERNS` → note the concern in Progress; it is
   re-checked in Phase 5.
8. Commit the wave on the feature branch (code + plan Progress + reports +
   flow.md with `Wave: <n+1>`): `<feature>: wave <n> (T…)`.

## Mid-wave review

9. Only when a later wave consumes this wave's interfaces: one
   `architecture-review:architecture-reviewer` with `model: "sonnet"`,
   `scope: diff <wave-start>..HEAD`, `plan` + the wave's tasks (+ `arch_check`
   if set). Its critical/major findings are fixed now (same implementer via
   `SendMessage` with `fixes:`), before the next wave builds on them; minor
   ones go to the Phase 5 ledger.

When the last wave is committed → set `Phase: 5` in flow.md and go to
`${CLAUDE_SKILL_DIR}/references/review-fix.md`.
