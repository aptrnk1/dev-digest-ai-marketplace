---
description: implementation-planner turns an approved spec into a wave-based plan with Owns, Verify and AC coverage
tags: [agent, plan]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write]
---

Склади план імплементації для затвердженої спеки specs/2026-01-01-csv-export.md. Режим виконання — single-agent. Не питай мене нічого: якщо є розвилки, обирай рекомендований варіант. Тести запускаються командою `node --test`.
