# Third-party notices

Звідки взято кожен skill цього плагіна, під якою ліцензією, і що ми змінили.
Ліцензію перевірено 2026-10-25.

| Skill | Звідки | Ліцензія | Copyright | Що змінено |
| :- | :- | :- | :- | :- |
| `fastify-best-practices` | [mcollina/skills](https://github.com/mcollina/skills), `skills/fastify/` | MIT | © 2026 Matteo Collina | Без змін: `SKILL.md` і `rules/*.md` збігаються з upstream, `tile.json` — метадані upstream |
| `onion-architecture` | репозиторій dev-digest (skill написав автор цього маркетплейсу) | MIT | © 2026 Ivan Lapa (ліцензія репозиторію) | Узагальнено для будь-якого TS/Node бекенду: прибрано структуру й правила конкретного репо, `drizzle.md` → `persistence.md`, `zod-boundaries.md` → `validation-boundaries.md`, перевірка архітектури стала опційною |
| `react-best-practices` | репозиторій dev-digest | MIT | © 2026 Ivan Lapa | Без змін за змістом |
| `react-testing-library` | репозиторій dev-digest | MIT | © 2026 Ivan Lapa | Одне речення в `README.md` переписано нейтрально |
| `security` | репозиторій dev-digest | MIT | © 2026 Ivan Lapa | Шлях у прикладі `examples.md` зроблено нейтральним; з `references.md` прибрано команду встановлення стороннього skill |

`onion-architecture`, `react-best-practices`, `react-testing-library` і `security` написані в dev-digest
з опорою на публічні джерела. Перелік цих джерел лежить у самих skills
(`README.md`, `references.md`); це посилання, а не скопійований текст.

## Повний текст ліцензій

### MIT — Matteo Collina (`fastify-best-practices`)

```
MIT License

Copyright (c) 2026 Matteo Collina

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### MIT — Ivan Lapa (`onion-architecture`, `react-best-practices`, `react-testing-library`, `security`)

```
MIT License

Copyright (c) 2026 Ivan Lapa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Не включено

- `next-best-practices` з [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)
  не включено: у репозиторії немає файлу ліцензії ні зараз, ні в історії, тож права
  на поширення не визначені. Skill `next-best-practices` у цьому плагіні написаний
  з нуля для цього маркетплейсу (MIT, як і плагін) і не містить тексту з того
  репозиторію. Він спирається на публічну документацію Next.js і React.
