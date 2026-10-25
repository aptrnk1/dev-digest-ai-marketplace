# ADR-0002: Semver in plugin.json only

- Status: Accepted
- Date: 2026-10-25

## Context

Claude Code resolves a plugin's version from `plugin.json`, then from the marketplace entry, and otherwise falls back to the git commit SHA. When `version` is set in both places, `plugin.json` wins silently and `validate` warns. Users receive an update only when the resolved version changes.

The alternatives were:

- **No `version` anywhere**: every commit to `main` is a release, with no effort and no control.
- **Semver in `plugin.json`**: explicit releases, at the cost of remembering the bump.
- **Semver in both files**: matches some popular repos, but needs a sync script to avoid silent mismatches.

## Decision

Each plugin declares a semver `version` in its `plugin.json`. Marketplace entries never set `version`. Every user-visible change bumps it in the same PR.

## Consequences

- Users can tell what changed and when; unfinished work on `main` does not reach them until a bump.
- A forgotten bump means users silently stay on the old version. The review checklist and a future CI check (version changed when `plugins/<name>/` changed) guard against it.
- Release rules live in [release-process.md](../release-process.md).
