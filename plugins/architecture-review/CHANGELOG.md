# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/), версії за [SemVer](https://semver.org/lang/uk/).

## [Unreleased]

## [1.0.0] - 2026-10-25

### Added
- Агент `architecture-reviewer`: read-only рев'ю структури (шари, напрям залежностей,
  межі модулів, composition root, Unit of Work, мапінг помилок, крос-пакетні правила).
  Scope `diff`, `paths` або `module`; опційні `arch_check`, `rules`, `plan` + `task`,
  delta-режим `previous` + `since`. Вбудована шкала severity
  `critical/major/minor/nit/info`, self-refutation, вердикт
  `APPROVE | APPROVE_WITH_CONCERNS | REQUEST_CHANGES | NEEDS_CONTEXT`.
- Залежність `engineering-paved-path` `^1.0.0`. Skills `onion-architecture`,
  `fastify-best-practices`, `next-best-practices`, `react-best-practices` і `security`
  вантажаться через Skill tool за namespaced іменем.
- Evals `flags-layer-violation` і `clean-module-approves` для `claude plugin eval`.

### Походження
- Перенесено з `.claude/agents/architecture-reviewer.md` репозиторію dev-digest
  (MIT © 2026 Ivan Lapa). Прибрано шляхи й правила конкретного репо, фіксовану
  команду dependency-cruiser і посилання на skill `pr-self-review`. Gate напряму
  імпортів став input `arch_check`, правила проєкту — input `rules`, а шкалу severity
  тепер описано в самому агенті.
