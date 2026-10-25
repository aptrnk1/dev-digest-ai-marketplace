# Catalog site

Статичний пошуковий каталог маркетплейсу `dev-digest` для GitHub Pages:
`https://aptrnk1.github.io/dev-digest-ai-marketplace/`. Бекенду немає. Індекс
збирається заздалегідь і віддається як `index.json`, а пошук іде в браузері.
Специфікація: [`specs/2026-10-25-marketplace-catalog-site.md`](../specs/2026-10-25-marketplace-catalog-site.md),
макет: [`docs/features/marketplace-site/design/`](../docs/features/marketplace-site/design/).

Увесь проєкт лежить у `site/` з власним `package.json`. Корінь маркетплейсу і
`claude plugin validate .` його не зачіпають.

## Команди

```bash
cd site
npm install
npm run dev          # http://localhost:4321, збірка з робочої копії + live reload
npm run build        # продакшн-збірка в site/dist (те саме, що робить CI)
npm test             # unit + integration (node --test)
npm run test:e2e     # Playwright проти тестового маркетплейсу
```

На macOS 12 вбудовані браузери Playwright не ставляться. Там e2e запускають у
встановленому Google Chrome: `PW_CHANNEL=chrome npm run test:e2e`.

## Що індексується

Джерело правди — `.claude-plugin/marketplace.json` у корені репо.

- **Плагіни.** Індексуються лише ті, що є в `plugins[]`. Тека в `plugins/`,
  якої немає в маркетплейсі, на сайт не потрапляє.
- **Що береться з кожного плагіна:** `plugin.json` (назва, версія, автор,
  keywords, `dependencies`), `skills/*/SKILL.md`, `agents/**/*.md`,
  `commands/*.md`, hooks (`hooks/hooks.json` і `plugin.json`), `.mcp.json`,
  `.lsp.json`, `monitors/monitors.json`, `bin/` і `README.md`. Шляхи з
  `plugin.json` теж враховуються.
- **Плагін з `source` поза репо** (github, npm тощо) показується лише полями
  свого запису в маркетплейсі.
- **Не індексуються:** `evals/`, `scripts/`, `templates/`, CHANGELOG і
  допоміжні `.md` skill'ів (`rules/`, `examples.md`, …).
- **Значення `env` і `headers`** ніколи не публікуються, лише їхні імена.

Якщо JSON не парситься або у `SKILL.md` чи агента в frontmatter немає `name` чи
`description`, збирання падає з рядком `<шлях>: <причина>`.

## Коли оновлюється сайт

Ручної реіндексації немає. Будь-який push у `main` запускає workflow
`.github/workflows/validate.yml`, у якому три окремі jobs:

| Job | Що робить | Коли |
|-----|-----------|------|
| `validate` | `claude plugin validate --strict` (harness маркетплейсу) | PR, push, ручний запуск |
| `Catalog site · build` | `npm ci` → audit → тести → e2e → збирання → Pages-артефакт | PR, push, ручний запуск |
| `Catalog site · deploy` | деплой на GitHub Pages | лише `main`, коли обидві попередні jobs зелені |

Ручний перезапуск: вкладка Actions → «Validate marketplace» → «Run workflow».
Час збирання й коміт видно у футері сайту.

**Один раз у налаштуваннях репо:** Settings → Pages → Source = «GitHub Actions».

## Переклади

Усі рядки UI лежать в одному файлі [`src/i18n/uk.json`](src/i18n/uk.json).
- HTML-шаблони використовують `{{t:ключ}}`, build підставляє рядки.
- JS отримує рядки лише через `t('ключ', params)` з `src/js/lib/i18n.js`.
- Невідомий ключ зупиняє збирання.
- Integration-тест перевіряє, що в `src/**/*.{html,js,css}` немає кирилиці і
  що кожен ключ `uk.json` десь ужито.

## Пошук

- Стоп-слова і слова-типи (укр + англ) лежать у `data/search.json`.
- Синоніми, зокрема українсько-англійські, — у `data/synonyms.json`. Вміст
  плагінів англійською, тому українські слова знаходять його лише через цю
  карту. Нові українські ключі додавайте сюди.
- Ваги полів: назва ×3, теги ×2, опис ×2, тіло ×1. Слова з 2+ літер
  збігаються як префікс, з 5+ літер — з однією помилкою (зокрема перестановкою
  двох сусідніх літер).

## Структура

```
src/pages/        HTML-шаблони сторінок ({{> partial}}, {{t:key}}, {{var}})
src/partials/     спільні head/header/footer
src/js/lib/       search, i18n, url-state, data, dom, links, app
src/js/components/ card, palette, theme, copy, detail, …
src/js/pages/     скрипти сторінок
src/css/app.css   токени з макета (світла й темна теми)
scripts/          build.mjs, dev.mjs, serve.mjs, lib/ (index-builder, markdown, i18n)
test/             unit, it, e2e, fixtures/marketplace
```
