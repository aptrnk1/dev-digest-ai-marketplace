# Dev Digest AI Marketplace

Claude Code plugin marketplace.

## Install

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install <plugin>@dev-digest
```

## Plugins

| Plugin | Description |
| :- | :- |
| [hello](plugins/hello) | Example plugin: a greeting skill that shows the marketplace layout |

## Adding a plugin

Full rules: [docs/plugin-authoring.md](docs/plugin-authoring.md), [docs/release-process.md](docs/release-process.md), [docs/review-checklist.md](docs/review-checklist.md).

1. Create `plugins/<name>/.claude-plugin/plugin.json` with the same `name` as the folder.
2. Put components at the plugin root: `skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `.mcp.json`.
3. Add an entry to `.claude-plugin/marketplace.json` with `"source": "./plugins/<name>"`.
4. Run `claude plugin validate . --strict`, then test locally:
   `claude plugin marketplace add ./` and `claude plugin install <name>@dev-digest`.

Conventions:

- Keep the entry `name` and `plugin.json` `name` identical and never rename them; use `displayName` or the `renames` map.
- Set `version` (semver) only in `plugin.json`, never in the marketplace entry, and bump it on every change: users don't receive commits made without a bump.
- Quote `"${CLAUDE_PLUGIN_ROOT}"` in hooks and call scripts through an interpreter (`bash`, `node`).
- No secrets in `.mcp.json`; use `userConfig` with `"sensitive": true`.

Plugins run hooks and MCP servers with your permissions; review them before installing.
