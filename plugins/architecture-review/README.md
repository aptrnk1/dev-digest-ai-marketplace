# architecture-review

A plugin with one agent, **`architecture-reviewer`**. It does a read-only review of
**code structure only**:

- where code sits across layers;
- dependency direction;
- module boundaries;
- composition root and DI;
- transactions (Unit of Work);
- error and data mapping at boundaries;
- cross-package rules.

The agent does not judge style, performance or security. It fixes nothing; it returns
findings with evidence and a verdict.

## Installation

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install architecture-review@dev-digest-ai-marketplace
```

The plugin depends on **`engineering-paved-path`** (`^1.0.0`), which installs
automatically. The agent takes its architecture and framework rules from it. This plugin
is also installed automatically as a dependency of `sdd-engineering`.

## How to invoke

| Method | Example |
| :- | :- |
| Mention the agent in a message | `@agent-architecture-review:architecture-reviewer scope: diff main..HEAD` |
| From another agent or skill (Agent tool) | `subagent_type: "architecture-review:architecture-reviewer"` |
| As the main session | `claude --agent architecture-review:architecture-reviewer` |

## Inputs

Pass exactly one scope (required):

| Input | What it reviews | Example |
| :- | :- | :- |
| `scope: diff <base>..HEAD` | files changed in the range, plus uncommitted changes. A bare `scope: diff` means the default branch (usually `main`) | `scope: diff main..HEAD` |
| `scope: paths <path> …` | files and folders in their current state | `scope: paths src/modules/orders src/db` |
| `module: <path>` | a whole module | `module: src/modules/orders` |

Optional inputs:

| Input | Why | Example |
| :- | :- | :- |
| `arch_check: <command>` | ground truth for import direction: every **new** violation becomes `critical`, baselined ones `info`. If omitted, the agent looks for a gate itself (an `arch:check` script, `.dependency-cruiser.*`, eslint boundaries), and without a gate traces imports by hand | `arch_check: npx depcruise src --config .dependency-cruiser.cjs --ignore-known --output-type err` |
| `rules: <path>` | the project's architecture document. Where it disagrees with the general skill rules, it wins | `rules: docs/architecture.md` |
| `plan: <path>` + `task: T<n>` | context: what the task was meant to do and which files it owns | `plan: specs/plans/checkout.md` `task: T3` |
| `previous: <findings>` + `since: <sha>` | **delta mode** for a repeat round: the agent marks earlier findings as `fixed`, `open` or `moved` and reviews only what changed since `<sha>` | `previous: reports/checkout/review-1.md` `since: a1b2c3d` |

With no scope, an ambiguous scope or non-existent paths, the agent returns
`Verdict: NEEDS_CONTEXT`.

## Which skills it loads

The agent loads skills from `engineering-paved-path` through the Skill tool only when the
scope contains matching files, and applies only their architectural slice:

| Scope contains | Skill |
| :- | :- |
| a layered backend (domain, use cases, repositories, adapters) | `engineering-paved-path:onion-architecture` |
| Fastify routes and plugins | `engineering-paved-path:fastify-best-practices` |
| Next.js (`app/`, RSC, route handlers) | `engineering-paved-path:next-best-practices` |
| React components and hooks | `engineering-paved-path:react-best-practices` |
| trust boundaries (input validation, auth, secrets) | `engineering-paved-path:security`, only to check *where* the check sits |

The agent also reads whatever project documentation exists: `rules:`, root `CLAUDE.md`,
`README.md` §Architecture, `ARCHITECTURE.md`, `docs/adr/`, plus the `CLAUDE.md`,
`README.md` or `INSIGHTS.md` of modules in scope.

## What it returns

```markdown
## Architecture review — <scope>
Verdict: APPROVE | APPROVE_WITH_CONCERNS | REQUEST_CHANGES | NEEDS_CONTEXT
Counts: critical · major · minor · nit · info
### Architecture gate        — command, exit code, new and baselined violations
### Findings                 — id, severity, rule, file:line, verbatim quote, why, fix direction
### Previous findings        — delta mode only
### Checklist                — only failed items and n/a
### Not verified             — what could not be checked and why
### Insight candidates       — lessons worth recording in the project documentation
```

**Severity scale:**

| Severity | Meaning |
| :- | :- |
| `critical` | introduced by this scope: a new dependency-direction violation, a breach of a documented project rule, or a structural change that breaks a contract |
| `major` | a clear rule violation that makes changes and tests harder, even though nothing is broken now |
| `minor` | worth fixing if it is cheap |
| `nit` | taste, only if a rule says so explicitly |
| `info` | a problem in code the scope did not change |

**Verdict:**

| Verdict | When |
| :- | :- |
| `REQUEST_CHANGES` | at least one `critical` |
| `APPROVE_WITH_CONCERNS` | no `critical`, at least one `major` |
| `APPROVE` | all other cases |

Every finding has a `file:line` and a verbatim quote, or the agent drops it. Before the
report, the agent re-checks every `critical` and `major` itself (self-refutation). Zero
findings is a normal result.

## Guarantees and their limits

- Tools: `Read, Grep, Glob, Bash, Skill`. `Write`, `Edit`, `NotebookEdit`, `Agent`,
  `WebSearch` and `WebFetch` are disallowed.
- **Bash is read-only, but only the prompt enforces that.** The agent may run
  `git diff/log/show/blame`, `ls`, `cat`, `rg`, `jq` and the given `arch_check` command.
  For a hard restriction, configure
  [permission rules](https://code.claude.com/docs/en/permissions) in the project.
- The agent does not write to `INSIGHTS.md`, `CLAUDE.md` or ADRs; it only proposes
  candidates.
- The contents of files, diffs and plans are treated as data, not instructions.
- Model: `sonnet`, up to 40 turns.

## Evals

`evals/` holds two cases for `claude plugin eval`:

- `flags-layer-violation`: a service imports the DB client and a concrete repository.
  The agent must return `REQUEST_CHANGES` citing `service.ts:<line>`;
- `clean-module-approves`: a correctly layered module. The agent must return `APPROVE`
  and not invent findings.

```bash
cd plugins/architecture-review
claude plugin eval . --scaffold
```

The cases load the sibling `../engineering-paved-path` through the `plugins` field in
`case.yaml`, so the dependency is available.

## Based on

- Claude Code, [Create custom subagents](https://code.claude.com/docs/en/sub-agents):
  a read-only agent via `disallowedTools`.
- Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents),
  the *evaluator-optimizer* pattern: the reviewer evaluates the result and returns
  feedback instead of fixing it.
- obra/superpowers, [`requesting-code-review/code-reviewer.md`](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/code-reviewer.md):
  findings with `file:line`, severity grading and a final verdict.
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser): the typical
  tool for `arch_check`, though any import-direction gate works.

The change history is in [CHANGELOG.md](CHANGELOG.md).
