# Spec: <feature name>
Spec ID: SPEC-YYYY-MM-DD-<slug>
Status: draft | approved | implemented | superseded by <Spec ID>
Supersedes: <link to the previous spec if this one replaces it; otherwise "—">
Modules: <which repo modules (packages, apps, services) the feature touches>
Design: <`<designs_dir>/<date>-<slug>/` (D1–Dn, indexed in §Design); otherwise "—">

<!--
Filling rules (comments are not carried into the finished spec):
- Language: English; code, paths, endpoint, table and contract names as in the code.
- The spec describes WHAT and WHY, not HOW: no file, class or function names. A
  contract (endpoint, status code, field) is fine when it is observable behaviour.
- Designs live in `<designs_dir>/<date>-<slug>/` (default `specs/designs/`);
  an AC may refer to "D2" (everyone can see what it shows in the file), but
  behaviour that must be verified is still written as an AC — "as in the
  design" without an AC does not count.
- IDs (US, AC, EC, NFR) are not renumbered after approval: a removed item is
  marked "(removed) <reason>".
- EARS rules, weak words, verification tags: skill `sdd-engineering:spec-authoring`.
-->

## Problem and user
<!-- Who the user is, what hurts, what they do today and why that is not enough. -->

## Goals / Non-goals
**Goals**
- …

**Non-goals**
- …

## User stories
- **US1** As a <role>, I <action>, so that <value>.

## Design
<!-- Designs the user pasted into the chat are stored in the repo:
     `<designs_dir>/<YYYY-MM-DD>-<slug>/D1.png, D2.png…` (the save-designs.mjs
     script of the spec-authoring skill). Any agent reads them with Read. This is
     only the index: one row per file. No design → "—" and why (for example,
     "no UI" or "UI follows <page>"). -->
| D# | File | Screen / state |
|----|------|----------------|
| D1 | `specs/designs/<date>-<slug>/D1.png` | <what it shows: screen, state shown> |

## Screens and states
<!-- Only if there is UI; otherwise "—". Method: spec-authoring → references/ux-states.md.
     Each cell is a D# (drawn), a short description or an AC# (added by the spec);
     "?" → Open questions. Every D# from §Design appears in at least one
     cell. Reference page for consistency: <path to a similar page>. -->
| Screen | ideal | empty | loading | partial | error |
|--------|-------|-------|---------|---------|-------|
| … | … | … | … | … | … |

## Module interaction
<!-- Who calls whom for each user action; what exists and what is new.
     A shared contract goes in every copy of it if the repo keeps several.
     A diagram only if needed, one (spec-authoring → references/mermaid.md). -->
| Action | Path (UI → API → service → DB / LLM / external API) | Contract / endpoint | New or existing |
|--------|------|------|------|
| … | … | … | … |

Impact on other consumers: <CLI, MCP tools, other pages, seed, e2e flows, or "—">

## Acceptance criteria (EARS)
<!--
Format: **AC<n>** (<type>, US<n> | system) <sentence> `[unit|it|e2e|manual]`
- ubiquitous — "The system shall …"
- event      — "WHEN <event>, the system shall …"
- state      — "WHILE <state>, the system shall …"
- unwanted   — "IF <unwanted condition>, THEN the system shall …"
- optional   — "WHERE <option is enabled>, the system shall …"
- complex    — "WHERE … WHILE … WHEN … the system shall …"
Behaviour that depends on an LLM is not [e2e] (e2e runs without an LLM).
-->
- **AC1** (event, US1) WHEN …, the system shall … `[unit]`

## Edge cases
<!-- Case → expected behaviour → AC# (or "→ Open questions"). -->
- **EC1** … → … (AC#)

## Non-functional requirements
<!-- A number + a way to verify it. Latency, limits, sizes, LLM cost,
     a11y (WCAG 2.2 AA), i18n (string catalog), resilience to restarts. -->
- **NFR1** <attribute>: <requirement with a number> — verification: <how>

## Inputs and provenance
<!-- Every input of the feature: where it comes from and who/where validates it.
     Method: spec-authoring → references/llm-trust-boundaries.md. -->
| Input | Source (trusted / user / external content / LLM / secrets) | Validation |
|-------|---------|-----------|
| … | … | … |

## Untrusted inputs
<!-- <input> → <where: prompt | UI | FS | DB | external service> → <isolation>.
     Nothing untrusted → say explicitly why. -->
- …

## Assumptions
<!-- What was decided without the user's confirmation and may be challenged in review. -->
- …

## Open questions
<!-- Question · options · who decides · blocking / non-blocking.
     A spec can be approved only without blocking questions. Empty → "—". -->
- …

## Traceability
<!-- Every US has ≥1 AC; every EC → AC or Open question; every AC has a tag. -->
| US | AC | EC | NFR | Verification |
|----|----|----|-----|--------------|
| US1 | AC1 | EC1 | — | AC1 [unit] |
