# Third-party notices

Where each skill in this plugin comes from, under which license, and what we changed.
Licenses checked on 2026-10-25.

| Skill | Source | License | Copyright | What changed |
| :- | :- | :- | :- | :- |
| `fastify-best-practices` | [mcollina/skills](https://github.com/mcollina/skills), `skills/fastify/` | MIT | © 2026 Matteo Collina | Unchanged: `SKILL.md` and `rules/*.md` match upstream, `tile.json` is upstream metadata |
| `onion-architecture` | the dev-digest repository (the skill was written by this marketplace's author) | MIT | © 2026 Ivan Lapa (repository license) | Generalized for any TS/Node backend: removed the specific repo's structure and rules, `drizzle.md` → `persistence.md`, `zod-boundaries.md` → `validation-boundaries.md`, the architecture check became optional |
| `react-best-practices` | the dev-digest repository | MIT | © 2026 Ivan Lapa | Content unchanged |
| `react-testing-library` | the dev-digest repository | MIT | © 2026 Ivan Lapa | One sentence in `README.md` rewritten neutrally |
| `security` | the dev-digest repository | MIT | © 2026 Ivan Lapa | The path in an `examples.md` example made neutral; the install command for a third-party skill removed from `references.md` |

`onion-architecture`, `react-best-practices`, `react-testing-library` and `security` were written in dev-digest
based on public sources. Those sources are listed in the skills themselves
(`README.md`, `references.md`); they are references, not copied text.

## Full license texts

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

## Not included

- `next-best-practices` from [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)
  is not included: the repository has no license file, neither now nor in its history, so
  redistribution rights are undefined. The `next-best-practices` skill in this plugin was
  written from scratch for this marketplace (MIT, like the plugin) and contains no text from
  that repository. It relies on the public Next.js and React documentation.
