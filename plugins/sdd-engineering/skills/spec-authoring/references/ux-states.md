# UX states review

A mockup usually shows one state of one screen with ideal data. The spec has to
cover the rest. Work screen by screen; every gap becomes a question, a proposal
or an AC.

## 1. Screens × states matrix

For every screen / panel / modal in the feature, fill:

| Screen | ideal | empty | loading | partial | error | AC |
|---|---|---|---|---|---|---|

- **ideal** — what the design shows; where every value comes from (endpoint/contract).
- **empty** — first run, nothing found, a filter returned nothing; there is a
  CTA for what to do next.
- **loading** — first load (skeleton) vs background refresh (data stays
  visible); long operations show progress and let the user leave the page.
- **partial** — some data is there (the LLM returned part, one of the requests failed,
  pagination, truncated content).
- **error** — API unavailable, 4xx with a code (`409 …`), 5xx, timeout or an
  external service refusing, rate limit, no key / access, unfinished
  setup.

A cell without an answer → an Open question or an interview question.

## 2. Edge data

- very long names / paths / texts (truncation + tooltip/full view);
- 0, 1, many (> 100) items; pagination or virtualisation;
- special characters, emoji, RTL, markdown/HTML in data (escaping!);
- stale data (another tab changed it), a deleted object that is still referenced;
- different accounts / workspaces / projects; switching context on the page.

## 3. Interaction gaps

- cancelling a long operation; what happens when the user leaves mid-way;
- confirmation of destructive actions or Undo (look at what the product
  already does and stick to it);
- double click / repeated submit (disabled button, idempotency);
- a disabled state always comes with a reason (tooltip);
- success: what changes on screen, toast, where focus goes;
- deep link: does state (filter, tab, selected item) live in the URL;
- keyboard: shortcuts, Esc closes a modal, Enter submits.

## 4. Nielsen's 10 heuristics (short)

1. Visibility of system status. 2. Match with the real world (the user's terms).
3. User control and freedom (Undo, Cancel). 4. Consistency and standards (like
other pages of the product). 5. Error prevention. 6. Recognition rather than
recall. 7. Flexibility (shortcuts, bulk actions). 8. Minimalism.
9. Clear error messages (what happened + what to do). 10. Help
in context.

Use them as a lens for UX proposals (REC), not as a checklist in the spec.

## 5. Accessibility — WCAG 2.2 AA essentials

- every interactive element is reachable by keyboard, with visible focus;
- modal: focus trap, focus return, Esc;
- text contrast ≥ 4.5:1 (large ≥ 3:1); state is not conveyed by colour alone
  (severity/status badges have text);
- fields have labels; validation errors are tied to the field;
- dynamic updates (progress, toast) use `aria-live`;
- target size ≥ 24×24 px.

These go into the spec as NFRs (a11y), and special cases as ACs.

## 6. Project conventions (check before proposing new UI)

Before proposing new UI, find in the repo:

- **the component library / design system** (a shared UI kit folder, a design
  system package) — reuse first, build new second;
- **navigation** (sidebar, routes, shortcuts) — where the new page fits;
- **the string catalog / i18n** — no hardcoding; new text in the spec = a new
  key in the catalog;
- **the data pattern** — how other pages fetch data (query library,
  status polling for background jobs: 202 → poll → done/failed);
- **the closest similar page** — name it in the spec as the consistency reference.

## 7. Output

- The §1 matrix → the spec's "Screens and states" section.
- Every filled non-ideal cell → an AC (`state` for loading, `unwanted` for
  error, `event` for interactions).
- Every flaw/improvement found → a question or a REC with a one-line "why".
