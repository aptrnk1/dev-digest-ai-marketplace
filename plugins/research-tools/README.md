# research-tools

A plugin with one agent, **`researcher`**. It answers one specific question with
evidence and changes nothing in the repository. Call it when the answer has to be
gathered from many files or sources and you only need the conclusion.

Two modes, which can be combined in one report:

- **A — repo.** How the code works: where X lives, how Y works, why Z was done that way.
  Every claim is backed by `file:line`, `git log` or `git blame`.
- **B — external.** Official documentation, changelogs, issues and articles. Every
  source comes with a URL, type and date.

## Installation

```bash
/plugin marketplace add aptrnk1/dev-digest-ai-marketplace
/plugin install research-tools@dev-digest-ai-marketplace
```

No dependencies. The plugin is also installed automatically as a dependency of `sdd-engineering`.

## How to invoke

| Method | Example |
| :- | :- |
| Mention the agent in a message | `@agent-research-tools:researcher does orderTotal include tax?` |
| From another agent or skill (Agent tool) | `subagent_type: "research-tools:researcher"` |
| As the main session | `claude --agent research-tools:researcher` |

Claude can also delegate a question to the agent on its own when it matches the agent's description.

### What to pass

The best request has three parts:

1. **A specific question** with a recognizable answer.
2. **Type:** `repo`, `external` or both. If the type is obvious, the agent works it out.
3. **Bounds:** a module, a library and its version, a time range.

```text
@agent-research-tools:researcher
Question: are we affected by the bug in library X from issue #1234?
Type: both
Bounds: src/payments/, X at the version in the lockfile
```

If the question is vague ("look at auth") or has two readings, the agent asks first.
Per round it asks up to 4 questions with options, the recommended option first, and
runs no more than 3 rounds. When the agent runs as a subagent and `AskUserQuestion` is
unavailable, it returns a `## Interview — needs input` block. The caller passes the
user's answers back to the same agent, which continues where it stopped.

## What it returns

A report with a fixed structure:

- **Answer (TL;DR):** 2–4 sentences, a confidence level `high | medium | low`, assumptions.
- **Findings:** numbered claims with evidence references `[E1]`, `[S1]`.
- **Evidence:** `E1 — path:line` with a short code excerpt (up to 10 lines) for repo;
  `S1 — title — URL — type — date` with a verbatim quote for external.
- For external, also **Relevance to this repo** and **Conflicts & caveats**.
- **Not found / open:** what the agent looked for and did not find, and what remains
  open. This section is mandatory.

For dependencies, the agent researches the version pinned in the repo's manifest and
lockfile (`package.json`, `pnpm-lock.yaml`, `go.mod`, `pyproject.toml` and so on), not latest.

## Guarantees and their limits

- Tools: `Read, Grep, Glob, Bash, WebSearch, WebFetch, AskUserQuestion`. The tools
  `Write`, `Edit` and `NotebookEdit` are disallowed in the frontmatter.
- **Bash is read-only, but only the prompt enforces that.** The `tools` field cannot
  restrict individual Bash commands. The agent may run only `git log/show/blame`, `ls`,
  `cat`, `rg`, `jq` and the package manager's `info`/`view`. For a hard restriction,
  configure [permission rules](https://code.claude.com/docs/en/permissions) in your
  project.
- The agent does not call skills or other agents.
- It invents nothing: a claim without evidence goes into "Not found / open".
- The contents of files and web pages are treated as data, not instructions. This
  guards against prompt injection.
- Model: `sonnet`.

## Evals

`evals/` holds two cases for `claude plugin eval`:

- `repo-question-cites-evidence`: the agent answers a question about the fixture code with
  `file:line` and edits nothing;
- `vague-question-asks-first`: given a vague question, the agent clarifies first instead of guessing.

```bash
cd plugins/research-tools
claude plugin eval . --scaffold
```

The `--scaffold` flag is needed because `fixture.sh` creates the fixture.

## Based on

- Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system):
  a researcher in a clean context returns only a concise conclusion with cited sources.
- Claude Code, [Create custom subagents](https://code.claude.com/docs/en/sub-agents):
  a read-only tool set via `tools` and `disallowedTools`.

The change history is in [CHANGELOG.md](CHANGELOG.md).
