# Release process

How a change gets from a PR to users' machines.

## Versioning

Each plugin carries a semver `version` in its own `plugin.json`, and only there ([ADR-0002](adr/0002-versioning-strategy.md)). Installed plugins are copied into the user's plugin cache, so **a merged change without a version bump never reaches users**.

| Change | Bump |
| :- | :- |
| Fix, wording, description tweak | patch |
| New skill, agent, command or option | minor |
| Removed or renamed component, changed behaviour users rely on | major |

Bump the version in the same PR as the change. The marketplace itself has no version to bump.

## Local check

Run before opening a PR:

```bash
claude plugin validate . --strict
claude plugin validate plugins/<name> --strict
claude plugin marketplace add ./
claude plugin install <name>@dev-digest
claude plugin details <name>
```

Then start a session and run the plugin's skills or commands. Validation and installation catch different errors: a `source` path that does not exist passes `validate` and fails only on install.

A marketplace added from a local directory loads relative-path plugins in place, so edits apply at the next session or after `/reload-plugins`, without a bump. That is not what users see; they need the bump.

Clean up with `claude plugin marketplace remove dev-digest`.

## CI

`.github/workflows/validate.yml` runs `claude plugin validate --strict` on the marketplace and on every plugin for each PR and each push to `main`. A red check blocks the merge.

## Changelog

Each plugin keeps a `CHANGELOG.md` next to its `plugin.json`, newest version first, one entry per bump.

## Renaming or removing a plugin

- **Rename**: add `"renames": { "<old>": "<new>" }` at the top level of `marketplace.json`, rename the folder, both `name` fields and the README row in the same PR.
- **Remove**: delete the entry and add `"renames": { "<old>": null }`. Set `"forceRemoveDeletedPlugins": true` only if installed copies must be uninstalled from users' machines.
- `renames` is append-only. Never delete an old key: users who skipped versions still need it.

## When users don't get an update

- Auto-update is off by default for third-party marketplaces. Users turn it on per marketplace in `/plugin`, or run `/plugin marketplace update dev-digest` and update the plugin.
- A running session picks up updates after `/reload-plugins`.
- If the panel shows the new version but old behaviour persists, uninstall and reinstall the plugin.
