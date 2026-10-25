# ADR-0001: Monorepo with relative-path plugin sources

- Status: Accepted
- Date: 2026-10-25

## Context

A marketplace can host its plugins in the same repository (relative `source` paths) or act as a thin catalog that points at separate repositories (`github` or `git-subdir` sources pinned by `ref`/`sha`).

## Decision

All plugins live in this repository under `plugins/<name>/` and are listed with `"source": "./plugins/<name>"`.

## Consequences

- One PR changes a plugin and its catalog entry together, and CI validates everything at once.
- Plugins enabled through a project's `enabledPlugins` load without a separate install only when their source is a relative path, which keeps team rollout simple.
- All plugins share one release cadence and one access level; a plugin that needs its own lifecycle or audience moves to its own repository with a pinned `github` source.
- The marketplace must be added from git, not from a bare `marketplace.json` URL, because relative paths cannot resolve without the repository.
- Plugins cannot share files through `../`; shared content is duplicated or symlinked within the marketplace.
