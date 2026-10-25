---
type: llm
focus: last_message
---

PASS if the response asks clarifying questions before researching (for example which auth flow, which library or version, repo or external research), or relays a "needs input" block with concrete options, and does not present research findings as facts.
FAIL if the response presents findings about an auth implementation, invents files, libraries or versions, or answers without asking what "look into auth" should mean.
