---
type: llm
focus: last_message
---

PASS if the review reports, as critical or major findings with `service.ts` line references and quoted code, that the service imports the database client (`db`) and instantiates the concrete `SqlOrderRepository` instead of depending on the `OrderRepository` port wired in `compose.ts`.
FAIL if it misses either problem, reports only style or performance issues, or proposes rewritten code instead of findings with a verdict.
