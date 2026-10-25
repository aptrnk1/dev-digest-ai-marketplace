# Validation at the boundaries

"Parse, don't validate" (Alexis King): turn untrusted input into a precise type
**once, at the edge**; everything inside trusts the type and never re-checks.
The examples use zod; the same applies to Valibot, TypeBox or JSON Schema.

## Three kinds of shapes — keep them apart

| Shape | Lives in | Owned by | Runtime schema? |
|-------|----------|----------|-----------------|
| **Wire contract** (request/response DTO) | the project's shared contracts location — if it is duplicated (server + client), change every copy | API ↔ client agreement | yes — schemas + inferred types |
| **Read model / domain type** (camelCase, `Date`, unions) | `ports.ts` / `domain.ts` | the module | no — plain TS types |
| **Row** (ORM row type) | private to the repository | the ORM | n/a |

Mapping: contract → service input (route) · read model ↔ row (repository) ·
read model → contract (`toXDto` in `helpers.ts`).

## Rules

1. **Routes declare schemas**; the framework parses before the handler runs.
   No `parse` inside handlers.
2. **Services accept typed arguments**, not `unknown`. They don't call
   `Contract.parse` on data a route already parsed.
3. **Domain never imports a runtime validation library or runtime contracts**
   (`domain-is-pure` / `domain-contracts-type-only`). `import type { Status } from '@app/contracts'`
   is fine for shared enums/unions.
4. **Parse every other untrusted edge too**, in the adapter that receives it:
   LLM structured output, third-party webhook/SDK payloads you depend on, job
   payloads read back from the DB, JSON columns (default missing fields on
   read).
5. **Don't make the contract your domain model.** When the wire shape and the
   business shape diverge (naming, optionality, `string` dates vs `Date`), map;
   don't bend the domain to the wire format.
6. **Value objects** that need validation (e.g. a repository URL, an email)
   get a factory in `domain.ts`/`helpers.ts` (`parseRepoUrl` → typed result or
   domain error) — plain TS, optionally a branded type. The schema library
   stays at the edge.
