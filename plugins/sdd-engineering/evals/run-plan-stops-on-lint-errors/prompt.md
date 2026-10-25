---
description: run-plan lints a Draft plan first and stops on plan-lint errors without approving it
tags: [skill, run-plan]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit]
---

/sdd-engineering:run-plan plan: specs/plans/slugify.md
