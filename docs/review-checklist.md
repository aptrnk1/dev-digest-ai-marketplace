# Review checklist

Go through this list for every PR that touches `plugins/` or `.claude-plugin/`.

## Manifest and catalog

- [ ] Folder name, `plugin.json` `name` and marketplace entry `name` are identical.
- [ ] No existing `name` changed; renames and removals go through `renames`.
- [ ] `version` bumped in `plugin.json` and absent from the marketplace entry.
- [ ] Every path starts with `./`, has no `..` and no backslashes.
- [ ] Plugin has `README.md`, `LICENSE` and an updated `CHANGELOG.md`.
- [ ] Root `README.md` plugin table updated for new or removed plugins.
- [ ] All documents are in English (see Language in `CLAUDE.md`).
- [ ] CI validation is green, and the author installed the plugin locally.

## Skills, agents, commands

- [ ] Each `description` says what the component does and when to use it.
- [ ] `SKILL.md` under 500 lines; references one level deep.
- [ ] No stale dates or time-sensitive claims.

## Privileged code

Hooks, `.mcp.json`, scripts and `!` commands in skills run with the user's permissions. Read them line by line.

- [ ] Every hook is listed and justified in the PR description.
- [ ] No hook changes permissions, auto-approves tool calls or edits Claude Code settings.
- [ ] No network calls from hooks or `!` commands unless the PR description says why.
- [ ] No credentials in the repo; secrets come from `userConfig` with `"sensitive": true`.
- [ ] MCP servers use HTTPS; any new external endpoint is named in the PR description.
- [ ] Hook commands quote `"${CLAUDE_PLUGIN_ROOT}"` and call an interpreter explicitly.

See [ADR-0004](adr/0004-hooks-and-mcp-security-policy.md) for the policy behind this section.
