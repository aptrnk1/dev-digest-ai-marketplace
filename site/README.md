# Catalog site

A static search catalog of the `dev-digest` marketplace for GitHub Pages:
`https://aptrnk1.github.io/dev-digest-ai-marketplace/`. There is no backend. The
index is built ahead of time and served as `index.json`; search runs in the browser.
Spec: [`specs/2026-10-25-marketplace-catalog-site.md`](../specs/2026-10-25-marketplace-catalog-site.md),
mockup: [`docs/features/marketplace-site/design/`](../docs/features/marketplace-site/design/).

The whole project lives in `site/` with its own `package.json`. The marketplace
root and `claude plugin validate .` do not touch it.

## Commands

```bash
cd site
npm install
npm run dev          # http://localhost:4321, build from the working copy + live reload
npm run build        # production build into site/dist (same as CI)
npm test             # unit + integration (node --test)
npm run test:e2e     # Playwright against the test marketplace
```

On macOS 12 Playwright's bundled browsers do not install. There, run e2e in the
installed Google Chrome: `PW_CHANNEL=chrome npm run test:e2e`.

## What gets indexed

The source of truth is `.claude-plugin/marketplace.json` at the repo root.

- **Plugins.** Only plugins listed in `plugins[]` are indexed. A folder in
  `plugins/` that is not in the marketplace does not reach the site.
- **Taken from each plugin:** `plugin.json` (name, version, author,
  keywords, `dependencies`), `skills/*/SKILL.md`, `agents/**/*.md`,
  `commands/*.md`, hooks (`hooks/hooks.json` and `plugin.json`), `.mcp.json`,
  `.lsp.json`, `monitors/monitors.json`, `bin/` and `README.md`. Paths from
  `plugin.json` are honoured too.
- **A plugin whose `source` is outside the repo** (github, npm, etc.) is shown
  only with the fields of its marketplace entry.
- **Not indexed:** `evals/`, `scripts/`, `templates/`, CHANGELOG and a skill's
  auxiliary `.md` files (`rules/`, `examples.md`, …).
- **`env` and `headers` values** are never published, only their names.

If JSON fails to parse, or a `SKILL.md` or agent has no `name` or `description`
in its frontmatter, the build fails with a line `<path>: <reason>`.

## When the site updates

There is no manual reindexing. Every push to `main` runs the workflow
`.github/workflows/validate.yml`, which has three separate jobs:

| Job | What it does | When |
|-----|--------------|------|
| `validate` | `claude plugin validate --strict` (marketplace harness) | PR, push, manual run |
| `Catalog site · build` | `npm ci` → audit → tests → e2e → build → Pages artifact | PR, push, manual run |
| `Catalog site · deploy` | deploy to GitHub Pages | `main` only, when both previous jobs are green |

Manual rerun: Actions tab → "Validate marketplace" → "Run workflow".
The build time and commit are shown in the site footer.

**Once, in the repo settings:** Settings → Pages → Source = "GitHub Actions".

## Translations

All UI strings live in one file, [`src/i18n/uk.json`](src/i18n/uk.json) (the UI is in Ukrainian).
- HTML templates use `{{t:key}}`; the build substitutes the strings.
- JS gets strings only through `t('key', params)` from `src/js/lib/i18n.js`.
- An unknown key stops the build.
- An integration test checks that `src/**/*.{html,js,css}` contains no Cyrillic
  and that every key in `uk.json` is used somewhere.

## Search

- Stop words and type words (Ukrainian + English) live in `data/search.json`.
- Synonyms, including Ukrainian-English ones, live in `data/synonyms.json`. Plugin
  content is in English, so Ukrainian words find it only through this map. Add new
  Ukrainian keys there.
- Field weights: name ×3, tags ×2, description ×2, body ×1. Words of 2+ letters
  match as a prefix; words of 5+ letters match with one typo (including a swap of
  two adjacent letters).

## Structure

```
src/pages/        page HTML templates ({{> partial}}, {{t:key}}, {{var}})
src/partials/     shared head/header/footer
src/js/lib/       search, i18n, url-state, data, dom, links, app
src/js/components/ card, palette, theme, copy, detail, …
src/js/pages/     page scripts
src/css/app.css   tokens from the mockup (light and dark themes)
scripts/          build.mjs, dev.mjs, serve.mjs, lib/ (index-builder, markdown, i18n)
test/             unit, it, e2e, fixtures/marketplace
```
