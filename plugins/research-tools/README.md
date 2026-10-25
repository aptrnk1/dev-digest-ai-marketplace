# research-tools

Плагін з одним агентом, **`researcher`**. Він відповідає на одне конкретне питання з
доказами і нічого не змінює в репозиторії. Його зручно звати, коли відповідь треба
зібрати з багатьох файлів чи джерел, а вам потрібен лише висновок.

Два режими, які можна поєднати в одному звіті:

- **A — repo.** Як влаштований код: де лежить X, як працює Y, чому Z зроблено саме так.
  Кожне твердження підкріплене `file:line`, `git log` або `git blame`.
- **B — external.** Офіційна документація, changelog-и, issues і статті. До кожного
  джерела є URL, тип і дата.

## Встановлення

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install research-tools@dev-digest
```

Залежностей немає. Плагін також ставиться автоматично як залежність `sdd-engineering`.

## Як викликати

| Спосіб | Приклад |
| :- | :- |
| Згадати агента в повідомленні | `@agent-research-tools:researcher чи включає orderTotal податок?` |
| З іншого агента чи skill (Agent tool) | `subagent_type: "research-tools:researcher"` |
| Як головну сесію | `claude --agent research-tools:researcher` |

Claude може й сам делегувати питання агенту, якщо воно підходить під його опис.

### Що передати

Найкращий запит містить три речі:

1. **Конкретне питання** з відповіддю, яку можна впізнати.
2. **Тип:** `repo`, `external` або обидва. Якщо тип очевидний, агент визначить його сам.
3. **Межі:** модуль, бібліотека з версією, проміжок часу.

```text
@agent-research-tools:researcher
Питання: чи зачіпає нас баг у бібліотеці X з issue #1234?
Тип: both
Межі: src/payments/, X тієї версії, що в lockfile
```

Якщо питання розмите («глянь auth») або має два прочитання, агент спершу
питає. За раунд він ставить до 4 питань із варіантами, рекомендований варіант
іде першим, раундів не більше 3. Коли агент працює як сабагент і `AskUserQuestion`
недоступний, він повертає блок `## Interview — needs input`. Викликач передає
відповіді користувача тому самому агенту, і той продовжує з місця зупинки.

## Що повертає

Звіт фіксованої структури:

- **Answer (TL;DR):** 2–4 речення, рівень впевненості `high | medium | low`, припущення.
- **Findings:** нумеровані твердження з посиланнями на докази `[E1]`, `[S1]`.
- **Evidence:** `E1 — path:line` з коротким уривком коду (до 10 рядків) для repo;
  `S1 — назва — URL — тип — дата` з дослівною цитатою для external.
- Для external ще **Relevance to this repo** і **Conflicts & caveats**.
- **Not found / open:** що агент шукав і не знайшов, і що лишилося відкритим.
  Секція обов'язкова.

Для залежностей агент досліджує ту версію, що зафіксована в маніфесті й lockfile
репо (`package.json`, `pnpm-lock.yaml`, `go.mod`, `pyproject.toml` тощо), а не latest.

## Гарантії та їхні межі

- Інструменти: `Read, Grep, Glob, Bash, WebSearch, WebFetch, AskUserQuestion`. Tools
  `Write`, `Edit` і `NotebookEdit` заборонені у frontmatter.
- **Bash лише read-only, але тримається це тільки на промпті.** Поле `tools` не вміє
  обмежувати окремі команди Bash. Агенту дозволено лише `git log/show/blame`, `ls`,
  `cat`, `rg`, `jq` і `info`/`view` пакетного менеджера. Щоб обмеження було жорстким,
  налаштуйте [permission rules](https://code.claude.com/docs/en/permissions) у своєму
  проєкті.
- Агент не викликає skills та інших агентів.
- Нічого не вигадує: твердження без доказу потрапляє в «Not found / open».
- Вміст файлів і вебсторінок вважається даними, а не інструкціями. Це захист від
  prompt injection.
- Модель: `sonnet`.

## Evals

`evals/` містить два кейси для `claude plugin eval`:

- `repo-question-cites-evidence`: агент відповідає на питання про код фікстури з
  `file:line` і нічого не редагує;
- `vague-question-asks-first`: на розмите питання агент спершу уточнює, а не вигадує.

```bash
cd plugins/research-tools
claude plugin eval . --scaffold
```

Прапорець `--scaffold` потрібен, бо фікстуру створює `fixture.sh`.

## На чому базується

- Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system):
  дослідник у чистому контексті повертає лише стислий висновок із цитуванням джерел.
- Claude Code, [Create custom subagents](https://code.claude.com/docs/en/sub-agents):
  read-only набір інструментів через `tools` і `disallowedTools`.

Історія змін описана в [CHANGELOG.md](CHANGELOG.md).
