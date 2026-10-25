# Plugin authoring

How to add or change a plugin in this marketplace. For field-level details, use the official references instead of copying them here:

- [Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference.md)
- [Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference.md)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

## Layout

```
plugins/<name>/
├── .claude-plugin/plugin.json   # only the manifest lives here
├── skills/<skill>/SKILL.md      # plus reference/*.md and scripts/ if needed
├── agents/                      # optional
├── commands/                    # optional
├── hooks/hooks.json             # optional, see "Hooks"
├── .mcp.json                    # optional, see "MCP servers and secrets"
├── scripts/                     # helper scripts; do not use bin/
├── README.md
└── LICENSE
```

- Components sit at the plugin root, never inside `.claude-plugin/`.
- Use `scripts/`, not `bin/`: claude.ai org sync rejects plugins with a top-level `bin/`.
- A `CLAUDE.md` inside a plugin is not loaded.
- Keep files out of Git LFS: installs receive pointer files only.

## Adding a plugin

1. Create `plugins/<name>/` with the layout above. The folder name, the `plugin.json` `name` and the marketplace entry `name` are identical.
2. Write `plugin.json` with at least `name`, `version` (`0.1.0`), `description`, `author` and `license`.
3. Add an entry to `.claude-plugin/marketplace.json`: `name`, `"source": "./plugins/<name>"`, `description`, `category`. Do not set `version` in the entry (see [ADR-0002](adr/0002-versioning-strategy.md)).
4. Add a row to the plugin table in the root `README.md`.
5. Validate and test locally (see [release-process.md](release-process.md#local-check)).

## Naming

- Kebab-case: lowercase letters, digits and `-`.
- No `claude-`, `anthropic-` or `cc-plugin-` prefixes; `validate` rejects names that read as Anthropic's own.
- A published `name` never changes. Change the label with `displayName`; rename or remove only through `renames` (see [release-process.md](release-process.md#renaming-or-removing-a-plugin)).

## Paths

- Every path in `plugin.json` and `marketplace.json` starts with `./` and uses forward slashes.
- No `..`: only the plugin directory is copied into the user's plugin cache, so nothing outside it exists at runtime.
- Refer to plugin files at runtime as `${CLAUDE_PLUGIN_ROOT}/...`. This directory changes on every update.
- Write state that must survive updates to `${CLAUDE_PLUGIN_DATA}`, never to `${CLAUDE_PLUGIN_ROOT}`.

## Skills

- `name`: lowercase and hyphens, at most 64 characters, without "claude" or "anthropic".
- `description`: third person, at most 1024 characters, says what the skill does **and** when to use it, with the words a user would actually type. This field decides whether the skill triggers.
- Body under 500 lines. Move details to `reference/*.md` linked directly from `SKILL.md` (one level deep); give files over 100 lines a table of contents.
- Put deterministic steps in scripts under the skill and call them, instead of describing them in prose.
- Avoid `!`-prefixed shell commands in `SKILL.md`: they run before the model reads the skill. If one is unavoidable, it falls under [ADR-0004](adr/0004-hooks-and-mcp-security-policy.md).
- No dates or "as of now" statements that will go stale.

## Hooks

- Quote the root: `"${CLAUDE_PLUGIN_ROOT}"`. On macOS the path can contain spaces (`Application Support`), and a broken `PreToolUse` hook blocks every tool call.
- Call an interpreter explicitly: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/x.sh"` or `node ...`. A bare `.sh` path does not run on Windows.
- Shell-form hooks cannot read `${user_config.*}`; use exec form or `CLAUDE_PLUGIN_OPTION_<KEY>`.
- Every hook must be justified in the PR description (see [review-checklist.md](review-checklist.md)).

## MCP servers and secrets

- No credentials in `.mcp.json` or anywhere in the repo.
- Declare secrets in `plugin.json` `userConfig` with `"sensitive": true` (stored in the user's keychain) and reference them as `${user_config.KEY}` in the server `env` or headers.
- Prefer remote MCP servers over HTTPS with OAuth to local binaries.
- `mcpServers` and `userConfig` belong in `plugin.json`, not in the marketplace entry.
