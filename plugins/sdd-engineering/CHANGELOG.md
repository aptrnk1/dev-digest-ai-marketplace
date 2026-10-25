# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow
[Semantic Versioning](https://semver.org/). Release tag:
`sdd-engineering--v<version>`.

## [Unreleased]

## [1.1.0] - 2026-10-25

### Changed
- README, CHANGELOG, the `spec-authoring` skill, its references and the spec
  template are now in English. `spec-creator` writes new specs in English with
  English template headings (`## Problem and user`, `## Design`,
  `## Screens and states`, `## Module interaction`).

### Compatibility
- Legacy Ukrainian headings (`## Проблема й користувач`, `## Дизайн`,
  `## Екрани й стани`, `## Взаємодія модулів`, `Статус:`) and EARS keywords
  (КОЛИ / ПОКИ / ЯКЩО … ТОДІ / ДЕ) in existing specs are still recognised.

## [1.0.0] - 2026-10-25

First release. Agents, skills and scripts were taken from one project's working
SDD pipeline and generalised: project paths, commands and rules were replaced by
parameters with defaults.

### Added
- Agent `spec-creator`: a Ukrainian draft spec with EARS criteria, a UI states
  matrix, trust boundaries and traceability. As the main session it dispatches up to 4
  `research-tools:researcher`.
- Agent `implementation-planner`: a plan in waves with `Owns`, `Skills`, `Route`,
  `Verify`, AC coverage and a `## Commands` section.
- Agent `implementer`: one task test-first, statuses `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`.
- Agent `plan-verifier`: read-only traceability Req → task → `file:line` → test → command.
- Skill `run-plan`: plan-lint + GATE → waves → final review (plan-verifier,
  architecture-reviewer, `/code-review`) → fix loop ≤3 → finish.
  Script `scripts/plan-lint.mjs`, template `templates/plan.md`.
- Skill `workflow-retro`: a retro of a multi-agent run, script
  `scripts/workflow-stats.mjs` (with a `--projects` option for archived transcripts).
- Skill `spec-authoring`: EARS, UI states, LLM trust boundaries, Mermaid, the spec
  template, the `save-designs.mjs` script.
- `PreToolUse` guard hooks for `spec-creator` and `implementation-planner` in
  `hooks/hooks.json` (filtered by `agent_type`).
- Evals: cases for `spec-creator`, `implementation-planner`, `implementer`,
  `plan-verifier`, `run-plan`, `workflow-retro`.
- Dependencies: `engineering-paved-path`, `research-tools`, `architecture-review` (`^1.0.0`).

### Changed (compared with the original source)
- The paths `specs/`, `specs/plans/`, `reports/`, `designs/`, `retros/` became the
  parameters `specs_dir`, `plans_dir`, `reports_dir`, `designs_dir`, `retros_dir`.
- The project's check wrapper was replaced by commands from the plan's `## Commands` section and
  task `Verify`. Worktree preparation was replaced by the `bootstrap` parameter.
- `plan-lint.mjs`: the skills existence check now works from a `--skills` list
  (namespaced names), the "Verify only through the wrapper" rule was removed, the
  `[it]`/`[e2e]` lane heuristics are no longer tied to a specific repo's layout.
- Agents and skills are called by namespaced names (`sdd-engineering:implementer`,
  `architecture-review:architecture-reviewer`, `engineering-paved-path:<skill>`).
- Finish no longer calls the documentation and insights agents. It shows lessons
  candidates to the user and asks where to record them.

### Provenance
Original source: the `.claude/` directory (agents, skills, hooks) and `scripts/` of the
dev-digest project, MIT License © 2026 Ivan Lapa.
