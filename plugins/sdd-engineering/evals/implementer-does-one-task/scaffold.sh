#!/usr/bin/env bash
set -euo pipefail
mkdir -p specs/plans src test
cat > specs/plans/slugify.md <<'PLAN'
# Plan: Slugify helper

Spec: inline R1–R2 · Modules: lib · Execution mode: single-agent · Status: Approved

## Goal
Titles can be turned into URL slugs.
Not doing: —

## Commands
- `lib` gate: `node --test`

## Requirements
- **R1** `slugify(s)` lowercases, trims and joins words with `-`.
- **R2** `slugify` drops every character outside `[a-z0-9-]`.

## Cross-task decisions
- **Interfaces**: `slugify(s: string): string` exported from `src/slugify.js`

## Requirements review
- **Clarified**: —

## Risks
- —

---

## Wave 0 — foundation (sequential)

### T1 [BE] slugify basics
Owns: `src/slugify.js`, `test/slugify.test.js`
Depends on: —
Skills: —
Route: agent
Steps:
1. Test: `test/slugify.test.js` — "Hello World" → "hello-world" (R1)
2. Implement `slugify`.
Acceptance:
- R1 [unit] `slugify("  Hello World ")` returns `hello-world`
Verify: `node --test test/slugify.test.js`
Escalate if: needs a file outside Owns

### T2 [BE] strip unsafe characters
Owns: `src/slugify.js`, `test/slugify-strip.test.js`
Depends on: T1
Skills: —
Route: agent
Steps:
1. Test: `test/slugify-strip.test.js` — "Ça va?!" → "a-va" (R2)
2. Extend `slugify`.
Acceptance:
- R2 [unit] `slugify("Ça va?!")` returns `a-va`
Verify: `node --test test/slugify-strip.test.js`
Escalate if: needs a file outside Owns

---

## Execution
Plan-specific notes: —

## Progress
| Task | Status | Notes |
|------|--------|-------|
| T1 | todo | |
| T2 | todo | |
PLAN
printf '{"name":"lib","type":"module","scripts":{"test":"node --test"}}
' > package.json

git init -q && git add -A && git -c user.email=e@x -c user.name=eval commit -qm init
