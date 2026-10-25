# Changelog

Усі помітні зміни плагіна `engineering-paved-path`. Формат —
[Keep a Changelog](https://keepachangelog.com/uk/1.1.0/), версії —
[SemVer](https://semver.org/lang/uk/).

## [Unreleased]

## [1.0.0] - 2026-10-25

### Added
- `next-best-practices`, написаний з нуля: межі server/client, data fetching і
  кешування за версіями, async request APIs, Server Actions, route handlers, файлові
  конвенції, metadata, streaming, assets, hydration-помилки, чекліст рев'ю.
- `fastify-best-practices` з [mcollina/skills](https://github.com/mcollina/skills)
  (`skills/fastify/`) без змін.
- `onion-architecture`, перенесений з репозиторію dev-digest і узагальнений для
  будь-якого TypeScript/Node бекенду: прибрано структуру й правила конкретного
  проєкту, приклади стали ілюстративними, перевірка через dependency-cruiser
  стала опційною. `references/drizzle.md` перейменовано на `persistence.md`,
  `references/zod-boundaries.md` — на `validation-boundaries.md`.
- `react-best-practices`, `react-testing-library` і `security`, перенесені з
  репозиторію dev-digest з дрібними правками для нейтральності.
- `README.md`, `THIRD_PARTY_NOTICES.md`.

### Not included
- `next-best-practices` з vercel-labs/next-skills: у першоджерела немає ліцензії,
  тому skill з такою самою назвою написано з нуля.
