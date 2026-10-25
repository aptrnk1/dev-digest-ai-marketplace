# ADR-0004: Hooks, MCP servers and secrets policy

- Status: Proposed
- Date: 2026-10-25

## Context

Hooks, MCP servers, plugin scripts and `!`-prefixed commands in `SKILL.md` run with the user's permissions, and `!` commands run before the model sees the skill. Published research shows malicious skills exfiltrating tokens this way ([Datadog Security Labs](https://securitylabs.datadoghq.com/articles/malicious-skills-supply-chain-risks-in-coding-agents-with-dynamic-context/)) and plugin hooks that rewrite permissions to hijack Claude Code ([PromptArmor](https://promptarmor.com/resources/hijacking-claude-code-via-injected-marketplace-plugins)). Users installing from this marketplace trust everything in it.

## Decision

- Hooks are allowed only when a skill or agent cannot do the job; each one is listed and justified in its PR.
- No hook or script changes Claude Code permissions or settings, or auto-approves tool calls.
- Network access from hooks and `!` commands needs a stated reason in the PR.
- No credentials in the repository. Secrets come from `userConfig` with `"sensitive": true` and are referenced as `${user_config.KEY}`.
- MCP servers use HTTPS; remote servers with OAuth are preferred over local binaries.
- Changes to privileged code are reviewed against [review-checklist.md](../review-checklist.md#privileged-code).

## Consequences

- Some automation becomes a skill the user invokes instead of a hook that runs silently.
- Review takes longer for PRs with privileged code. A scanner such as [NVIDIA SkillSpector](https://github.com/NVIDIA/SkillSpector) can be added to CI later.
