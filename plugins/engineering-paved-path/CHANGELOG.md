# Changelog

All notable changes to the `engineering-paved-path` plugin. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow
[SemVer](https://semver.org/).

## [Unreleased]

## [1.0.1] - 2026-10-25

### Changed
- Documentation translated to English.

## [1.0.0] - 2026-10-25

### Added
- `next-best-practices`, written from scratch: server/client boundaries, version-aware
  data fetching and caching, async request APIs, Server Actions, route handlers, file
  conventions, metadata, streaming, assets, hydration errors, a review checklist.
- `fastify-best-practices` from [mcollina/skills](https://github.com/mcollina/skills)
  (`skills/fastify/`), unchanged.
- `onion-architecture`, ported from the dev-digest repository and generalized for
  any TypeScript/Node backend: removed the specific project's structure and rules,
  examples became illustrative, the dependency-cruiser check became optional.
  `references/drizzle.md` renamed to `persistence.md`,
  `references/zod-boundaries.md` to `validation-boundaries.md`.
- `react-best-practices`, `react-testing-library` and `security`, ported from the
  dev-digest repository with minor edits for neutrality.
- `README.md`, `THIRD_PARTY_NOTICES.md`.

### Not included
- `next-best-practices` from vercel-labs/next-skills: the upstream has no license,
  so a skill with the same name was written from scratch.
