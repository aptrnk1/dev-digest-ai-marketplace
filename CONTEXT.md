# Context

Project-wide domain terms. Each term has one meaning in this repository.

## Glossary

- **Marketplace** — this repository: the catalog `.claude-plugin/marketplace.json` plus the plugins under `plugins/`. Its `name` is `dev-digest-ai-marketplace`, the same as the GitHub repository name.
- **Marketplace name** — the `name` field in `marketplace.json`, typed after `@` when installing (`hello@dev-digest-ai-marketplace`). It matches the repository name by choice; the install id comes from this field, not from the repository.
- **Plugin** — one directory under `plugins/` with a `.claude-plugin/plugin.json`, installed and versioned as a unit. NOT a skill: a plugin can contain several skills, agents, commands, hooks and MCP servers.
- **Entry** — one object in the `plugins` array of `marketplace.json` that says where to fetch a plugin. NOT the plugin itself.
- **Entry name** — the entry's `name`: the install id before `@` and the key in `enabledPlugins`. NOT the manifest name, although here both must be identical.
- **Manifest name** — the `name` in a plugin's `plugin.json`: the prefix of its skills (`/hello:hello`). NOT the entry name, although here both must be identical.
- **Skill** — a `SKILL.md` folder inside a plugin that Claude loads when its `description` matches the task. NOT a command: commands are invoked explicitly by the user.
- **Privileged code** — hooks, `.mcp.json` servers, plugin scripts and `!` commands in skills: code that runs with the user's permissions. NOT skill or agent prose, which only instructs the model.
