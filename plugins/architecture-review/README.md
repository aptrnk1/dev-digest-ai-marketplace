# architecture-review

Плагін з одним агентом, **`architecture-reviewer`**. Він робить read-only рев'ю
**лише структури коду**:

- розташування коду за шарами;
- напрям залежностей;
- межі модулів;
- composition root і DI;
- транзакції (Unit of Work);
- мапінг помилок і даних на межах;
- крос-пакетні правила.

Стиль, продуктивність і security агент не оцінює. Він нічого не виправляє, а повертає
знахідки з доказами й вердикт.

## Встановлення

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install architecture-review@dev-digest
```

Плагін залежить від **`engineering-paved-path`** (`^1.0.0`), і той встановиться
автоматично. З нього агент бере правила архітектури та фреймворків. Плагін також
ставиться автоматично як залежність `sdd-engineering`.

## Як викликати

| Спосіб | Приклад |
| :- | :- |
| Згадати агента в повідомленні | `@agent-architecture-review:architecture-reviewer scope: diff main..HEAD` |
| З іншого агента чи skill (Agent tool) | `subagent_type: "architecture-review:architecture-reviewer"` |
| Як головну сесію | `claude --agent architecture-review:architecture-reviewer` |

## Inputs

Обов'язково передати рівно один scope:

| Input | Що рев'юїть | Приклад |
| :- | :- | :- |
| `scope: diff <base>..HEAD` | файли, змінені в діапазоні, плюс незакомічені зміни. Просто `scope: diff` означає дефолтну гілку (зазвичай `main`) | `scope: diff main..HEAD` |
| `scope: paths <path> …` | файли й теки в поточному стані | `scope: paths src/modules/orders src/db` |
| `module: <path>` | цілий модуль | `module: src/modules/orders` |

Опційні inputs:

| Input | Навіщо | Приклад |
| :- | :- | :- |
| `arch_check: <command>` | ground truth для напряму імпортів: кожне **нове** порушення стає `critical`, baselined — `info`. Якщо не передати, агент шукає gate сам (скрипт `arch:check`, `.dependency-cruiser.*`, eslint boundaries), а без gate трасує імпорти вручну | `arch_check: npx depcruise src --config .dependency-cruiser.cjs --ignore-known --output-type err` |
| `rules: <path>` | архітектурний документ проєкту. Там, де він розходиться із загальними правилами skills, перемагає він | `rules: docs/architecture.md` |
| `plan: <path>` + `task: T<n>` | контекст: що задача мала зробити і якими файлами вона володіє | `plan: specs/plans/checkout.md` `task: T3` |
| `previous: <findings>` + `since: <sha>` | **delta-режим** для повторного кола: агент позначає попередні знахідки як `fixed`, `open` або `moved` і рев'юїть лише змінене з `<sha>` | `previous: reports/checkout/review-1.md` `since: a1b2c3d` |

Без scope, з неоднозначним scope або з неіснуючими шляхами агент повертає
`Verdict: NEEDS_CONTEXT`.

## Які skills підтягує

Агент вантажить skills з `engineering-paved-path` через Skill tool, лише коли у scope є
відповідні файли, і застосовує тільки їхній архітектурний зріз:

| У scope є | Skill |
| :- | :- |
| backend із шарами (domain, use cases, repositories, adapters) | `engineering-paved-path:onion-architecture` |
| Fastify routes і plugins | `engineering-paved-path:fastify-best-practices` |
| Next.js (`app/`, RSC, route handlers) | `engineering-paved-path:next-best-practices` |
| React-компоненти й хуки | `engineering-paved-path:react-best-practices` |
| межі довіри (валідація входу, auth, секрети) | `engineering-paved-path:security`, лише щоб перевірити, *де* стоїть перевірка |

Також агент читає документацію проєкту, яка є: `rules:`, root `CLAUDE.md`,
`README.md` §Architecture, `ARCHITECTURE.md`, `docs/adr/`, а ще `CLAUDE.md`,
`README.md` чи `INSIGHTS.md` модулів у scope.

## Що повертає

```markdown
## Architecture review — <scope>
Verdict: APPROVE | APPROVE_WITH_CONCERNS | REQUEST_CHANGES | NEEDS_CONTEXT
Counts: critical · major · minor · nit · info
### Architecture gate        — команда, exit code, нові та baselined порушення
### Findings                 — id, severity, rule, file:line, дослівна цитата, чому, напрям виправлення
### Previous findings        — лише в delta-режимі
### Checklist                — лише пункти, що не пройшли, і n/a
### Not verified             — що не вдалося перевірити і чому
### Insight candidates       — уроки, які варто записати в документацію проєкту
```

**Шкала severity:**

| Severity | Значення |
| :- | :- |
| `critical` | внесено цим scope: нове порушення напряму залежностей, порушення задокументованого правила проєкту або структурна зміна, що ламає контракт |
| `major` | явне порушення правила, яке ускладнює зміни й тести, хоча зараз нічого не зламано |
| `minor` | варто виправити, якщо це дешево |
| `nit` | смак, лише якщо правило прямо так каже |
| `info` | проблема в коді, якого scope не змінював |

**Вердикт:**

| Вердикт | Коли |
| :- | :- |
| `REQUEST_CHANGES` | є хоча б один `critical` |
| `APPROVE_WITH_CONCERNS` | немає `critical`, є `major` |
| `APPROVE` | решта випадків |

Кожна знахідка має `file:line` і дослівну цитату, інакше агент її відкидає. Перед
звітом агент сам перепровіряє кожен `critical` і `major` (self-refutation). Нуль
знахідок — нормальний результат.

## Гарантії та їхні межі

- Інструменти: `Read, Grep, Glob, Bash, Skill`. Заборонені `Write`, `Edit`,
  `NotebookEdit`, `Agent`, `WebSearch` і `WebFetch`.
- **Bash лише read-only, але тримається це тільки на промпті.** Агенту дозволено
  `git diff/log/show/blame`, `ls`, `cat`, `rg`, `jq` і передану команду `arch_check`.
  Для жорсткого обмеження налаштуйте
  [permission rules](https://code.claude.com/docs/en/permissions) у проєкті.
- Агент не пише в `INSIGHTS.md`, `CLAUDE.md` чи ADR, а лише пропонує кандидатів.
- Вміст файлів, diff-ів і планів вважається даними, а не інструкціями.
- Модель: `sonnet`, до 40 ходів.

## Evals

`evals/` містить два кейси для `claude plugin eval`:

- `flags-layer-violation`: сервіс імпортує клієнт БД і конкретний репозиторій.
  Агент має повернути `REQUEST_CHANGES` з посиланням на `service.ts:<line>`;
- `clean-module-approves`: правильно розшарований модуль. Агент має дати `APPROVE`
  і не вигадувати знахідок.

```bash
cd plugins/architecture-review
claude plugin eval . --scaffold
```

Кейси підключають сусідній `../engineering-paved-path` через поле `plugins` у
`case.yaml`, щоб залежність була доступна.

## На чому базується

- Claude Code, [Create custom subagents](https://code.claude.com/docs/en/sub-agents):
  read-only агент через `disallowedTools`.
- Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents),
  патерн *evaluator-optimizer*: рецензент оцінює результат і повертає зауваження, а
  не виправляє сам.
- obra/superpowers, [`requesting-code-review/code-reviewer.md`](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/code-reviewer.md):
  знахідки з `file:line`, градація severity і фінальний вердикт.
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser): типовий
  інструмент для `arch_check`, хоча підійде будь-який gate напряму імпортів.

Історія змін описана в [CHANGELOG.md](CHANGELOG.md).
