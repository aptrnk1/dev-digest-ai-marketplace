# Engineering Paved Path

A set of skills for a typical TypeScript stack: React on the frontend, Fastify on
the backend, onion architecture between them, tests with React Testing Library and
OWASP-based security review. Skills load on their own when a task matches them, or on
your command.

The plugin runs nothing on your machine: there are no hooks, MCP servers or
executables here, only Markdown instructions.

## Installation

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install engineering-paved-path@dev-digest
```

If you install `architecture-review` or `sdd-engineering`, this plugin installs
automatically as their dependency.

## Skills

| Skill | When it triggers | What it gives |
| :- | :- | :- |
| `react-best-practices` | you write, review or refactor React components, hooks, state | a 2025–26 anti-pattern catalog: component design, state, hooks, performance, data fetching; examples in `examples.md` |
| `next-best-practices` | you write or review Next.js App Router code; you decide where UI, data or a mutation should live | server/client boundaries, version-aware data fetching and caching, async request APIs, Server Actions, route handlers, file conventions, metadata, streaming, hydration; a review checklist |
| `fastify-best-practices` | you build or debug a Fastify server or REST API | rules by topic in `rules/`: routes, plugins, schemas, errors, hooks, authentication, CORS, logging, tests via `inject()`, deployment |
| `onion-architecture` | you add a module, route, service, repository or adapter; you ask "where does this go?"; you review backend structure | layers and import direction, ports & adapters, composition root, Unit of Work, domain errors vs HTTP errors, a module template, a review checklist, an optional dependency-cruiser check |
| `react-testing-library` | you write or set up tests for React components and hooks | fewer, longer tests built around user scenarios, RTL query priority, `userEvent`, async patterns, MSW, Vitest |
| `security` | you review code for vulnerabilities, build authentication or authorization, handle input, files, secrets, APIs | OWASP Top 10:2025, checklists in `checklists.md`, vulnerable and secure code examples in `examples.md` |

### How to invoke

- **Automatically.** Claude reads each skill's `description` and loads it when the
  task fits. For example, "add an endpoint for orders" pulls in
  `onion-architecture` and `fastify-best-practices`.
- **Manually.** Type the command with the plugin prefix:

  ```text
  /engineering-paved-path:onion-architecture where should the payment integration go?
  /engineering-paved-path:security check src/modules/auth/ for vulnerabilities
  /engineering-paved-path:react-testing-library write a test for the login form
  ```

## How other plugins use it

- **`architecture-review`** depends on this plugin. The agent
  `architecture-review:architecture-reviewer` loads `onion-architecture` for the
  backend, `react-best-practices` and `next-best-practices` for the frontend, and
  `fastify-best-practices` and `security` when the changes touch them.
- **`sdd-engineering`** depends on it too. `implementation-planner`
  records 1–3 required skills in each plan task, and `implementer` and
  `plan-verifier` load exactly those.

### Wire it into your own agent

An agent can load a skill through the Skill tool by its full name. Add `Skill`
to the agent's `tools` and write in its prompt, for example:

```markdown
Before reviewing backend code, load the skill
`engineering-paved-path:onion-architecture` with the Skill tool.
```

The full name with the plugin prefix is always required: without it Claude Code may
not find the skill or may pick another one with the same name.

## Limitations

- Skills are advice, not checks. If a rule must always hold
  (for example, import direction), set up a mechanical check in the project:
  `onion-architecture` describes how to do it with dependency-cruiser.
- Your project's rules (`CLAUDE.md`, the architecture document, the linter config)
  take precedence over these skills.
- `next-best-practices` was written from scratch. If your Next.js version ships its own
  documentation (`node_modules/next/dist/docs/`, a generated `AGENTS.md`), Claude
  should prefer it.

## Links

- [CHANGELOG.md](CHANGELOG.md) — version history.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — origin and licenses of the skills.
- [LICENSE](LICENSE) — MIT.
