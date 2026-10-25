# ADR-0003: Distribution and access

- Status: Proposed
- Date: 2026-10-25

## Context

Who installs these plugins decides the repository's visibility, how users authenticate and how updates arrive:

- **Public repository**: anyone runs `/plugin marketplace add aptrnk1/dev-digest-ai-marketplace`; needs `CONTRIBUTING.md` and `SECURITY.md`.
- **Private repository**: Claude Code runs git without prompts, so every user needs stored credentials (`gh auth login && gh auth setup-git`, or an SSH key in ssh-agent; `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` on machines without one). A `GITHUB_TOKEN` variable alone is not enough. A known bug can leave private-marketplace users on old code after an update (anthropics/claude-code#90420).
- **Team rollout**: a project's `.claude/settings.json` can declare the marketplace in `extraKnownMarketplaces` and turn plugins on in `enabledPlugins`. Cloud and web sessions ignore repo-declared marketplaces.
- **Updates**: auto-update is off by default for third-party marketplaces; users or an admin (`autoUpdate` in managed settings) must turn it on.

## Decision

To be decided: public or private, and whether teams get the marketplace through project settings.

## Consequences

To be filled in with the decision. Until then, the README install instructions assume a public GitHub repository.
