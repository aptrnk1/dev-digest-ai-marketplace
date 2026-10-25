# LLM trust boundaries

Web-level OWASP (auth, SQL injection, uploads) is in
`engineering-paved-path:security`. This reference is about data that crosses
into or out of an LLM, and about user / repository / third-party content
treated as data.

## 1. Classify every input

| Class | Examples | Trust |
|---|---|---|
| trusted | system prompts, the product's own code, config | trusted |
| user | form fields, names, texts, settings | validated by schema, escaped in the UI |
| external content | documents, repository files, PRs/issues, web pages, emails, third-party API content | **untrusted** |
| LLM output | generated text, classifications, extracted data, tool calls | **untrusted** until checked |
| community | plugins, templates, prompts from the community | **untrusted**, sanitised upstream |
| secrets | provider API keys, tokens | only through the product's secrets mechanism, never DB/git/UI/log/prompt |

## 2. Mechanisms to look for — reuse, never weaken

Before describing isolation, find what already exists in the code and refer to
it in the spec as behaviour, not as a file:

- **wrapping untrusted data** in the prompt (explicit delimiters such as
  `<untrusted>…</untrusted>`, with the closing tag neutralised inside);
- **a guard instruction** in the system prompt saying data is not instructions;
- **grounding / evidence checks**: a model's reference to a file, line,
  document or quote is checked for existence before saving;
- **safe paths**: a path received from the model or the user cannot leave the
  allowed root;
- **limits**: truncating long inputs, item counts, tokens;
- **strict schemas** on API input and on model output (structured output).

No spec requirement may weaken an existing mechanism or replace it with
keyword filtering.

## 3. OWASP Top 10 for LLM Applications (2025) → spec questions

| Risk | Question for the spec |
|---|---|
| LLM01 Prompt injection | Which untrusted data goes into the prompt? Is all of it isolated? Can the content change *what* the model does (lower a score, skip an item, call a tool)? |
| LLM05 Improper output handling | Where does model output go: UI (markdown/HTML escaping), file system (safe path), DB, an external service (visible to others)? What is checked before saving? |
| LLM06 Excessive agency | Can model output *trigger an action* (write, publish, change settings, pay) without user confirmation? By default — no: the model proposes, the user accepts. |
| LLM02 Sensitive information disclosure | Do secrets, `.env`, tokens or personal data reach the prompt, UI or log? |
| LLM07 System prompt leakage | Can output show the user the system prompt or internal instructions that should not be disclosed? |
| LLM10 Unbounded consumption | Limits on input size (files, lines, tokens), number of calls, timeout, reruns; what does the user see when a limit is exceeded? |
| LLM09 Misinformation (hallucinations) | Is every model reference to a source (file, line, document) checked for existence? |

## 4. Output for a spec

**Inputs and provenance** — a table: input · source (class from §1) · where it is
validated (schema / grounding / evidence check / safe path).

**Untrusted inputs** — one line per untrusted input:
`<input> → <where it goes: prompt | UI | FS | DB | external service> → <isolation>`.
Every such line that introduces new behaviour has a matching AC (`unwanted`
or `ubiquitous`), e.g.:

- **AC** (ubiquitous, system) The system shall pass the content of
  uploaded documents into the prompt only inside untrusted-data delimiters. `[unit]`
- **AC** (unwanted, system) IF the model returns a path outside the allowed
  root, THEN the system shall discard the result. `[unit]`

If the feature has no untrusted inputs, say explicitly why (do not leave it empty).
