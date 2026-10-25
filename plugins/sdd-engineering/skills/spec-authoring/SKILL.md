---
name: spec-authoring
description: "Writing and reviewing Spec Driven Development feature specs in Ukrainian: EARS acceptance criteria (5 patterns + combinations), ISO/IEC/IEEE 29148 quality attributes, weak words, verification hints (unit / it / e2e / manual), NFRs and the US → AC → verification traceability matrix; plus the Screens × states method for UI designs (Nielsen heuristics, WCAG 2.2 AA), trust boundaries for LLM-facing features (OWASP Top 10 for LLM Applications 2025), Mermaid for module-interaction diagrams, the spec template and the script that saves chat screenshots as design files. Use when writing or reviewing a spec, its Acceptance criteria / NFRs, its UI states or its Inputs and provenance / Untrusted inputs sections."
---

# Spec authoring (SDD)

A requirement is good when two engineers who read it independently would build
the same thing, and a tester can say pass/fail without asking anyone.

This skill is the method behind `sdd-engineering:spec-creator`. Pieces that a
spec needs only sometimes live in `references/` next to this file — read the
one you need with `Read`:

| File | Read when |
|---|---|
| `references/ears-examples.md` | you want bad → good examples of ACs and NFRs |
| `references/ux-states.md` | the feature has UI, or you analyse a design |
| `references/llm-trust-boundaries.md` | any input reaches an LLM, or LLM / user / repo data is shown or stored |
| `references/mermaid.md` (+ `mermaid-examples.md`) | the module-interaction section needs a diagram |
| `templates/spec.md` | the output format (unless the repo has its own `<specs_dir>/_template.md`) |

Paths: `${CLAUDE_SKILL_DIR}/references/…`, `${CLAUDE_SKILL_DIR}/templates/spec.md`.

## 1. Patterns

| Тип | Шаблон | Коли |
|---|---|---|
| `ubiquitous` | Система повинна (shall) <відповідь>. | діє завжди, без тригера |
| `event` | КОЛИ <тригер>, система повинна (shall) <відповідь>. | реакція на одну подію |
| `state` | ПОКИ <стан>, система повинна (shall) <відповідь>. | поведінка протягом стану |
| `unwanted` | ЯКЩО <небажана умова>, ТОДІ система повинна (shall) <відповідь>. | помилки, збої, зловживання |
| `optional` | ДЕ <опцію ввімкнено / є фіча>, система повинна (shall) <відповідь>. | налаштування, фіча-прапорці |

**Комбінації** (тип = `complex`) — порядок ключів фіксований:
`ДЕ … ПОКИ … КОЛИ … система повинна (shall) …`.
Приклад: «ПОКИ триває імпорт, КОЛИ юзер натискає Re-import, API повинен
(shall) відповісти 409 `import_in_progress`.»

**Суб'єкт.** «Система» можна звузити до того, кого видно ззовні:
`UI`, `API`, `CLI`, `MCP-сервер`, `фоновий воркер`. Не можна — клас, файл,
функцію.

## 2. Quality attributes (ISO/IEC/IEEE 29148)

Кожен AC має бути:
- **singular** — одна поведінка. «… і показати toast, і записати лог» → два AC;
- **unambiguous** — одне прочитання (див. слабкі слова нижче);
- **verifiable** — є спостережуваний результат і спосіб перевірки;
- **feasible** — не суперечить правилам проєкту (`CLAUDE.md`: do-not-touch,
  секрети, міграції);
- **necessary** — прибери AC, і щось важливе стане неперевіреним;
- **implementation-free** — описує поведінку, а не код;
- **consistent** — не суперечить іншим AC/NFR (перевір пари з однаковим тригером).

## 3. Weak words → replace

| Слабке | Чим замінити |
|---|---|
| швидко, миттєво, без затримок | `≤ N мс/с` на якому обсязі (p95) |
| зручно, інтуїтивно, красиво | конкретна дія/стан: «фокус переходить на …», «кнопка disabled з підказкою …» |
| коректно, правильно, належним чином | який саме результат: статус, текст, дані |
| за потреби, якщо можливо, бажано | умова `ДЕ`/`ЯКЩО` або перенести в Open questions |
| тощо, і т.д., наприклад, і/або | повний перелік |
| підтримувати X | що саме юзер може зробити з X |
| великий, багато, довгий | число: `> 500 файлів`, `> 200 символів` |
| обробити помилку | `unwanted`-AC: що бачить юзер, що лишається в БД |
| має бути безпечно | конкретна ізоляція (див. `references/llm-trust-boundaries.md`, `engineering-paved-path:security`) |

## 4. Verification hints

Кожен AC отримує одну або кілька міток — у якому лейні його перевіряють
(лейни бери з testing guide репо, якщо він є):

- `[unit]` — чиста логіка, API-хендлер з фейками/моками, компонентний тест UI,
  тест рушія без I/O;
- `[it]` — потрібна реальна інфраструктура (БД, черга): транзакції, міграції,
  конкурентність, 409 через стан БД;
- `[e2e]` — видимий у браузері чи CLI сценарій на seed-даних; **ніколи** не
  перевіряє вивід LLM (e2e детерміновані, без LLM);
- `[manual]` — лише якщо автоматизувати неможливо (візуал, реальний LLM);
  вкажи, хто і як перевіряє.

Поведінка, що залежить від відповіді LLM, перевіряється `[unit]`/`[it]` з
мок-провайдером, а не `[e2e]`.

## 5. NFR

Формат: `**NFR<n>** <атрибут>: <вимога з числом> — перевірка: <як>`.
Типові атрибути: латентність UI/API, час фонової задачі, ліміти (розмір
входу, кількість файлів, токени), вартість LLM-виклику, a11y (WCAG 2.2 AA),
i18n (усі рядки в каталозі рядків репо), стійкість (що при перезапуску
посеред задачі), спостережуваність (що логуються помилки).

NFR без числа або без способу перевірки — це побажання; переформулюй або в
Open questions.

## 6. Traceability

Матриця в кінці спеки:

| US | AC | Edge cases | Verification |
|---|---|---|---|
| US1 | AC1, AC2 | EC1 | AC1 [unit], AC2 [e2e] |

Правила: кожна US має ≥1 AC; кожен AC посилається на US (або позначений
`(system)` для наскрізних вимог — безпека, NFR-похідні); кожен Edge case →
AC або Open question; кожен AC має verification-мітку.

## 7. Designs (screenshots → files)

Сабагенти не бачать вкладень із чату, тому макети зберігаються у файли
`<designs_dir>/<YYYY-MM-DD>-<slug>/D1.png, D2.png…` (дефолт
`designs_dir` = `specs/designs/`), і будь-який агент читає їх через `Read`.
`spec-creator` не має Bash, тому скрипт запускає оркестратор або юзер (у
промпті Claude Code — з префіксом `!`):

```bash
node "${CLAUDE_SKILL_DIR}/scripts/save-designs.mjs" specs/designs/2026-01-15-order-refund
#   default    зображення з останнього повідомлення юзера, де вони є
#   --all      усі зображення, які юзер вклав у цій сесії
#   --file P   додатково скопіювати файл з диска (можна кілька разів)
#   --session  id сесії (дефолт: $CLAUDE_CODE_SESSION_ID)
```

Файли нумеруються далі від наявних `D<n>`; дублікат (sha256) пропускається.
Індекс макетів — розділ `## Дизайн` спеки.

## 8. Review checklist (for a spec reviewer)

- [ ] Кожен AC: ID, тип, ключові слова типу, одна поведінка, суб'єкт ззовні.
- [ ] Жодного слабкого слова з §3.
- [ ] Для кожного `event` є відповідний `unwanted` (що буде, коли тригер
      провалюється), або явне пояснення, чому не потрібен.
- [ ] Немає двох AC з однаковим тригером і різною відповіддю.
- [ ] Числа узгоджені між AC, NFR і Edge cases.
- [ ] Traceability повна (§6).
- [ ] Кожна не-ideal клітинка Screens × states → AC або Open question
      (`references/ux-states.md`).
- [ ] Кожен untrusted вхід має ізоляцію (`references/llm-trust-boundaries.md`).

## Sources

- Alistair Mavin, [EARS — Easy Approach to Requirements Syntax](https://alistairmavin.com/ears/).
- ISO/IEC/IEEE 29148 — атрибути якості вимог.
- GitHub Spec Kit, [spec template](https://github.com/github/spec-kit/blob/main/templates/spec-template.md).
- Nielsen Norman Group, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/); [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/).
