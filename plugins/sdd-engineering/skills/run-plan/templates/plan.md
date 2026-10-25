# Plan: <Feature>

Spec: `<specs_dir>/<name>.md` | inline R1–Rn · Modules: <module>, <module>, … · Execution mode: multi-agent | single-agent · Status: Draft | Approved

## Goal
<one sentence: what the user can do after this ships>
Not doing: <exclusions, citing the AC#/R# that keep something out of scope, or "—">

## Architecture
<2–4 sentences: how the change flows through the modules (e.g. route → service →
repository; UI hook → API client), and what stays as is>

## Commands
<the repo's real check commands, taken from its CLAUDE.md / README / package
manifest — the orchestrator runs the package gate from this section after each
wave; every task's Verify uses the same commands, narrowed to its files>
- `<module>` gate: `<typecheck + lint + tests command>`
- `<module>` integration: `<command>` (optional)
- arch check: `<arch_check command>` (optional)
- worktree bootstrap: `<bootstrap command>` (optional)

## Cross-task decisions
- **Contracts**: <schema / DTO name> — <exact fields/types; every copy that must stay in sync>
- **Data**: <table/column changes; how migrations are generated in this repo>
- **Interfaces**:
  - `GET /…` → `<ResponseSchema>`
  - `service.method(args): ReturnType`
  - `useThing(id): Result<Thing>`
- **Constraints**: <exact values from the spec — limits, formats, null handling>

## Requirements review
- **Clarified**: <question> → <answer> (AC#/R#)
- **Recommendations**: REC1 <improvement> — accepted | rejected
- **Spec updates needed**: <what the spec owner should change, or "—"> (the planner never edits the spec)

## Risks
- <risk> — <mitigation / which task handles it>
- Manual check: AC# — <who checks, how> (for `[manual]` ACs; plan-verifier reports them as UNVERIFIABLE)

---

## Wave 0 — foundation (sequential)

### T1 [SHARED] <title>
Owns: `src/shared/contracts/<x>.ts`, `src/db/schema/<x>.ts`, `src/db/migrations/<generated>`
Depends on: —
Skills: —   (namespaced, e.g. `engineering-paved-path:onion-architecture`; ≤3)
Route: agent | agent:haiku | inline   (default agent)
Steps:
1. <concrete step>
Acceptance:
- <observable criterion, ref AC# from spec>
Verify: `<typecheck command>` · `<migration generate command>`
Escalate if: <condition that means the plan is wrong>

## Wave 1 — parallel (disjoint Owns)

### T2 [P] [BE] <title>
Owns: `src/modules/<name>/…`
Depends on: T1
Skills: engineering-paved-path:onion-architecture, engineering-paved-path:fastify-best-practices   (complete list — the implementer loads only these)
Interfaces: <exact signatures this task provides/consumes>
Steps:
1. Test: `<file>.test.ts` — <case> (AC#)
2. <concrete step>
Acceptance:
- AC# [unit] <criterion>
Verify: `<test command> <file>.test.ts`
Escalate if: needs a file outside Owns

### T3 [P] [FE] <title>
Owns: `web/src/features/<name>/…`
Depends on: T1
Skills: engineering-paved-path:react-best-practices, engineering-paved-path:react-testing-library
Interfaces: <hook/component props>
Steps:
1. …
Acceptance:
- AC# [unit] …
Verify: `<test command> <paths>`
Escalate if: …

## Wave 2 — integration / e2e

### T4 [BE] <integration test>
Owns: `test/integration/<x>.it.test.ts`
Depends on: T2
Acceptance:
- AC# [it] …
Verify: `<integration test command> <x>.it.test.ts`

---

## Execution
Run with `/sdd-engineering:run-plan plan: <plans_dir>/<feature>.md` — the
procedure (dispatch, merge + gate + commit per wave, review, fix loop, finish)
lives in the `run-plan` skill's references.
Plan-specific notes for the orchestrator (host limits, skip-verify, ordering)
go here: —

## Progress
| Task | Status | Notes |
|------|--------|-------|
| T1 | todo | |
| T2 | todo | |
| T3 | todo | |
| T4 | todo | |
