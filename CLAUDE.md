# dev-digest-ai-marketplace

A Claude Code plugin marketplace named `dev-digest`. The catalog is `.claude-plugin/marketplace.json`; plugins live in `plugins/<name>/`.

Before adding or changing a plugin, read:

- `docs/plugin-authoring.md` — layout, naming, paths, skills, hooks, secrets
- `docs/release-process.md` — version bumps, local check, renames
- `docs/review-checklist.md` — what every plugin PR must satisfy
- `CONTEXT.md` — terms such as entry name vs manifest name

Rules that break installs if ignored:

- Folder name, `plugin.json` `name` and marketplace entry `name` are identical, and never change.
- Bump `version` in `plugin.json` for every user-visible change; never set `version` in the marketplace entry.
- Paths start with `./`, never contain `..`.
- Run `claude plugin validate . --strict` after every change to `plugins/` or `.claude-plugin/`.

Architecture decisions are in `docs/adr/`.
