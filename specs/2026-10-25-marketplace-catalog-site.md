# Spec: Marketplace Catalog Site — a static search catalog of Dev Digest AI plugins
Spec ID: SPEC-2026-10-25-marketplace-catalog-site
Status: draft
Supersedes: —
Modules: site, index-build, ci
Design: `docs/features/marketplace-site/design/Catalog.dc.html` (+ `support.js`) — an interactive mockup of every screen

## Problem and user
A Claude Code user who arrives at the `dev-digest` marketplace (repo
`aptrnk1/dev-digest-ai-marketplace`) wants to find an artifact: a plugin,
skill, agent, command, hook or MCP server. They phrase it in natural language,
for example «мені треба скіл для code review» (I need a skill for code review)
or «I need a skill for code review». Today there is only the plugin table in
`README.md` and the raw files (`.claude-plugin/marketplace.json`,
`plugins/<name>/.claude-plugin/plugin.json`, `plugins/<name>/skills/*/SKILL.md`).
There is no content search. Before installing, users cannot see which hooks or
MCP servers a plugin will run with their permissions, even though `README.md`
explicitly asks them to review these. A team also has no easy way to roll out a
set of plugins through a repository, and nowhere to follow new versions.

The repo is a Claude Code plugin marketplace with no backend. It currently holds
5 plugins (`hello`, `engineering-paved-path`, `research-tools`,
`architecture-review`, `sdd-engineering`: 10 skills, 6 agents, 1 `hooks.json`)
and a CI workflow `validate.yml` that, on PRs and pushes to `main`, runs only
`claude plugin validate . --strict` and validation of each plugin.

## Goals / Non-goals
**Goals**
- **MVP.** A static site on GitHub Pages with no backend. The UI language is
  Ukrainian. Technical terms (`skill`, `hook`, `MCP`, `Copy install`) and
  Claude Code commands stay as in the mockup. CI messages and shields.io badge
  content (AC65, AC70) stay in English: they are read in logs and READMEs, not
  on the site. Plain HTML/CSS/JS with no framework and no SSG; a lightweight
  client-side search library is allowed.
- **MVP.** The index is built in GitHub Actions on push to `main` and on
  `workflow_dispatch`. It holds six artifact types: plugin, skill, agent,
  command, hook, mcp. Data comes from `marketplace.json`, `plugin.json`, the
  frontmatter and body of `SKILL.md`, `agents/*.md`, `commands/*.md`, from
  `hooks/hooks.json`, `.mcp.json`, and from components declared in
  `plugin.json`.
- **MVP.** Keyword search in the browser: Ukrainian and English stop words and
  type words, field boosts, prefix and fuzzy matching, a synonym map
  (including Ukrainian–English), tags.
- **MVP.** Result cards: type, name, highlighted snippet, parent plugin, copy
  of the install command, invocation command, risk badges.
- **MVP.** Home page: hero search, popular tag chips, per-type counters, a
  «Переглянути за типом» (Browse by type) block.
- **MVP.** Plugin page: rendered and sanitized README, plugin contents,
  version, install command, a «Що цей плагін запускає на вашій машині» (What
  this plugin runs on your machine) block.
- **MVP.** Artifact page (skill, agent, command, hook, mcp): breadcrumbs,
  invocation command, `Tools / permissions` from frontmatter, documentation
  (sanitized Markdown body).
- **MVP.** A «Як підключити marketplace» (How to connect the marketplace)
  page: three steps with commands.
- **MVP.** A `⌘K` / `Ctrl+K` command palette for quick navigation to an
  artifact.
- **MVP.** Filters by type, category, tags and author; sorting by relevance or
  name; search state lives in the URL.
- **MVP.** A manual light/dark theme toggle. The default is the system theme;
  the choice is remembered in the browser.
- **MVP.** A «Запропонувати плагін» (Suggest a plugin) button that opens a
  GitHub Issue with prefilled fields.
- **MVP.** A fixture marketplace for tests, outside
  `.claude-plugin/marketplace.json`. The production index holds only real
  plugins.
- **v2.** Team bundle builder: generates a `.claude/settings.json` snippet with
  `extraKnownMarketplaces` + `enabledPlugins`.
- **v2.** What's new: per-plugin version history from git, computed in CI, plus
  an Atom feed, a «Що нового» (What's new) block on the home page, an "updated"
  date and a «Нещодавно оновлені» (Recently updated) sort.
- **v2.** README badges: static endpoint JSON for shields.io.

**Non-goals**
- Semantic search and embeddings (maybe later).
- A plugin generator; an in-browser validator.
- Ratings and reviews (giscus); install and view counters.
- Any runtime GitHub API calls from the browser. Everything that needs GitHub
  is computed in CI (R4).
- Updating the index without a rebuild: the site shows the state as of the last
  build.
- Adding real demo plugins to the marketplace (test data is fixtures only).
- Choosing an accent color (in the mockup it is a preview parameter, not a user
  feature). The accent is fixed to blue.
- The `compatibility` field from the mockup (e.g. `Claude Code ≥ 1.4`): the
  plugin manifest has no field for a minimum Claude Code version (R8), so there
  is no data for it.
- Anything else outside this spec (candidates for later iterations, no ACs):
  context-cost estimate in tokens, an evals badge and quality signals, "Similar
  artifacts", workflows/recipes, a public `llms.txt` and a `find-plugin`
  meta-skill, downloading a skill as `.zip`, "My stack", role-based starter
  sets, plugin comparison.

## User stories
- **US1** As a Claude Code user, I enter a natural-language query to see every
  marketplace artifact that matches it.
- **US2** As a user, I narrow results by type, category and tags and share a
  link to this search so a colleague sees the same results.
- **US3** As a user, I copy a plugin's install command or a skill/command
  invocation to run it in Claude Code right away.
- **US4** As a user, I open a plugin page to read the README and see the
  version and all of its components.
- **US12** As a user, I open the page of a single skill or agent to read its
  documentation and see which tools it may use.
- **US13** As a new user, I open «Як підключити marketplace» to add the
  marketplace, install a plugin and learn how to update it, in three steps.
- **US14** As a user who knows the name, I press `⌘K` to jump to an artifact
  without opening the search page.
- **US15** As a user, I switch between the light and dark theme to read the
  catalog the way I prefer.
- **US5** As a cautious user, I see which hooks, MCP and LSP servers, monitors
  and binaries a plugin will run, so I can decide whether I trust it before
  installing.
- **US6** As a user who did not find what I need, I suggest a new plugin via a
  GitHub Issue so the maintainer learns about it.
- **US7** As the marketplace maintainer, I merge changes into `main` and the
  site and index update automatically. A broken plugin stops the deploy so bad
  data never reaches the site.
- **US8** As the maintainer, I maintain the synonym map and tags so user queries
  find artifacts even when the words in the query and in the docs differ.
- **US9** (v2) As a team lead, I pick several plugins and get a ready
  `.claude/settings.json` so the whole team gets the marketplace and plugins
  through the repository.
- **US10** (v2) As a user, I see plugin version history and subscribe to an
  Atom feed to hear about new releases.
- **US11** (v2) As a plugin author, I copy the Markdown for a version badge to
  paste into my README.

## Design
Mockup: `docs/features/marketplace-site/design/Catalog.dc.html` (opens in a
browser together with `support.js`). It is interactive: all screens live in one
file and switch on click. The mockup data is made up (plugins `react-tools`,
`mcp-postgres`, etc.). The site shows only real data from the index. The mockup
sets the layout, the color tokens (`--bg`, `--text`, `--accent`, `--kind-*` for
light and dark themes), the IBM Plex Sans / Mono fonts and the UI copy. Exact UI
strings are quoted in the ACs. Where an AC and the mockup disagree, the AC wins.

| D# | Mockup screen (`screen`) | Site screen |
|----|---------------------------|-------------|
| D1 | `home` (+ `catalogEmpty`) | Home `/` with no parameters; empty catalog |
| D2 | `search` | Results `/?q=…` or with filters |
| D3 | `plugin` | Plugin page `/plugin.html` |
| D4 | `artifact` | Artifact page `/artifact.html` |
| D5 | `getting-started` | `/getting-started.html` |
| D6 | `whats-new` | `/whats-new.html` (v2) |
| D7 | `⌘K` palette, «Скопійовано» (Copied) toast | Overlays on every page |

**Deviations from the mockup (deliberate):**
- The mockup header has no navigation. The site has a `Як підключити` (How to
  connect) link, and in v2 also `Що нового` (What's new) and `Набір для команди`
  (Team bundle).
- The mockup shows `compatibility`. The site does not (see Non-goals).
  `Залежності` (Dependencies) come from `dependencies` in `plugin.json` (AC88,
  AC89).
- The mockup shows an agent invocation as `@<name>`. The site shows the full
  invocation `@agent-<plugin>:<name>` (AC41, R8).
- The «Що нового» block on the home page, the "updated" date and the
  «Нещодавно оновлені» sort need git history, so they are in v2 (AC64–AC69,
  AC75).
- In the empty catalog the `CONTRIBUTING.md` link is replaced by a
  `Запропонувати плагін` button (the repo has no `CONTRIBUTING.md`).
- The mockup uses inline styles and Google Fonts. The site moves styles into CSS
  files and serves fonts from its own origin (AC53, A-fonts).
- The `green`/`violet`/`amber` accent colors are a mockup preview parameter. The
  site has only `blue`.
- In the mockup, the `Скинути фільтри` (Reset filters, empty state) and
  `Скинути` (Reset, filter panel) buttons also clear the query. On the site both
  remove filters only (AC33).
- In the mockup an empty query keeps the user on the search screen with
  `Огляд каталогу` (Catalog overview). On the site a query with no meaningful
  terms and no filters shows the home page (AC72).

## Screens and states
All pages share a header: the `◆ Каталог dev-digest` logo (links to `/`), the
`Пошук по каталогу…` (Search the catalog…) field (on every page except home),
the `⌘K` button (AC84), the theme toggle (AC76), and the `Як підключити` and
`GitHub ↗` links (AC87). The footer with the build time is shared too (AC52).

| Screen | ideal | empty | loading | partial | error |
|-------|-------|-------|---------|---------|-------|
| Home (`/` without `q` and filters, D1) | hero field, tag chips, counters, «Переглянути за типом» (AC72, AC73) | 0 plugins — `Каталог порожній` (Catalog is empty) (AC34) | skeleton counters and chips, field active (AC49) | — (the index loads whole) | `Не вдалося завантажити індекс плагінів.` (Could not load the plugin index.) + `Спробувати ще` (Try again) (AC50) |
| Results (`/?q=&type=&category=&tag=&author=&sort=`, D2) | filters, sorting, `<n> артефактів` (n artifacts) line, cards (AC22–AC27, AC29, AC30, AC36, AC75); filters only, no query — `Огляд каталогу` (AC31) | 0 results (AC32); 0 results with no filters — no `Скинути фільтри` button (AC32) | skeleton of 3 cards, field active (AC49) | > 50 results — first 50 + `Показати ще 50` (Show 50 more) (AC28) | AC50 |
| Plugin page (`/plugin.html?name=<name>`, D3) | metadata, install, contents, transparency block, README (AC40, AC43, AC45) | no README (AC44); plugin runs nothing (AC46) | skeleton title and sections (AC49) | plugin outside the repo: components unknown (AC47) | unknown name (AC48); AC50 |
| Artifact page (`/artifact.html?plugin=&type=&name=`, D4) | breadcrumbs, invocation, `Tools / permissions`, install, `Документація` (Documentation) (AC78, AC79) | no Markdown body (AC80); no tool fields (AC80) | skeleton title and sections (AC49) | component of a plugin outside the repo — unavailable because it is not indexed (AC47) | unknown artifact (AC81); AC50 |
| How to connect (`/getting-started.html`, D5) | three steps with `Copy` and a note about update (AC83) | 0 plugins — placeholder `<plugin>` in step 2 (AC83) | step 2 with placeholder `<plugin>` (AC83) | — | index failed to load — step 2 with placeholder, no error message (AC83) |
| `⌘K` palette (D7) | up to 8 results, keyboard navigation (AC84, AC85) | `Нічого не знайдено` (Nothing found) (AC86) | `Завантаження…` (Loading…), field active (AC86) | — (first 8 only) | index error in the palette body (AC86) |
| Team bundle (`/bundle.html`, v2) | plugin checkboxes, live snippet, `Copy`, `Завантажити settings.json` (Download settings.json) (AC59, AC62, AC63) | nothing selected (AC60) | skeleton list (AC49) | `?bundle=` contains unknown names (AC61) | AC50 |
| What's new (`/whats-new.html`, v2, D6) | release entries, newest first, `Subscribe · RSS` link (AC66) | `Релізів ще немає.` (No releases yet.) (AC68) | skeleton list (AC49) | — (history is computed in full in CI) | AC50 |
| «Що нового» block on home (v2) | 4 latest entries + `Уся стрічка →` (Full feed →) (AC66) | block hidden (AC68) | together with home | — | — |
| `Бейдж` (Badge) section on the plugin page (v2) | preview + Markdown + `Copy` (AC71) | — (every plugin has a badge) | — (static) | — | copy failed (AC42) |
| `Changelog` section on the plugin page (v2) | the plugin's entries (AC67) | — (every plugin has ≥1 entry, AC64) | together with the page | — | — |

## Module interaction
Modules: **site** — static pages and client-side JS on GitHub Pages;
**index-build** — a CI script that reads the repo and generates the index,
rendered READMEs, badges and the feed; **ci** — the GitHub Actions workflow for
validate, build and deploy. There is no backend. The browser talks only to its
own origin; the badge preview loads from `img.shields.io` (AC53).

| Action | Path | Contract / artifact | New or existing |
|-----|------|------|------|
| Push to `main` / `workflow_dispatch` | `validate.yml`: job `validate` ∥ job `Catalog site · build` (index-build → tests → upload Pages artifact) → job `Catalog site · deploy` (needs both) | Pages artifact (R5) | job `validate` exists; the rest is new |
| PR | `validate.yml`: `validate` ∥ `Catalog site · build`; deploy skipped | — | new |
| Local development | `cd site && npm run dev` → build from the working copy → server `localhost:4321` → rebuild and live reload on changes | — | new |
| Index build | index-build reads `.claude-plugin/marketplace.json`, `plugins/**`, the synonym map, stop words, git history (v2) | `index.json` (artifacts + build metadata), HTML README for each plugin, HTML body for each skill/agent/command, `badges/*.json`, `feed.xml`; bakes `<owner>/<repo>` and `<marketplace name>` into `getting-started.html` (AC83) | new |
| Open any page | site → GET `index.json` (same origin) → search in the browser | `index.json` | new |
| Search, filters, sorting | browser only, no network; state → `history.replaceState` | URL `?q=&type=&category=&tag=&author=&sort=` | new |
| `⌘K` palette | browser only, same search without filters | — | new |
| Theme toggle | site → `localStorage['dd-theme']`; `theme-init.js` in `<head>` applies the theme before first render | key `dd-theme` = `light` \| `dark` | new |
| Open an artifact | site → `index.json` → rendered artifact body from the site artifact | `/artifact.html?plugin=&type=&name=` | new |
| Copy install / invocation / snippet | site → Clipboard API | — | new |
| Suggest a plugin | site → new tab `github.com/<repo>/issues/new?title=…&body=…` | GitHub new-issue URL | new |
| Download settings.json (v2) | site → Blob in the browser | file `settings.json` | new |
| Badge preview (v2) | site → `img.shields.io/endpoint?url=<site>/badges/<plugin>.json` | endpoint JSON (R6) | new |

Impact on other consumers: the existing `validate` job in `validate.yml` does
not change. Two new site jobs are added to the workflow, and the workflow gets
`pages: write` and `id-token: write` permissions only at the deploy job level.
All site code lives in `site/` with its own `package.json`, so the marketplace
root and `claude plugin validate .` are not affected. `README.md` does not
change. The fixture marketplace does not affect `claude plugin validate .` at
the repo root (AC9).

## Acceptance criteria (EARS)

### CI and index build (ci, index-build)
- **AC1** (event, US7) WHEN a push lands on `main` or `workflow_dispatch` is
  triggered, ci shall run three separate jobs in the `validate.yml` workflow:
  the existing `validate` (marketplace harness, unchanged),
  `Catalog site · build` (install `site/` dependencies, build the index, run
  tests, upload the Pages artifact) and `Catalog site · deploy` (deploy to
  GitHub Pages). `validate` and `Catalog site · build` run in parallel, and
  each has its own status in the Actions tab and in the PR/commit checks.
  `[manual]` (the maintainer checks the run in the Actions tab and the updated
  site)
- **AC2** (unwanted, US7) IF `validate` or `Catalog site · build` fails, THEN
  ci shall not run `Catalog site · deploy` (it `needs` both jobs), and the
  previous site version stays on Pages. A `Catalog site · build` failure does
  not change the status of `validate`, and vice versa. `[manual]` (the
  maintainer pushes a test branch with a deliberately broken plugin and runs
  `workflow_dispatch` on it)
- **AC3** (event, US7) WHEN a pull request is opened or updated, ci shall run
  `validate` and `Catalog site · build` and skip `Catalog site · deploy`.
  `[manual]`
- **AC4** (state, US7) WHILE a previous run's deploy is in progress, ci shall
  queue the new deploy (concurrency group `pages`,
  `cancel-in-progress: false`) instead of cancelling the current one. Before
  deploying, the job checks that its commit is still the head of `main` and
  skips deploying a stale commit. As a result the site ends up on the latest
  run's commit. `[manual]`
- **AC5** (ubiquitous, US1) index-build shall create one artifact for each entry
  in the marketplace's `plugins[]` (plugin), each skill, agent and command,
  each hooks event+matcher pair (hook) and each MCP server name (mcp). Default
  locations, paths from `plugin.json` and inline components count, following
  the replace, add and merge rules of R2. `[unit]`
- **AC6** (ubiquitous, US1) Every artifact in the index shall have the fields
  `type`, `name`, `plugin` (parent plugin name; for a plugin, itself),
  `description`, `body` (Markdown body without frontmatter; for hook and mcp,
  the command/URL text), `path` (path in the repo), `tags`, `author`. `author`
  comes from the marketplace entry's `author.name`, otherwise from
  `plugin.json`; components inherit the plugin's author. `[unit]`
- **AC7** (ubiquitous, US4) index-build shall take the plugin's `displayName`,
  `description` and `category` from the marketplace entry when set there,
  otherwise from `plugin.json`. `version` comes from `plugin.json`, and without
  it from the marketplace entry (R1). `[unit]`
- **AC8** (ubiquitous, US8) index-build shall compute a plugin's tags as the
  union of the marketplace entry's `tags` and the `keywords` from
  `plugin.json`, lowercased, without duplicates. A plugin's components inherit
  its tags. `[unit]`
- **AC9** (ubiquitous, US7) The production index shall contain only plugins
  from the repo-root `.claude-plugin/marketplace.json`. No fixture-marketplace
  plugin reaches the published site. `[it]`
- **AC10** (unwanted, US7) IF any JSON file index-build reads
  (`marketplace.json`, `plugin.json`, `hooks.json`, `.mcp.json`, `.lsp.json`,
  `monitors.json`, the synonym map) fails to parse, or a `SKILL.md` or agent
  file lacks `name` or `description` in its frontmatter, THEN index-build shall
  exit with a non-zero code and print a `<repo path>: <reason>` line for each
  error. `[unit]`
- **AC11** (ubiquitous, US7) The index shall contain the build time in UTC
  (ISO 8601) and the full SHA of the commit it was built from. `[unit]`
- **AC12** (ubiquitous, US5) For every plugin, index-build shall store
  transparency data. Hooks: event, matcher, type, `command` or `args`. MCP:
  name; for stdio — `command` + `args`; for remote — type and `url`. LSP: name,
  `command` + `args`. Monitors: `name`, `command`. File names in `bin/`.
  `[unit]`
- **AC13** (unwanted, US5) IF an MCP, LSP or hook config contains `env` or
  `headers`, THEN index-build shall write only the variable and header names to
  the index. The values appear in no published file. `[unit]` `[it]`
  (searching the whole site artifact for a fixture marker value yields 0
  matches)
- **AC14** (ubiquitous, US4) index-build shall render the plugin README from
  Markdown to HTML and pass the result through an allowlist sanitizer. The
  sanitizer removes the elements `script`, `iframe`, `object`, `embed`,
  `style`, `form`, `link`, `meta`, `base`, all `on*` and `style` attributes, and
  links and sources with schemes other than `http:`, `https:`, `mailto:` and
  relative paths. `[unit]`
- **AC15** (ubiquitous, US4) index-build shall rewrite relative README links to
  `https://github.com/<owner>/<repo>/blob/<commit SHA>/<path>`. External links
  get `rel="noopener noreferrer"`. `[unit]`
- **AC16** (ubiquitous, US4) index-build shall copy images with relative paths
  inside the plugin into the site artifact and rewrite links to them. `[unit]`
- **AC17** (unwanted, US4) IF a README contains an image with an absolute
  external URL, THEN index-build shall replace it with a link to that URL with
  the text `зображення: <alt>` (image: <alt>) (or `зображення` without alt), so
  the browser never loads external images on its own. `[unit]`
- **AC79** (ubiquitous, US12) index-build shall store, for skills and commands,
  the list from the `allowed-tools` frontmatter, and for agents, `tools`,
  `disallowedTools` and `model`. A comma-separated string value and an array
  value yield the same list. `[unit]`
- **AC88** (ubiquitous, US4) index-build shall store the plugin's
  `dependencies` list from `plugin.json` in the normalized form
  `{name, marketplace, version}`. A string `"name"` yields `marketplace` = the
  current marketplace name, `"name@marketplace"` is split on `@`, and from an
  object the fields `name`, `marketplace`, `version` are taken (R8).
  `version` is a semver range as is (`~2.1.0`) or empty. `[unit]`
- **AC82** (ubiquitous, US12) index-build shall render the Markdown body of each
  skill, agent and command to HTML using the same rules as the README
  (AC14–AC17), and store it as a separate site-artifact file, not in
  `index.json`. `[unit]`

### Search (site)
- **AC18** (event, US1) WHEN the user changes the text in a search field (the
  hero on home or the header field), the UI shall, 150 ms after the last
  change, show the results view and update the `?q=` parameter (via
  `history.replaceState`). On pages other than `/`, typing in the header field
  and pressing `Enter` opens `/?q=<q>`. `[e2e]`
- **AC19** (ubiquitous, US1) Search shall normalize the query and index fields:
  lowercase, Unicode NFC, apostrophes `’`, `ʼ`, `` ` `` → `'`. It then removes
  stop words from the supported list, case-insensitively. Minimum English list:
  `i, need, want, looking, find, a, an, the, for, to, me, my, some, something,
  that, which, with, help, please, can, you, of, in, on, and, or, is, are, how,
  do`. Minimum Ukrainian list: `мені, треба, потрібен, потрібна, потрібно,
  потрібні, хочу, шукаю, знайти, знайди, для, щоб, який, яка, яке, які,
  якийсь, щось, з, із, зі, в, у, на, і, й, та, або, чи, як, що, це, є, будь,
  ласка, допоможи, допомога`. For the fixtures, the query
  `I need help with code review` and the query `Мені треба щось для code review`
  (I need something for code review) yield the same ordered list as
  `code review`. `[unit]`
- **AC20** (ubiquitous, US1) Search shall recognize type words in the query,
  apply them as a type filter and drop them from the search terms. English:
  `plugin(s)`, `skill(s)`, `agent(s)`, `command(s)`, `hook(s)`, `mcp`.
  Ukrainian (all case forms, singular and plural): `плагін`, `скіл`/`скілл`,
  `агент`, `команда`, `хук`. The queries `I need a skill for code review` and
  `мені треба скіл для code review` yield the same results as `code review`
  with the filter `type=skill`. `[unit]`
- **AC21** (event, US1) WHEN no term is left after removing stop words and type
  words, the UI shall show all artifacts of the recognized type, sorted by
  name. If no type was recognized and there are no filters, AC72 applies.
  `[unit]` `[e2e]`
- **AC22** (ubiquitous, US1) Search shall weight matches by field: `name` ×3,
  `tags` ×2, `description` ×2, `body` ×1. For the fixtures, an artifact with a
  term only in `name` ranks above an artifact with the same term only in
  `body`. `[unit]`
- **AC23** (ubiquitous, US1) Search shall match each term of length ≥ 2 as a
  prefix (`rev` finds `review`), and terms of length ≥ 5 also with edit
  distance ≤ 1 (`reveiw` finds `review`). `[unit]`
- **AC24** (ubiquitous, US8) Search shall expand every term that is a key in
  the synonym map with all of its synonyms from the map. The map accepts
  Ukrainian keys with English synonyms: for fixtures with the entry
  `"рефакторинг": ["refactor", "refactoring"]`, the query `рефакторинг`
  (refactoring) finds an artifact that contains only `refactor`. `[unit]`
- **AC25** (event, US8) WHEN synonym expansion fired during a query, the UI
  shall show below the field the line
  `Також шукали: <term> → <syn1>, <syn2>` (Also searched: …), one fragment per
  expanded term, separated by ` · `. `[e2e]`
- **AC26** (ubiquitous, US1) A result card shall show the type label in color
  `--kind-<type>` and as text (`plugin`, `skill`, `agent`, `command`, `hook`,
  `MCP`), the parent plugin's version `v<version>`, the name, a snippet of
  ≤ 160 characters with `…` when truncated and with matched terms highlighted
  (the description, or, if the match is only in `body`, a `body` fragment
  around the first match), up to 3 tags `#<tag>`, a `<plugin> · <author>` line
  (for a plugin, only `<author>`; `<plugin>` links to its page), a
  `Copy install` button and an `Відкрити` (Open) link (plugin or artifact
  page). `[e2e]`
- **AC27** (ubiquitous, US1) The UI shall insert names, descriptions and
  snippets as text. The fixture description `<img src=x onerror=alert(1)>` is
  shown literally and no script runs. `[unit]` `[e2e]`
- **AC28** (event, US1) WHEN a query yields more than 50 results, the UI shall
  show the first 50 in the current sort order and a `Показати ще 50` (Show 50
  more) button. Each click appends the next 50. `[e2e]`
- **AC29** (ubiquitous, US1) The UI shall show above the cards the heading
  `Результати: “<q>”` (Results: “<q>”) (or `Огляд каталогу` without a query)
  and a line with the total match count following the plural rules of
  `Intl.PluralRules('uk')`: `1 артефакт`, `2 артефакти`, `5 артефактів`,
  `21 артефакт`, `11 артефактів`. The line is announced via
  `aria-live="polite"`. `[unit]` `[e2e]`
- **AC30** (ubiquitous, US5) The plugin card and the plugin page shall show text
  risk badges: `Запускає hooks` (Runs hooks) (≥ 1 hook), `Запускає MCP-сервер`
  (Runs an MCP server) (≥ 1 MCP), `Запускає LSP-сервер` (Runs an LSP server)
  (≥ 1 LSP), `Запускає monitors` (Runs monitors) (≥ 1 monitor),
  `Запускає бінарники` (Runs binaries) (≥ 1 file in `bin/`). `[e2e]`
- **AC31** (state, US1) WHILE the query is empty but at least one filter is
  active, the UI shall show under the heading `Огляд каталогу` all artifacts
  that pass the filters, sorted by display name case-insensitively. With no
  query and no filters, AC72 applies. `[e2e]`
- **AC32** (unwanted, US1) IF the query and/or filters yield 0 results, THEN
  the UI shall show the heading `Нічого не знайшли` (We found nothing), the text
  `Спробуйте скинути фільтри або змінити запит.` (Try resetting filters or
  changing the query.) and a `Запропонувати плагін` button. The
  `Скинути фільтри` button appears only when at least one filter is active.
  `[e2e]`
- **AC33** (event, US2) WHEN the user clicks `Скинути фільтри` (in the empty
  state) or `Скинути` (in the filter panel), the UI shall remove all type,
  category, tag and author filters, keep the query and update the URL. If the
  query has no meaningful terms, AC72 applies after the reset. `[e2e]`
- **AC34** (unwanted, US1) IF the index has 0 plugins, THEN the home page shall
  show `📦`, the heading `Каталог порожній`, the text
  `Ще немає жодного плагіна. Додай перший — і він одразу зʼявиться тут після білду індексу в CI.`
  (There are no plugins yet. Add the first one and it will show up here right
  after the index is built in CI.) and the buttons `Як почати` (Get started)
  (links to `/getting-started.html`) and `Запропонувати плагін`. Counters,
  chips and «Переглянути за типом» are hidden. `[e2e]`
- **AC35** (unwanted, US1) IF the query is longer than 200 characters, THEN
  search shall use only the first 200 characters. Queries with special
  characters (`c++`, `.*`, `<script>`) run without error as plain text.
  `[unit]`

### Filters and URL (site)
- **AC36** (ubiquitous, US2) The UI shall offer in the `Фільтри` (Filters) panel
  the groups `Тип` (Type) (six types with counts), `Категорія` (Category) (all
  categories in the index), `Keywords` (all tags in the index, alphabetical)
  and `Автор` (Author) (all authors with counts; artifacts with no author go
  under `Невідомий автор` (Unknown author)). Values within a group combine with
  OR; groups combine with AND. `[unit]` `[e2e]`
- **AC37** (event, US2) WHEN the user changes the query, a filter or the sort,
  the UI shall write the state to the URL as
  `?q=<q>&type=<t1,t2>&category=<c>&tag=<g1,g2>&author=<a>&sort=<s>`, omitting
  empty parameters and `sort` at its default value. `[e2e]`
- **AC38** (event, US2) WHEN the user opens a URL with the parameters `q`,
  `type`, `category`, `tag`, `author`, `sort`, the UI shall restore the search
  field, filters, sort and results identical to those at the moment the URL was
  copied. `[e2e]`
- **AC39** (unwanted, US2) IF a URL parameter contains an unknown type,
  category, tag, author or sort value, THEN the UI shall ignore that value and
  apply the rest. `[unit]`
- **AC74** — number unused (reserved during editing).
- **AC75** (event, US2) WHEN the user picks a value in the `Сортувати` (Sort)
  list, the UI shall order results: `За релевантністю` (By relevance) (default;
  without a query, by name), `За назвою` (By name) (`sort=name`,
  case-insensitive, `localeCompare` with locale `uk`). v2 adds
  `Нещодавно оновлені` (`sort=updated`, by the date of the plugin's latest
  history entry, AC64). `[unit]` `[e2e]`

### Copying and invocation (site)
- **AC40** (event, US3) WHEN the user clicks `Copy install`, the UI shall copy
  one shell line,
  `claude plugin marketplace add <owner>/<repo> && claude plugin install <plugin>@<marketplace name>`
  (a multi-line paste into the Claude Code prompt is read as one slash
  command, so two `/plugin` lines fail) (for this repo:
  `aptrnk1/dev-digest-ai-marketplace` and `@dev-digest-ai-marketplace`; values come from the
  index). For 2 s the button shows `Скопійовано ✓` (Copied ✓), and a toast
  `✓ Скопійовано в буфер` (✓ Copied to clipboard) is visible at the bottom of
  the screen for 1.8 s. Both are announced via `aria-live`. `[e2e]`
- **AC41** (event, US3) WHEN the user clicks `Copy` next to an invocation
  command on a card, the artifact page or in the plugin contents, the UI shall
  copy the invocation command and likewise show `Скопійовано ✓` and the toast
  (AC40). For skills and commands it is `/<plugin>:<name>` (for the `hello`
  fixture: `/hello:hello`). For agents it is `@agent-<plugin>:<name>`, and an
  agent in a subfolder `agents/<dir>/<name>.md` gets
  `@agent-<plugin>:<dir>:<name>` (R8). hook and mcp have no invocation command.
  `[unit]` `[e2e]`
- **AC42** (unwanted, US3) IF the Clipboard API is unavailable or the browser
  refused the write, THEN the UI shall show the text to copy in a selected
  read-only field labelled
  `Не вдалося скопіювати — виділіть і скопіюйте вручну` (Could not copy —
  select and copy manually) and not show `Скопійовано`. `[e2e]`

### Plugin page (site)
- **AC43** (ubiquitous, US4) The plugin page shall show a `← Назад` (← Back)
  link (to the previous search state, or to `/` without one), the display name,
  `name`, the version as `v<version>`, the description, category, tags, an
  `<author>` line, the license, an install block (`$ <command>` +
  `Copy install`), a `View on GitHub ↗` link to
  `https://github.com/<owner>/<repo>/tree/<commit SHA>/<plugin path>`, a
  `Склад плагіна` (Plugin contents) section grouped by type with a count per
  group (each item has a name linking to the artifact page, the invocation
  command for skill/command/agent, and the description), a `Залежності`
  (Dependencies) section (AC89) and a `README` section. `[e2e]`
- **AC44** (unwanted, US4) IF the plugin has no README, THEN the plugin page
  shall show `README відсутній.` (No README.) in place of the README. `[e2e]`
- **AC89** (ubiquitous, US4) The plugin page shall show the `Залежності`
  section when `dependencies` is non-empty. Each entry reads `<name>` followed,
  if set, by ` <version>`. A dependency from the current marketplace that is in
  the index links to that plugin's page with `↗`. Any other dependency is shown
  as text `<name>@<marketplace>` with the note `поза цим marketplace` (outside
  this marketplace). With no dependencies the section is hidden. `[e2e]`
- **AC45** (ubiquitous, US5) The plugin page shall contain the section
  `Що цей плагін запускає на вашій машині` (What this plugin runs on your
  machine). It lists every hook (event · matcher · command), every MCP server
  (name · command with arguments, or URL), every LSP server, every monitor,
  every file in `bin/`, and env variable and header names without values.
  Below the section is the text
  `Плагіни працюють з вашими правами. Перегляньте ці команди перед встановленням.`
  (Plugins run with your permissions. Review these commands before installing.)
  `[e2e]`
- **AC46** (unwanted, US5) IF the plugin has no hooks, MCP or LSP servers,
  monitors or files in `bin/`, THEN the transparency section shall show
  `Цей плагін не запускає hooks, MCP- чи LSP-серверів, monitors або бінарників.`
  (This plugin runs no hooks, MCP or LSP servers, monitors or binaries.)
  `[e2e]`
- **AC47** (unwanted, US4) IF the marketplace entry's `source` is not a relative
  path in this repo, THEN index-build shall index only the entry's fields, and
  the plugin page shall show
  `Компоненти не показано: плагін розміщено поза цим репозиторієм.`
  (Components not shown: the plugin is hosted outside this repository.)
  instead of the component list and the transparency section. `[unit]` `[e2e]`
- **AC48** (unwanted, US4) IF the `name` parameter is empty or matches no plugin
  in the index, THEN the plugin page shall show
  `Плагін "<name>" не знайдено` (Plugin "<name>" not found) and a
  `← На головну` (← Home) link. `[e2e]`

### Artifact page (site)
- **AC78** (ubiquitous, US12) The page
  `/artifact.html?plugin=<p>&type=<t>&name=<n>` shall show the breadcrumbs
  `Каталог / <plugin display name> / <name>` (`Каталог` (Catalog) → `/`, plugin
  → its page), the type label, the name, the invocation command with `Copy`
  (for skill, command and agent, AC41), the description, a
  `Tools / permissions` section (AC79, AC80), an install block with
  `Copy install`, a `View on GitHub ↗` link to the artifact file at the commit
  SHA, and a `Документація` (Documentation) section with the rendered body
  (AC82). For a hook the `Документація` section shows event · matcher ·
  command; for an mcp, the command with arguments or the URL and the env
  variable and header names without values (AC12, AC13). Cards and
  `Склад плагіна` items link here. `[e2e]`
- **AC80** (unwanted, US12) IF the artifact has no tool fields, THEN the
  `Tools / permissions` section shall show, for an agent,
  `Успадковує всі інструменти сесії` (Inherits all session tools), and for a
  skill or command, `Додаткових дозволів не надає` (Grants no extra
  permissions). If the Markdown body is empty, the `Документація` section shows
  `Документації немає.` (No documentation.) `[e2e]`
- **AC81** (unwanted, US12) IF any of the parameters `plugin`, `type`, `name` is
  empty or the combination matches no artifact in the index, THEN the page
  shall show `Артефакт не знайдено` (Artifact not found) and a `← На головну`
  link. `[e2e]`

### Home, "How to connect", palette (site)
- **AC72** (state, US1) WHILE the query has no meaningful terms (empty or only
  stop words, AC19) and there are no filters, the UI on `/` shall show the home
  page. The typed text stays in the field and `?q=` in the URL, so a reload
  restores the same state (AC38). The home page consists of: the eyebrow
  `Marketplace плагінів · скілів · агентів` (Marketplace of plugins · skills ·
  agents), the h1 heading
  `Знайди потрібний артефакт і постав його одним copy-paste` (Find the
  artifact you need and install it with one copy-paste), the paragraph
  `Клієнтський fuzzy-пошук по описах, frontmatter і тілу markdown. Без бекенду — уся статика зібрана в CI.`
  (Client-side fuzzy search over descriptions, frontmatter and markdown body.
  No backend — everything is static and built in CI.), a hero field with the
  placeholder `Опиши, що треба — напр. "скіл для рефакторингу React"`
  (Describe what you need — e.g. "skill for refactoring React"), up to 7 chips
  `#<tag>` (the tags with the most artifacts; ties alphabetical), counters
  `плагінів` (plugins), `скілів` (skills), `агентів` (agents), `команд`
  (commands), `MCP`, and the `Переглянути за типом` block with the six types
  and counts. `[unit]` `[e2e]`
- **AC73** (event, US1) WHEN the user clicks a tag chip, a counter or a type in
  the `Переглянути за типом` block, the UI shall show the results view without
  a query with the corresponding `tag` or `type` filter and update the URL
  (AC37). `[e2e]`
- **AC83** (ubiquitous, US13) The page `/getting-started.html` shall show the
  heading `Як підключити marketplace` (How to connect the marketplace), the text
  `Три кроки. Спершу додай marketplace як джерело, потім став окремі плагіни.`
  (Three steps. First add the marketplace as a source, then install individual
  plugins.) and three steps, each with a number, title, description, a
  `$ <command>` command and a `Copy` button: (1)
  `Додати marketplace як джерело` (Add the marketplace as a source) —
  `/plugin marketplace add <owner>/<repo>`; (2) `Встановити потрібний плагін`
  (Install the plugin you need) — `/plugin install <plugin>@<marketplace name>`,
  where `<plugin>` is the first plugin in the index by name; (3) `Оновлювати`
  (Keep updated) — `/plugin marketplace update <marketplace name>`. Below the
  steps is the note
  `marketplace update vs plugin update. Перше оновлює список джерел (звідки брати плагіни), друге — код конкретного встановленого плагіна.`
  (The first updates the list of sources (where plugins come from); the second
  updates the code of a specific installed plugin.)
  `<owner>/<repo>` and `<marketplace name>` are baked into the page at build
  time, so steps 1 and 3 work without `index.json`. While the index is
  loading, if it failed to load, or if there are 0 plugins, step 2 shows the
  placeholder `<plugin>`. This page is an exception to AC50: no index error
  message is shown on it. `[e2e]`
- **AC84** (event, US14) WHEN the user presses `⌘K` (macOS) or `Ctrl+K` (other
  OSes) or clicks the `⌘K` button in the header, the UI shall open the palette:
  a modal dialog (`role="dialog"`, `aria-modal="true"`) with focus in the
  `Перейти до артефакту…` (Go to artifact…) field and an `ESC` hint. The
  palette shows up to 8 results of the same search (AC19–AC24) without filters.
  Each row has the type label, the name, and `плагін` (plugin) or the parent
  plugin's name. While the field is empty, the first 8 artifacts are shown:
  plugins first, then the rest, by name within each group. Pressing `⌘K` /
  `Ctrl+K` again closes the palette. The shortcut calls `preventDefault`, so
  the browser's default action does not fire, even when focus is in an input
  field. `[e2e]`
- **AC85** (event, US14) WHEN the palette is open, the UI shall move the row
  selection with the `↓`/`↑` arrows, open the selected row on `Enter` or click
  (plugin or artifact page), and close the palette on `Esc` or a click outside
  it, returning focus to the element it was opened from. `[e2e]`
- **AC86** (unwanted, US14) IF a palette query yields 0 results, THEN the
  palette shall show `Нічого не знайдено` (Nothing found). While the index is
  loading, it shows `Завантаження…` (Loading…), and the typed text is kept and
  applied after loading. If the index failed to load, the palette body shows
  `Не вдалося завантажити індекс плагінів.` and the `Спробувати ще` button
  (AC50). `[e2e]`
- **AC87** (ubiquitous, system) The header of every page shall contain the logo
  `◆ Каталог dev-digest` linking to `/`, the `Пошук по каталогу…` field (on
  every page except home), the `⌘K` button (AC84), the theme toggle (AC76), a
  `Як підключити` link to `/getting-started.html` and `GitHub ↗` to
  `https://github.com/<owner>/<repo>` (new tab, `rel="noopener noreferrer"`).
  At widths < 640 px the header field is hidden and `⌘K` remains. Exception:
  the results view on `/`, where the header field is the only query field, so
  it stays visible. `[e2e]`

### Loading, errors, freshness (site)
- **AC49** (state, system) WHILE the index takes longer than 300 ms to load, the
  UI shall show a skeleton: counters and chips on home, 3 cards in results, the
  title and sections on plugin and artifact pages, the list on the team bundle
  and What's new pages. The search field stays available for typing the whole
  time. `[e2e]`
- **AC50** (unwanted, system) IF the index request ends with a network error, a
  status ≠ 200 or invalid JSON, THEN the UI shall show
  `Не вдалося завантажити індекс плагінів.` (Could not load the plugin index.)
  and a `Спробувати ще` (Try again) button that retries the request. `[e2e]`
- **AC51** (event, US6) WHEN the user clicks `Запропонувати плагін`, the UI
  shall open in a new tab (`rel="noopener noreferrer"`)
  `https://github.com/<owner>/<repo>/issues/new` with URL-encoded parameters
  `title=Пропозиція плагіна: <q>` (Plugin suggestion: <q>) (or
  `Пропозиція плагіна` without a query) and a `body` containing the line
  `Шукали: <q>` (Searched for: <q>) and the headings
  `## Що має робити плагін?` (What should the plugin do?) and
  `## Приклад використання` (Usage example). `[unit]` `[e2e]`
- **AC52** (ubiquitous, US7) The footer of every page shall show
  `Індекс зібрано <YYYY-MM-DD HH:MM> UTC · <first 7 SHA characters>` (Index
  built …), where the SHA links to the commit on GitHub. While the index is
  loading or if it failed to load, this line is hidden. `[e2e]`

### Security and network (site)
- **AC53** (ubiquitous, system) Every page shall have
  `<meta http-equiv="Content-Security-Policy">` with the value
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://img.shields.io; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`
  (R7). `[it]`
- **AC54** (ubiquitous, system) At runtime the site shall make network requests
  only to its own origin and, for the badge preview (AC71), to
  `img.shields.io`. No request to `api.github.com`. `[e2e]` (network log check
  on every page)

### Translations and local development (site)
- **AC90** (ubiquitous, system) All UI strings shall live in a single file
  `site/src/i18n/uk.json` (a flat `key → string` object, substitutions as
  `{name}`, plurals as an object `{one, few, many, other}` for
  `Intl.PluralRules('uk')`). HTML templates refer to strings only through keys,
  which the build substitutes at build time. JS components get strings only
  through the function `t(key, params)`. `[it]` (no Cyrillic characters in
  `site/src/**/*.{html,js,css}`; every key used in templates and JS exists in
  `uk.json`; every `uk.json` key is used somewhere)
- **AC91** (unwanted, system) IF a template or JS refers to a key that is not in
  `uk.json`, THEN the build shall exit with a non-zero code and print
  `<file>: unknown i18n key "<key>"`. `[unit]`
- **AC92** (event, US7) WHEN a developer runs `npm run dev` in `site/`, the dev
  server shall build the site from the repo working copy (including uncommitted
  changes), serve it at `http://localhost:4321`, and within 2 s of a file change
  in `plugins/`, `.claude-plugin/`, `site/src/` or `site/data/` rebuild the site
  and reload open pages. The live reload script is injected only in dev; the
  production artifact does not contain it. A build error is shown in the
  terminal, and the server keeps serving the last successful build. `[manual]`

### Keyboard and theme (site)
- **AC55** (event, US1) WHEN the user presses `/` while focus is not in a text
  field and the `⌘K` palette is closed, the UI shall move focus to the search
  field. `[e2e]`
- **AC56** (event, US1) WHEN the user presses `Esc` in a search field with
  non-empty text, the UI shall clear the query and update the results and URL.
  `[e2e]`
- **AC57** (event, US1) WHEN focus is in the search field or on a card and the
  user presses `↓`/`↑`, the UI shall move focus to the next or previous card.
  `Enter` on a card opens its main link: the plugin or artifact page (AC78).
  `[e2e]`
- **AC58** (state, US15) WHILE the user has not picked a theme manually
  (`localStorage` has no `dd-theme`, or a value other than `light` and `dark`),
  the UI shall show the dark theme if the system reports
  `prefers-color-scheme: dark`, otherwise the light theme, and react to system
  theme changes without a reload. `[e2e]` (media feature emulation)
- **AC76** (event, US15) WHEN the user clicks the theme toggle in the header
  (`☾` in the dark theme, `☀` in the light theme; `aria-label`
  `Увімкнути світлу тему` (Switch to light theme) or `Увімкнути темну тему`
  (Switch to dark theme)), the UI shall switch the theme without a reload and
  write `localStorage['dd-theme']` = `light` or `dark`. The saved choice takes
  precedence over the system theme on every page. The `theme-init.js` script in
  `<head>` (synchronous, same origin) applies the theme before first render, so
  opening a page shows no flash of the other theme. `[e2e]`
- **AC77** (unwanted, US15) IF `localStorage` is unavailable or throws, THEN the
  toggle shall work within the current page without a console error, and the
  next page load shows the system theme. `[e2e]`

### v2 — Team bundle builder (site)
- **AC59** (event, US9) WHEN the user selects or deselects a plugin on the
  `Набір для команди` (Team bundle) page, the UI shall update the snippet within
  100 ms without a page reload:
  ```json
  {
    "extraKnownMarketplaces": {
      "<marketplace name>": {
        "source": { "source": "github", "repo": "<owner>/<repo>" }
      }
    },
    "enabledPlugins": {
      "<plugin>@<marketplace name>": true
    }
  }
  ```
  Plugins in `enabledPlugins` are ordered by `name`. Indentation is 2 spaces
  (R3). `[unit]` `[e2e]`
- **AC60** (state, US9) WHILE no plugin is selected, the UI shall hide the
  snippet, show `Виберіть хоча б один плагін` (Select at least one plugin) and
  keep `Copy` and `Завантажити settings.json` disabled with the tooltip
  `Виберіть хоча б один плагін`. `[e2e]`
- **AC61** (event, US9) WHEN the user selects plugins, the UI shall write the
  selection to the URL as `?bundle=<name1>,<name2>`. Opening such a URL
  restores the selection. Unknown names are skipped with the message
  `Пропущено невідомі плагіни: <names>` (Skipped unknown plugins: <names>).
  `[e2e]`
- **AC62** (event, US9) WHEN the user clicks `Завантажити settings.json`, the
  UI shall download a `settings.json` file with the snippet content. `Copy`
  copies the same content (AC42 when copying fails). `[e2e]`
- **AC63** (ubiquitous, US9) The `Набір для команди` page shall show below the
  snippet the text
  `Збережіть як .claude/settings.json у вашому репозиторії. Якщо файл уже є, додайте ці ключі до нього. Колеги отримають marketplace, коли довірять теці.`
  (Save as .claude/settings.json in your repository. If the file already
  exists, add these keys to it. Colleagues get the marketplace once they trust
  the folder.) (R3). `[e2e]`

### v2 — What's new (index-build, site)
- **AC64** (ubiquitous, US10) index-build shall create one history entry for
  each commit that adds a plugin's `plugin.json` or changes its `version`. The
  entry holds the plugin name, version, commit date (UTC), the first line of the
  commit message and the SHA. `[unit]` (fixture git repo)
- **AC65** (unwanted, US10) IF the checkout's git history is incomplete
  (shallow clone), THEN index-build shall exit with a non-zero code and the
  message `git history unavailable: checkout with fetch-depth: 0`. `[unit]`
- **AC66** (ubiquitous, US10) The `Що нового` (What's new) page shall show the
  latest 50 entries across all plugins, newest first. Each entry has
  `v<version>`, the plugin display name (linking to its page), the first line
  of the commit message and the date `<YYYY-MM-DD>`. At the top is a
  `Subscribe · RSS` link to `feed.xml`. The home page shows a `Що нового`
  block with the 4 latest entries and an `Уся стрічка →` (Full feed →) link. The
  plugin page shows `оновлено <YYYY-MM-DD>` (updated <YYYY-MM-DD>) from the
  latest entry. `[e2e]`
- **AC67** (ubiquitous, US10) The plugin page shall contain a `Changelog`
  section with all of that plugin's entries (`v<version>`, date, first line of
  the commit), newest first. `[e2e]`
- **AC68** (unwanted, US10) IF there are no history entries, THEN the
  `Що нового` page shall show `Релізів ще немає.` (No releases yet.), and the
  `Що нового` block on the home page shall be hidden. `[e2e]`
- **AC69** (ubiquitous, US10) index-build shall publish `feed.xml` in Atom 1.0
  format with the latest 50 entries. An entry title is `<plugin> v<version>`,
  the link goes to the plugin page, `updated` is the commit date. All text from
  git is XML-escaped, and the feed passes an XML parser without errors.
  `[unit]`

### v2 — Badges (index-build, site)
- **AC70** (ubiquitous, US11) index-build shall publish `badges/<plugin>.json`
  with the content
  `{"schemaVersion":1,"label":"<plugin>","message":"v<version>","color":"blue"}`
  and `badges/marketplace.json` with the content
  `{"schemaVersion":1,"label":"plugins","message":"<N>","color":"blue"}`, where
  N is the number of plugins (R6). `[unit]`
- **AC71** (ubiquitous, US11) The plugin page shall contain a `Бейдж` (Badge)
  section with a badge preview and the Markdown
  `[![<plugin>](https://img.shields.io/endpoint?url=<URL-encoded address of badges/<plugin>.json>)](<plugin page address>)`
  and a `Copy` button. `[e2e]`

## Edge cases
- **EC1** Query of stop words only (`I need a`, `мені треба щось` (I need
  something)) → home page, the query stays in the field (AC19, AC21, AC72).
- **EC2** Query of a type word only (`skills`, `скіли` (skills), `агентів`
  (agents, genitive)) → all artifacts of that type, by name (AC20, AC21).
- **EC3** Query > 200 characters or with regex and HTML special characters →
  truncated to 200, no error, treated as plain text (AC35, AC27).
- **EC4** HTML or script in a description, name or SKILL.md body → shown as
  text (AC27).
- **EC5** Same skill name in two plugins → two cards, distinguished by the
  parent plugin (AC26).
- **EC6** Long description → snippet ≤ 160 characters with `…` (AC26).
- **EC7** > 50 results → `Показати ще 50` (AC28).
- **EC8** 0 plugins in the marketplace → `Каталог порожній` (AC34); in
  "How to connect", step 2 with the placeholder `<plugin>` (AC83).
- **EC9** Plugin with a `source` outside the repo (github, git-subdir, npm,
  etc.) → only the entry fields are indexed (AC47).
- **EC10** Invalid JSON, frontmatter without `name`/`description`, broken
  synonym map → build fails, no deploy (AC10, AC2).
- **EC11** README with `<script>`, `onerror`, `javascript:`, an external image
  → sanitized; the external image becomes a link `зображення: <alt>`
  (AC14, AC17).
- **EC12** Literal secret in `env` or `headers` → only names are published
  (AC13).
- **EC13** Unknown plugin in `?name=` → `Плагін "<name>" не знайдено` (AC48);
  unknown artifact → `Артефакт не знайдено` (AC81).
- **EC14** Unknown values in `?type=` / `?tag=` / `?bundle=` → ignored
  (AC39, AC61).
- **EC15** Clipboard unavailable (http, refusal, old browser) → a field for
  manual copying (AC42).
- **EC16** Shallow checkout in CI (v2) → build fails with an explanation
  (AC65).
- **EC17** Index unavailable or broken (404, network, partially written
  artifact) → `Не вдалося завантажити індекс плагінів.` + `Спробувати ще`
  (AC50).
- **EC18** Two pushes in a row → deploys queue; the site shows the latest commit
  (AC4).
- **EC19** Hooks in both `hooks/hooks.json` and `plugin.json` → both sources
  merged; each event+matcher pair is a separate artifact (AC5).
- **EC20** Index stale relative to the repo (change without rebuild) →
  expected; freshness is visible in the footer (AC52).
- **EC21** Ukrainian query with no synonym in the map (`тестування` (testing),
  when content is English only) → 0 results, empty state with
  `Запропонувати плагін` (AC32). Coverage depends on the synonym map (AC24).
- **EC22** Different apostrophes (`рев'ю`, `ревʼю`, `рев’ю` (review)) → same
  result (AC19).
- **EC23** `localStorage` blocked (private mode, browser policy) → the theme
  switches only within the page, without an error (AC77).
- **EC24** Saved theme differs from the system theme → the saved one applies,
  without a flash (AC76).
- **EC25** `⌘K` while the palette is open or focus is in the search field → the
  palette toggles, the browser shortcut does not fire (AC84).
- **EC26** Agent without `tools` / skill without `allowed-tools` →
  `Успадковує всі інструменти сесії` / `Додаткових дозволів не надає` (AC80).
- **EC27** Long Ukrainian words and names at 320 px width → wrap without
  horizontal scroll (NFR6).

## Non-functional requirements
- **NFR1** Search latency: ≤ 50 ms p95 per query (tokenization, synonyms,
  search, sorting; no rendering) on a synthetic index of 2,000 artifacts —
  check: a unit benchmark over 200 queries in Node 22 on the `ubuntu-latest` CI
  runner.
- **NFR2** Index size: ≤ 1 MB gzip on a synthetic marketplace of 200 plugins /
  2,000 artifacts — check: an it test builds the synthetic index and measures
  its gzip size.
- **NFR3** JS bundle: ≤ 100 KB gzip in total for all page scripts, including
  the search library — check: an it test measures the artifact.
- **NFR12** Fonts: IBM Plex Sans (400/500/600/700) and IBM Plex Mono
  (400/500/600) in WOFF2 with latin + cyrillic subsets, ≤ 400 KB in total,
  `font-display: swap` — check: an it test measures the font files in the
  artifact.
- **NFR4** Loading: Lighthouse (mobile) Performance ≥ 90 and LCP ≤ 2.5 s on
  home, results and the plugin page — check: `[manual]` the maintainer runs
  Lighthouse on the published site after the first deploy.
- **NFR5** Accessibility WCAG 2.2 AA: 0 serious/critical axe violations on
  home, results, plugin and artifact pages, "How to connect", with the `⌘K`
  palette open, on the team bundle and What's new pages — in both light and
  dark themes. Text contrast ≥ 4.5:1, targets ≥ 24×24 px, visible focus, all
  controls keyboard-reachable, filters have labels — check: axe in e2e.
- **NFR6** Responsiveness: at 320 px width there is no horizontal scroll and all
  controls are usable — check: e2e with a 320×640 viewport.
- **NFR7** Browsers: the two latest stable versions of Chrome, Firefox, Safari,
  Edge — check: e2e in Chromium, Firefox and WebKit.
- **NFR8** Build time: the index-build step ≤ 60 s on a synthetic marketplace of
  200 plugins — check: an it test with a timeout.
- **NFR9** Freshness: the site reflects a `main` commit ≤ 10 min after the push,
  given a successful CI run — check: `[manual]` the maintainer compares the SHA
  in the footer with the commit.
- **NFR10** Supply chain: dependencies pinned by a lock file, `npm audit`
  reports 0 high/critical at deploy time — check: a CI step before build.
- **NFR11** No JS framework and no SSG: the site artifact holds only static
  HTML, CSS and JS — check: dependency review in the PR.

## Inputs and provenance
| Input | Source | Validation |
|------|---------|-----------|
| `.claude-plugin/marketplace.json` | repo (maintainer-controlled, PR) | `claude plugin validate --strict` (AC1) + index-build parsing (AC10) |
| `plugin.json`, `hooks.json`, `.mcp.json`, `.lsp.json`, `monitors.json` | repo, written by the plugin author | validate + parsing (AC10); secrets stripped (AC13) |
| Frontmatter and body of `SKILL.md`, `agents/*.md`, `commands/*.md` | repo, written by the plugin author | required `name`/`description` for skill/agent (AC10); shown only as text (AC27) |
| Plugin README | repo, written by the plugin author | render + allowlist sanitizer in CI (AC14–AC17) + CSP (AC53) |
| Synonym map, stop-word list | repo, maintainer | JSON parsing (AC10) |
| Git history (v2) | repo | full checkout (AC65); XML escaping in the feed (AC69); shown as text |
| `?q`, `?type`, `?category`, `?tag`, `?author`, `?sort`, `?name`, `?plugin`, `?bundle` | user (URL) | truncated to 200 characters (AC35); unknown values ignored (AC39, AC61); shown only as text (AC27, AC48, AC81) |
| `localStorage['dd-theme']` | user (browser) | only `light` and `dark` accepted, anything else ignored; access in try/catch (AC76, AC77) |
| Frontmatter `allowed-tools`, `tools`, `disallowedTools`, `model` | repo, written by the plugin author | shown only as text (AC27, AC79) |
| `index.json` in the browser | trusted (own build artifact, same origin) | status and JSON check (AC50) |
| `GITHUB_TOKEN` in Actions | secrets (GitHub) | CI only; never reaches the site; permissions `pages: write`, `id-token: write`, `contents: read` (R5) |

## Untrusted inputs
- README → UI (HTML) → rendered in CI, allowlist sanitizer, link rewriting,
  external images blocked, meta CSP with no inline scripts (AC14–AC17, AC53).
- Names, descriptions, skill/agent/command bodies, hook/MCP commands → UI →
  inserted only as text, highlighting without HTML interpretation (AC26, AC27,
  AC45).
- `env` and `headers` values → never published (AC13).
- URL parameters → search and UI → truncated, unknown values ignored, shown as
  text. They go into the Issue link only URL-encoded (AC35, AC51, AC39).
- Commit messages → Atom and UI → XML-escaped, shown as text (AC69, AC66).
- Skill/agent/command bodies → UI (HTML) → the same rendering, sanitizer and
  CSP as for the README (AC82, AC14–AC17, AC53).
- The feature has no LLM, so `llm-trust-boundaries` does not apply ("—").

## Assumptions
- **Verification levels in this repo** (no test suite exists yet):
  `[unit]` — Node tests of the index-build logic (on the fixture marketplace)
  and of search (tokenization, stop words, synonyms, ranking, URL state);
  `[it]` — a full build of the site artifact from fixtures plus checks of the
  generated files (index contents, sizes, CSP, absence of secrets);
  `[e2e]` — a browser test (Chromium/Firefox/WebKit) against the site built from
  fixtures, served by a local static server;
  `[manual]` — GitHub Actions and Pages checks done by the maintainer.
- **The fixture marketplace** lives outside the root
  `.claude-plugin/marketplace.json` and outside `plugins/`, so
  `claude plugin validate .` does not see it. It holds 4–5 plugins that together
  cover: all six types, a skill at a path from `plugin.json`, an inline hook,
  stdio and http MCP with `env`/`headers` and a marker value, LSP, a monitor, a
  file in `bin/`, `tags` + `keywords`, a README with `<script>`, `onerror`, an
  external and a relative image, a plugin without a README, a plugin with a
  `github`-type `source`, a plugin with `dependencies` (a string for a fixture
  plugin, an object with `version`, a dependency from another marketplace), and
  an agent in a subfolder `agents/<dir>/`. A separate fixture set with broken
  JSON and frontmatter is used only for AC10.
- **Site URL**: `https://aptrnk1.github.io/dev-digest-ai-marketplace/`.
  Pages: `/`, `/plugin.html?name=<name>`,
  `/artifact.html?plugin=<p>&type=<t>&name=<n>`, `/getting-started.html`,
  `/bundle.html`, `/whats-new.html`; files `index.json`, `feed.xml`,
  `badges/*.json`. These are public addresses, so they are fixed as a contract.
- `<owner>/<repo>` comes from the CI environment, `<marketplace name>` from the
  `name` field in `marketplace.json`. Nothing is hardcoded.
- **One-time manual steps**: in the repo settings, Pages has the source
  "GitHub Actions"; the repo is public.
- The whole site project lives in `site/`: `package.json`, `src/` (templates,
  CSS, JS, `i18n/uk.json`), `scripts/` (build, dev), `data/` (synonyms, stop
  words), `test/` (unit, it, e2e, fixtures). The build goes to `site/dist/`,
  which is not committed.
- Links on the site are relative because Pages serves it from the subpath
  `/dev-digest-ai-marketplace/`. The artifact contains `.nojekyll`.
- **Scale for NFRs**: up to 200 plugins and 2,000 artifacts. Currently 5 plugins
  and about 22 artifacts.
- **A-fonts.** The IBM Plex fonts (SIL OFL 1.1) live in the site artifact, so
  the CSP `default-src 'self'` allows them. Google Fonts are not used; the font
  license ships next to the files.
- **A-styles.** The CSP `style-src 'self'` blocks inline `style` attributes. So
  the mockup's inline styles move into CSS classes, and dynamic values (type
  color) are set through `kind-<type>` classes.
- **A-lang.** Plugin content (SKILL.md, descriptions) is in English. Ukrainian
  queries find it through names, tags, Latin-script technical terms and the
  Ukrainian–English synonym map. The maintainer fills the map with Ukrainian
  keys for every tag and category in the index. Completeness check:
  `[manual]`, PR review.
- **A-theme.** The `localStorage` key `dd-theme` is shared by all pages (same
  origin). `theme-init.js` sets `data-theme` on `<html>`.
- **Filter semantics**: OR within a group, AND between groups (AC36).
- Stop words and the synonym map are repo files maintained by the maintainer;
  changes take effect after the next build.
- **R1** (https://code.claude.com/docs/en/plugins/marketplace-reference.md,
  2026-10-25): a marketplace entry has `category`, `tags` ("Free-form tags for
  search"), `displayName`. The entry's display fields take precedence over
  `plugin.json`; `version` from `plugin.json` takes precedence over the entry.
- **R2** (https://code.claude.com/docs/en/plugins-reference, 2026-10-25):
  default component locations are `skills/<n>/SKILL.md`, `commands/`,
  `agents/`, `hooks/hooks.json` (with a `"hooks"` wrapper), `.mcp.json`,
  `.lsp.json`, `monitors/monitors.json`, `bin/`. `plugin.json` can declare
  paths and inline configs: `commands`/`agents` replace the default, `skills`
  are added, `hooks`/`mcpServers`/`lspServers` are merged. `keywords` are
  "Discovery tags". Components are named `<plugin>:<name>`.
- **R3** (https://code.claude.com/docs/en/plugins/org.md, 2026-10-25): in a
  repo's `.claude/settings.json`, `extraKnownMarketplaces` (key — the
  marketplace `name`, `source: {source: "github", repo}`) and `enabledPlugins`
  (`"<plugin>@<marketplace>": true`). `extraKnownMarketplaces` applies after the
  person trusts the folder. Plugins with a relative-path source install from
  the marketplace copy.
- **R4** (https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api,
  2026-10-25): unauthenticated — 60 requests/hour; `GITHUB_TOKEN` in Actions —
  1,000 requests/hour per repo.
- **R5** (https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages,
  2026-10-25): deploy via `configure-pages` / `upload-pages-artifact` /
  `deploy-pages`, permissions `pages: write` + `id-token: write`, environment
  `github-pages`, artifact < 10 GB without symlinks.
- **R6** (https://shields.io/badges/endpoint-badge, 2026-10-25): endpoint JSON
  `{schemaVersion: 1, label, message, color?}`, URL
  `https://img.shields.io/endpoint?url=…`.
- **R7** (https://htmhell.dev/adventcalendar/2023/7/, 2026-10-25): GitHub
  Pages does not allow setting HTTP headers; CSP is set via
  `<meta http-equiv>`. That meta CSP does not support `frame-ancestors` is taken
  from general knowledge — there is no clickjacking protection via CSP. Risk
  accepted: the site has no stateful actions.
- **R8** (https://code.claude.com/docs/en/plugins/manifest-reference.md,
  https://code.claude.com/docs/en/plugins/dependencies.md,
  https://code.claude.com/docs/en/sub-agents.md, 2026-10-25): `dependencies`
  in `plugin.json` is an array of strings `"name"` / `"name@marketplace"` or
  objects `{name, marketplace, version}` with a semver range. The manifest has
  no field for a minimum Claude Code version. A plugin agent is invoked via
  `@agent-<plugin>:<name>`; an agent in the subfolder
  `agents/review/security.md` has the identifier `<plugin>:review:security`.

## Open questions
- **OQ1** Should `"autoUpdate": true` be added to the `extraKnownMarketplaces`
  entry of the Bundle snippet (AC59)? Options: (a) do not add — the spec's
  current behavior, because R3 confirms the field only for managed settings;
  (b) add it, if research confirms it is also read in project settings. Decided
  by the repo owner (aptrnk1). Non-blocking.
- **OQ2** Should the Issue from `Запропонувати плагін` get a label
  (`labels=plugin-suggestion`)? The label must already exist in the repo.
  Options: (a) no label — the current behavior of AC51; (b) create the label and
  add the parameter. Decided by the repo owner. Non-blocking.
- **OQ3** — closed 2026-10-25: `Залежності` come from `dependencies` in
  `plugin.json` (AC88, AC89). `compatibility` is not shown because the manifest
  has no such field (R8).
- **OQ4** — closed 2026-10-25: an agent shows the invocation command
  `@agent-<plugin>:<name>` (AC41, R8).

## Traceability
| US | AC | EC | NFR | Verification |
|----|----|----|-----|--------------|
| US1 | AC5, AC6, AC18, AC19, AC20, AC21, AC22, AC23, AC26, AC27, AC28, AC29, AC31, AC32, AC34, AC35, AC55, AC56, AC57, AC72, AC73 | EC1, EC2, EC3, EC4, EC5, EC6, EC7, EC8, EC21, EC22, EC27 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6, NFR7, NFR12 | AC5 [unit], AC6 [unit], AC18 [e2e], AC19 [unit], AC20 [unit], AC21 [unit][e2e], AC22 [unit], AC23 [unit], AC26 [e2e], AC27 [unit][e2e], AC28 [e2e], AC29 [unit][e2e], AC31 [e2e], AC32 [e2e], AC34 [e2e], AC35 [unit], AC55 [e2e], AC56 [e2e], AC57 [e2e], AC72 [unit][e2e], AC73 [e2e] |
| US2 | AC33, AC36, AC37, AC38, AC39, AC75 | EC14 | NFR5 | AC33 [e2e], AC36 [unit][e2e], AC37 [e2e], AC38 [e2e], AC39 [unit], AC75 [unit][e2e] |
| US3 | AC40, AC41, AC42 | EC15 | NFR5 | AC40 [e2e], AC41 [unit][e2e], AC42 [e2e] |
| US4 | AC7, AC14, AC15, AC16, AC17, AC43, AC44, AC47, AC48, AC88, AC89 | EC9, EC11, EC13 | NFR4 | AC7 [unit], AC14 [unit], AC15 [unit], AC16 [unit], AC17 [unit], AC43 [e2e], AC44 [e2e], AC47 [unit][e2e], AC48 [e2e], AC88 [unit], AC89 [e2e] |
| US5 | AC12, AC13, AC30, AC45, AC46 | EC12 | — | AC12 [unit], AC13 [unit][it], AC30 [e2e], AC45 [e2e], AC46 [e2e] |
| US6 | AC51 | — | — | AC51 [unit][e2e] |
| US7 | AC1, AC2, AC3, AC4, AC9, AC10, AC11, AC52, AC92 | EC10, EC17, EC18, EC19, EC20 | NFR8, NFR9, NFR10, NFR11 | AC1 [manual], AC2 [manual], AC3 [manual], AC4 [manual], AC9 [it], AC10 [unit], AC11 [unit], AC52 [e2e], AC92 [manual] |
| US8 | AC8, AC24, AC25 | — | — | AC8 [unit], AC24 [unit], AC25 [e2e] |
| US9 | AC59, AC60, AC61, AC62, AC63 | EC14 | NFR5 | AC59 [unit][e2e], AC60 [e2e], AC61 [e2e], AC62 [e2e], AC63 [e2e] |
| US10 | AC64, AC65, AC66, AC67, AC68, AC69 | EC16 | — | AC64 [unit], AC65 [unit], AC66 [e2e], AC67 [e2e], AC68 [e2e], AC69 [unit] |
| US11 | AC70, AC71 | — | — | AC70 [unit], AC71 [e2e] |
| US12 | AC78, AC79, AC80, AC81, AC82 | EC13, EC26 | NFR5 | AC78 [e2e], AC79 [unit], AC80 [e2e], AC81 [e2e], AC82 [unit] |
| US13 | AC83 | EC8 | NFR5 | AC83 [e2e] |
| US14 | AC84, AC85, AC86 | EC25 | NFR5 | AC84 [e2e], AC85 [e2e], AC86 [e2e] |
| US15 | AC58, AC76, AC77 | EC23, EC24 | NFR5 | AC58 [e2e], AC76 [e2e], AC77 [e2e] |
| system | AC49, AC50, AC53, AC54, AC87, AC90, AC91 | EC17 | NFR5, NFR6, NFR7, NFR12 | AC49 [e2e], AC50 [e2e], AC53 [it], AC54 [e2e], AC87 [e2e], AC90 [it], AC91 [unit] |
