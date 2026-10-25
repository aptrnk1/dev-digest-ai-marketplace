---
type: llm
focus: trace
---

PASS if the plan written under specs/plans/ has an `Execution mode: single-agent` header, at least one `## Wave` section with a `### T1` task, and every task has `Owns:`, `Acceptance:` and `Verify:` lines, and AC1, AC2 and AC3 are each cited in some task's Acceptance.
FAIL if the plan file is missing, any of AC1–AC3 is not covered, or a task lacks Owns, Acceptance or Verify.
