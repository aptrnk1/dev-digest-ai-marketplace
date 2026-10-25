# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [1.0.1] - 2026-10-25

### Changed
- Documentation translated to English.

## [1.0.0] - 2026-10-25

### Added
- Agent `architecture-reviewer`: a read-only structure review (layers, dependency direction,
  module boundaries, composition root, Unit of Work, error mapping, cross-package rules).
  Scope `diff`, `paths` or `module`; optional `arch_check`, `rules`, `plan` + `task`,
  delta mode `previous` + `since`. Built-in severity scale
  `critical/major/minor/nit/info`, self-refutation, verdict
  `APPROVE | APPROVE_WITH_CONCERNS | REQUEST_CHANGES | NEEDS_CONTEXT`.
- Dependency `engineering-paved-path` `^1.0.0`. Skills `onion-architecture`,
  `fastify-best-practices`, `next-best-practices`, `react-best-practices` and `security`
  are loaded through the Skill tool by namespaced name.
- Evals `flags-layer-violation` and `clean-module-approves` for `claude plugin eval`.

### Origin
- Ported from `.claude/agents/architecture-reviewer.md` in the dev-digest repository
  (MIT © 2026 Ivan Lapa). Removed repo-specific paths and rules, the fixed
  dependency-cruiser command and the reference to the `pr-self-review` skill. The
  import-direction gate became the `arch_check` input, project rules the `rules` input,
  and the severity scale is now described in the agent itself.
