# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [1.0.2] - 2026-10-25

### Changed
- Every report ends with a version footer (`_researcher · research-tools v1.0.2_`),
  used to check that auto-update delivered the new release.

## [1.0.1] - 2026-10-25

### Changed
- Documentation translated to English.

## [1.0.0] - 2026-10-25

### Added
- Agent `researcher`: read-only research in two modes. Repo mode gives `file:line`
  and git evidence, external mode gives the source URL, type and date. It has an
  interview mode (`AskUserQuestion` or a `needs-input` block) and a fixed-structure
  report with a mandatory "Not found / open" section.
- Evals `repo-question-cites-evidence` and `vague-question-asks-first` for `claude plugin eval`.

### Origin
- Ported from `.claude/agents/researcher.md` in the dev-digest repository (MIT © 2026 Ivan Lapa).
  Removed the map of that specific repo (modules, stack, local quirks); instead the agent
  orients itself by the current repository's documentation. The rule "research the version
  from the manifest/lockfile" was generalized to other ecosystems.
