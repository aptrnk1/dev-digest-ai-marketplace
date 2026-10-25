# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/), версії за [SemVer](https://semver.org/lang/uk/).

## [Unreleased]

## [1.0.0] - 2026-10-25

### Added
- Агент `researcher`: read-only дослідження у двох режимах. Режим repo дає докази
  `file:line` і з git, режим external — URL, тип і дату джерела. Є interview mode
  (`AskUserQuestion` або блок `needs-input`) і звіт фіксованої структури з
  обов'язковою секцією «Not found / open».
- Evals `repo-question-cites-evidence` і `vague-question-asks-first` для `claude plugin eval`.

### Походження
- Перенесено з `.claude/agents/researcher.md` репозиторію dev-digest (MIT © 2026 Ivan Lapa).
  Прибрано карту конкретного репо (модулі, стек, локальні нюанси); замість неї агент
  орієнтується за документацією поточного репозиторію. Правило «досліджувати версію з
  маніфесту/lockfile» узагальнено на різні екосистеми.
