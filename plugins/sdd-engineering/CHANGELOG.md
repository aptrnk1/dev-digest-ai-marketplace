# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/), версії за
[Semantic Versioning](https://semver.org/lang/uk/). Тег релізу:
`sdd-engineering--v<version>`.

## [Unreleased]

## [1.0.0] - 2026-10-25

Перший реліз. Агенти, skills і скрипти перенесено з робочого SDD-конвеєра
одного проєкту та узагальнено: проєктні шляхи, команди й правила замінено на
параметри з дефолтами.

### Added
- Агент `spec-creator`: draft-спека українською з EARS-критеріями, матрицею
  станів UI, межами довіри й traceability. Як головна сесія запускає до 4
  `research-tools:researcher`.
- Агент `implementation-planner`: план хвилями з `Owns`, `Skills`, `Route`,
  `Verify`, AC-покриттям і розділом `## Commands`.
- Агент `implementer`: одна задача test-first, статуси `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`.
- Агент `plan-verifier`: read-only traceability Req → задача → `file:line` → тест → команда.
- Skill `run-plan`: plan-lint + GATE → хвилі → фінальне рев'ю (plan-verifier,
  architecture-reviewer, `/code-review`) → цикл виправлень ≤3 → finish.
  Скрипт `scripts/plan-lint.mjs`, шаблон `templates/plan.md`.
- Skill `workflow-retro`: ретро мультиагентного прогону, скрипт
  `scripts/workflow-stats.mjs` (з опцією `--projects` для архівних транскриптів).
- Skill `spec-authoring`: EARS, стани UI, межі довіри для LLM, Mermaid, шаблон
  спеки, скрипт `save-designs.mjs`.
- Guard-хуки `PreToolUse` для `spec-creator` і `implementation-planner` у
  `hooks/hooks.json` (фільтр за `agent_type`).
- Evals: кейси для `spec-creator`, `implementation-planner`, `implementer`,
  `plan-verifier`, `run-plan`, `workflow-retro`.
- Залежності: `engineering-paved-path`, `research-tools`, `architecture-review` (`^1.0.0`).

### Changed (порівняно з першоджерелом)
- Шляхи `specs/`, `specs/plans/`, `reports/`, `designs/`, `retros/` стали
  параметрами `specs_dir`, `plans_dir`, `reports_dir`, `designs_dir`, `retros_dir`.
- Обгортку перевірок проєкту замінено на команди з розділу `## Commands` плану і
  `Verify` задач. Підготовку worktree замінено на параметр `bootstrap`.
- `plan-lint.mjs`: перевірка існування skills тепер працює за списком `--skills`
  (namespaced-імена), правило «Verify лише через обгортку» прибрано, евристики
  лейнів `[it]`/`[e2e]` більше не прив'язані до структури конкретного репо.
- Агенти й skills викликаються за namespaced-іменами (`sdd-engineering:implementer`,
  `architecture-review:architecture-reviewer`, `engineering-paved-path:<skill>`).
- Finish більше не викликає агентів документації та insights. Кандидатів у
  lessons він показує користувачу і питає, куди їх записати.

### Provenance
Першоджерело: каталог `.claude/` (agents, skills, hooks) і `scripts/` проєкту
dev-digest, MIT License © 2026 Ivan Lapa.
