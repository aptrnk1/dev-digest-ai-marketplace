# Engineering Paved Path

Набір skills для типового стеку TypeScript: React на фронтенді, Fastify на
бекенді, onion-архітектура між ними, тести на React Testing Library і перевірка
безпеки за OWASP. Skills підвантажуються самі, коли задача їм відповідає, або на
вашу команду.

Плагін нічого не запускає на вашій машині: тут немає hooks, MCP-серверів і
виконуваних файлів, лише Markdown-інструкції.

## Встановлення

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install engineering-paved-path@dev-digest
```

Якщо ви ставите `architecture-review` або `sdd-engineering`, цей плагін
встановиться автоматично як їхня залежність.

## Skills

| Skill | Коли спрацьовує | Що дає |
| :- | :- | :- |
| `react-best-practices` | пишете, рев'юїте чи рефакторите React-компоненти, хуки, стан | каталог анти-патернів 2025–26: дизайн компонентів, стан, хуки, продуктивність, data fetching; приклади в `examples.md` |
| `next-best-practices` | пишете чи рев'юїте код у Next.js App Router; вирішуєте, де мають жити UI, дані чи мутація | межі server/client, data fetching і кешування з урахуванням версії, async request APIs, Server Actions, route handlers, файлові конвенції, metadata, streaming, hydration; чекліст рев'ю |
| `fastify-best-practices` | будуєте чи дебажите Fastify-сервер або REST API | правила за темами в `rules/`: роути, плагіни, схеми, помилки, хуки, автентифікація, CORS, логування, тести через `inject()`, деплой |
| `onion-architecture` | додаєте модуль, роут, сервіс, репозиторій чи адаптер; питаєте «куди це покласти?»; рев'юїте структуру бекенду | шари й напрям імпортів, ports & adapters, composition root, Unit of Work, доменні помилки проти HTTP-помилок, шаблон модуля, чекліст рев'ю, опційна перевірка через dependency-cruiser |
| `react-testing-library` | пишете чи налаштовуєте тести React-компонентів і хуків | менше довших тестів за сценаріями користувача, пріоритет запитів RTL, `userEvent`, асинхронні патерни, MSW, Vitest |
| `security` | рев'юїте код на вразливості, робите автентифікацію чи авторизацію, обробляєте ввід, файли, секрети, API | OWASP Top 10:2025, чеклісти в `checklists.md`, приклади вразливого й безпечного коду в `examples.md` |

### Як викликати

- **Автоматично.** Claude читає `description` кожного skill і вантажить його, коли
  задача підходить. Наприклад, «додай ендпоінт для замовлень» підтягне
  `onion-architecture` і `fastify-best-practices`.
- **Вручну.** Наберіть команду з префіксом плагіна:

  ```text
  /engineering-paved-path:onion-architecture куди покласти інтеграцію з платіжкою?
  /engineering-paved-path:security перевір src/modules/auth/ на вразливості
  /engineering-paved-path:react-testing-library напиши тест для форми входу
  ```

## Як цим користуються інші плагіни

- **`architecture-review`** залежить від цього плагіна. Агент
  `architecture-review:architecture-reviewer` вантажить `onion-architecture` для
  бекенду, `react-best-practices` і `next-best-practices` для фронтенду, а `fastify-best-practices` і
  `security` — коли зміни їх зачіпають.
- **`sdd-engineering`** теж від нього залежить. `implementation-planner`
  записує в кожну задачу плану 1–3 потрібні skills, а `implementer` і
  `plan-verifier` вантажать саме їх.

### Підключити до свого агента

Агент може підвантажити skill через Skill tool за повним іменем. Додайте `Skill`
у `tools` агента і напишіть у його промпті, наприклад:

```markdown
Before reviewing backend code, load the skill
`engineering-paved-path:onion-architecture` with the Skill tool.
```

Повне ім'я з префіксом плагіна потрібне завжди: без нього Claude Code може не
знайти skill або взяти інший з такою самою назвою.

## Обмеження

- Skills — це поради, а не перевірки. Якщо правило має виконуватися завжди
  (наприклад, напрям імпортів), заведіть у проєкті механічну перевірку:
  `onion-architecture` описує, як зробити це через dependency-cruiser.
- Правила вашого проєкту (`CLAUDE.md`, документ архітектури, конфіг лінтера)
  важливіші за ці skills.
- `next-best-practices` написаний з нуля. Якщо ваша версія Next.js сама постачає
  документацію (`node_modules/next/dist/docs/`, згенерований `AGENTS.md`), Claude
  має віддавати перевагу їй.

## Посилання

- [CHANGELOG.md](CHANGELOG.md) — історія версій.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — походження і ліцензії skills.
- [LICENSE](LICENSE) — MIT.
