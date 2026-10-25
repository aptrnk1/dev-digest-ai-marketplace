---
name: spec-authoring
description: "Writing and reviewing Spec Driven Development feature specs: EARS acceptance criteria (5 patterns + combinations), ISO/IEC/IEEE 29148 quality attributes, weak words, verification hints (unit / it / e2e / manual), NFRs and the US → AC → verification traceability matrix; plus the Screens × states method for UI designs (Nielsen heuristics, WCAG 2.2 AA), trust boundaries for LLM-facing features (OWASP Top 10 for LLM Applications 2025), Mermaid for module-interaction diagrams, the spec template and the script that saves chat screenshots as design files. Use when writing or reviewing a spec, its Acceptance criteria / NFRs, its UI states or its Inputs and provenance / Untrusted inputs sections."
---

# Spec authoring (SDD)

A requirement is good when two engineers who read it independently would build
the same thing, and a tester can say pass/fail without asking anyone.

This skill is the method behind `sdd-engineering:spec-creator`. Pieces that a
spec needs only sometimes live in `references/` next to this file — read the
one you need with `Read`:

| File | Read when |
|---|---|
| `references/ears-examples.md` | you want bad → good examples of ACs and NFRs |
| `references/ux-states.md` | the feature has UI, or you analyse a design |
| `references/llm-trust-boundaries.md` | any input reaches an LLM, or LLM / user / repo data is shown or stored |
| `references/mermaid.md` (+ `mermaid-examples.md`) | the module-interaction section needs a diagram |
| `templates/spec.md` | the output format (unless the repo has its own `<specs_dir>/_template.md`) |

Paths: `${CLAUDE_SKILL_DIR}/references/…`, `${CLAUDE_SKILL_DIR}/templates/spec.md`.

## 1. Patterns

| Type | Template | When |
|---|---|---|
| `ubiquitous` | The system shall <response>. | always applies, no trigger |
| `event` | WHEN <trigger>, the system shall <response>. | reaction to a single event |
| `state` | WHILE <state>, the system shall <response>. | behaviour for the duration of a state |
| `unwanted` | IF <unwanted condition>, THEN the system shall <response>. | errors, failures, abuse |
| `optional` | WHERE <option is enabled / feature is present>, the system shall <response>. | settings, feature flags |

**Combinations** (type = `complex`) — the keyword order is fixed:
`WHERE … WHILE … WHEN … the system shall …`.
Example: "WHILE an import is running, WHEN the user clicks Re-import, the API
shall respond 409 `import_in_progress`."

**Subject.** "The system" may be narrowed to whatever is visible from outside:
`UI`, `API`, `CLI`, `MCP server`, `background worker`. Never a class, file or
function.

Legacy specs written in Ukrainian use the keywords КОЛИ / ПОКИ / ЯКЩО … ТОДІ /
ДЕ and «система повинна (shall)»; read them as WHEN / WHILE / IF … THEN /
WHERE / "the system shall".

## 2. Quality attributes (ISO/IEC/IEEE 29148)

Every AC must be:
- **singular** — one behaviour. "… and show a toast, and write a log" → two ACs;
- **unambiguous** — one reading (see weak words below);
- **verifiable** — there is an observable result and a way to check it;
- **feasible** — does not contradict project rules (`CLAUDE.md`: do-not-touch,
  secrets, migrations);
- **necessary** — remove the AC and something important goes unverified;
- **implementation-free** — describes behaviour, not code;
- **consistent** — does not contradict other ACs/NFRs (check pairs with the same trigger).

## 3. Weak words → replace

| Weak | Replace with |
|---|---|
| fast, instant, without delay | `≤ N ms/s` at what volume (p95) |
| convenient, intuitive, nice | a concrete action/state: "focus moves to …", "button disabled with hint …" |
| correctly, properly, appropriately | which result exactly: status, text, data |
| if needed, if possible, preferably | a `WHERE`/`IF` condition, or move to Open questions |
| etc., and so on, for example, and/or | the full list |
| support X | what exactly the user can do with X |
| large, many, long | a number: `> 500 files`, `> 200 characters` |
| handle the error | an `unwanted` AC: what the user sees, what stays in the DB |
| must be secure | concrete isolation (see `references/llm-trust-boundaries.md`, `engineering-paved-path:security`) |

## 4. Verification hints

Every AC gets one or more tags — the lane it is verified in
(take the lanes from the repo's testing guide if there is one):

- `[unit]` — pure logic, an API handler with fakes/mocks, a UI component test,
  an engine test without I/O;
- `[it]` — needs real infrastructure (DB, queue): transactions, migrations,
  concurrency, a 409 caused by DB state;
- `[e2e]` — a scenario visible in the browser or CLI on seed data; **never**
  checks LLM output (e2e is deterministic, without an LLM);
- `[manual]` — only if automation is impossible (visuals, a real LLM);
  say who checks and how.

Behaviour that depends on an LLM response is verified with `[unit]`/`[it]` and a
mock provider, not `[e2e]`.

## 5. NFR

Format: `**NFR<n>** <attribute>: <requirement with a number> — verification: <how>`.
Typical attributes: UI/API latency, background job duration, limits (input
size, number of files, tokens), LLM call cost, a11y (WCAG 2.2 AA),
i18n (all strings in the repo's string catalog), resilience (what happens on a
restart mid-job), observability (errors are logged).

An NFR without a number or without a way to verify it is a wish; rephrase it or
move it to Open questions.

## 6. Traceability

The matrix at the end of the spec:

| US | AC | Edge cases | Verification |
|---|---|---|---|
| US1 | AC1, AC2 | EC1 | AC1 [unit], AC2 [e2e] |

Rules: every US has ≥1 AC; every AC refers to a US (or is marked
`(system)` for cross-cutting requirements — security, NFR-derived); every Edge case →
AC or Open question; every AC has a verification tag.

## 7. Designs (screenshots → files)

Subagents cannot see chat attachments, so designs are saved as files
`<designs_dir>/<YYYY-MM-DD>-<slug>/D1.png, D2.png…` (default
`designs_dir` = `specs/designs/`), and any agent reads them with `Read`.
`spec-creator` has no Bash, so the script is run by the orchestrator or the user (in
the Claude Code prompt — with the `!` prefix):

```bash
node "${CLAUDE_SKILL_DIR}/scripts/save-designs.mjs" specs/designs/2026-01-15-order-refund
#   default    images from the user's latest message that has any
#   --all      every image the user attached in this session
#   --file P   also copy a file from disk (repeatable)
#   --session  session id (default: $CLAUDE_CODE_SESSION_ID)
```

Files are numbered after the existing `D<n>`; a duplicate (sha256) is skipped.
The design index is the spec's `## Design` section.

## 8. Review checklist (for a spec reviewer)

- [ ] Every AC: ID, type, the type's keywords, one behaviour, an outside subject.
- [ ] No weak word from §3.
- [ ] Every `event` has a matching `unwanted` (what happens when the trigger
      fails), or an explicit reason why it is not needed.
- [ ] No two ACs with the same trigger and a different response.
- [ ] Numbers agree across ACs, NFRs and Edge cases.
- [ ] Traceability is complete (§6).
- [ ] Every non-ideal Screens × states cell → AC or Open question
      (`references/ux-states.md`).
- [ ] Every untrusted input has isolation (`references/llm-trust-boundaries.md`).

## Sources

- Alistair Mavin, [EARS — Easy Approach to Requirements Syntax](https://alistairmavin.com/ears/).
- ISO/IEC/IEEE 29148 — requirement quality attributes.
- GitHub Spec Kit, [spec template](https://github.com/github/spec-kit/blob/main/templates/spec-template.md).
- Nielsen Norman Group, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/); [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/).
