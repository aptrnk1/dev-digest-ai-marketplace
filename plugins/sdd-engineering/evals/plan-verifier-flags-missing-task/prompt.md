---
description: plan-verifier treats Progress as a claim and reports the unimplemented R2/T2 as MISSING
tags: [agent, verify]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent, Bash]
---

Перевір, чи план specs/plans/slugify.md справді реалізовано в коді. У Progress обидві задачі позначені done.
