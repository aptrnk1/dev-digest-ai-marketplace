---
type: llm
focus: last_message
---

PASS if the verdict is APPROVE (or APPROVE_WITH_CONCERNS with only minor remarks) and the review does not claim a dependency-direction violation: the service depends only on the domain and the port, and only `compose.ts` wires the concrete repository.
FAIL if it reports a critical layering violation, invents files or lines, or gives no verdict.
