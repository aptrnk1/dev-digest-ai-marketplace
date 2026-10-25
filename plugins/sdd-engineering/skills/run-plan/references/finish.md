# Phase 7 — finish

1. **Final verify.** Run every command in the plan's `## Commands` section
   for each touched module (skip a module the feature did not touch). A
   self-skipped suite (e.g. integration tests without a database) is not a
   pass — list it as env. Run e2e only if flows changed and the plan or the
   repo docs say this host can run it. Append the results to
   `<reports_dir>/<feature>/verify-<sha>.md`.
2. **Lessons.** Collect the "Insight candidates" from
   `<reports_dir>/<feature>/T*.md` and the reviewers' reports. Show the
   non-duplicate ones to the user and ask where to record them (the repo's
   own docs, `CLAUDE.md`, an insights file if it keeps one) — never write
   them into project instructions without the user's answer.
3. **Docs.** If the plan's tasks did not already update the docs a reader
   needs (module README, API reference), list the gaps in the summary as a
   follow-up; do not write documentation the plan did not ask for.
4. **Commit** `<feature>: final verify` (verify file, flow.md); set
   `Phase: done` in flow.md.
5. **Summary to the user** (≤20 lines): branch + commits, tasks done,
   review rounds and what was fixed, rows `deferred` / `accepted-by-user`,
   env-only items (missing services, manual checks from the plan's Risks
   with who/how), spec updates the planner flagged, lesson candidates.
6. **Next steps — ask, do not do:**
   - suggest a final self-review of the diff before opening a PR (for
     example `/code-review` on the branch);
   - then offer to push the branch and open the PR (`gh pr create`), and to
     set the spec's `Status: implemented` after merge;
   - suggest `/sdd-engineering:workflow-retro` to review how the run went.
