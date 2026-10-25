---
name: onion-architecture
description: "Onion / Clean (ports & adapters) architecture for a TypeScript/Node backend (e.g. Fastify + an ORM such as Drizzle or Prisma + zod): which layer owns a piece of code (domain, application service, ports, inbound/outbound adapters, composition root), which direction imports may point, where framework / ORM / validation / SDK imports are allowed, repositories + mappers, Unit of Work for transactions, domain errors vs HTTP errors, constructor injection from a composition root, and an optional mechanical gate (dependency-cruiser or similar). Use this skill whenever you add or change a backend module, route, service, repository, adapter, job handler or port, decide 'where should this go?', wire a dependency, review a backend change for structure, or refactor a backend — even if the user only says 'add an endpoint', 'extract this', 'add a table and expose it' or 'is this in the right place?'. Not for framework API details or schema design (see engineering-paved-path:fastify-best-practices)."
metadata:
  version: "1.0.0"
  updated: "2026-10-25"
---

# Onion Architecture — backend

Keep business rules in the middle, frameworks at the edge, and make every
import point **inward**. Then a use case can be read, tested and changed
without the HTTP framework, the database or an external API key, and an
adapter can be swapped without touching a rule. Sources and rationale:
[SOURCES.md](SOURCES.md).

## Scope — what this skill is and isn't

| Question | Skill |
|----------|-------|
| *Which layer* owns code, *where* the file lives, *which way* it may import, *how* deps are wired | **this skill** |
| Fastify API mechanics (hooks, plugins, schemas, serialization) | `engineering-paved-path:fastify-best-practices` |
| ORM query / relation / migration syntax, table design | the ORM's own docs |
| Security of inputs, auth, secrets | `engineering-paved-path:security` |

On a *placement/dependency* question this skill wins; on a *how-to-write-it*
question the sibling wins. The project's own rules (`CLAUDE.md`, an
architecture doc, lint config) win over both.

## Before you start

1. Read the project's `CLAUDE.md` / architecture docs for the backend package,
   if they exist, and any lessons-learned file it points to.
2. Open 2–3 sibling modules and match their naming and file roles.
3. If the repo has an architecture check command (for example
   `depcruise src --config .dependency-cruiser.cjs`), run it before and after
   your change. Its output is ground truth for import direction.

## Adoption policy (recommended)

- **New code is strict**: every rule below applies to new modules, new files
  and new functions.
- **Legacy is fixed on touch**: when you substantially change a legacy file,
  move the part you touch toward the target shape — don't rewrite modules you
  are not otherwise changing. If the project baselines known violations, never
  re-baseline to hide a new one. Playbook: [references/migration.md](references/migration.md).
- **Domain layer only where it pays**: a `domain.ts` exists only when the
  module has real invariants/state rules. CRUD modules go
  `routes → service → repository` with no empty domain folder.
- **One composition root**: use whatever DI the project already has (a hand-written
  container, Awilix, tsyringe…). Don't introduce a second mechanism.
- **Domain errors without HTTP codes** is a rule for new code; existing HTTP-aware
  errors stay until a module is touched.

## The rings

```
        ┌──────────── composition root: app container, modules/<m>/compose.ts
        │  ┌───────── adapters: routes.ts (in) · repository.ts, adapters/* (out)
        │  │  ┌────── application: service.ts + ports.ts
        │  │  │  ┌─── domain: domain.ts (optional)
        │  │  │  │
  imports point → → → inward only
```

| Ring | Contains | Typical files | May import |
|------|----------|---------------|------------|
| **Domain** | Entities/value objects, invariants, state transitions, domain errors (`code`, no HTTP status). Pure TS. | `modules/<m>/domain.ts` or `domain/` | own `constants.ts`/`types.ts`; `import type` from shared contracts |
| **Application** | Use cases (one public method per user intent), orchestration, transactions via a port, **ports** = interfaces it needs | `service.ts`, `ports.ts`, `helpers.ts` (pure) | domain, own ports, shared contract types |
| **Inbound adapters** | HTTP routes, job handlers, SSE/WebSocket: parse → call use case → map result/HTTP | `routes.ts`, `jobs.ts` | application, request-context helpers, validation schemas |
| **Outbound adapters** | ORM repositories + mappers; LLM / VCS / payment / email clients | `repository.ts`, `repository/*.repo.ts`, `mappers.ts`, `adapters/**` | ports they implement, ORM, DB schema, SDKs |
| **Composition root** | Construct concrete objects and inject them | app container, `modules/<m>/compose.ts` | everything |

Ports used by **several packages or modules** (LLM, Git, payments, secrets…) live
in one shared place (e.g. `src/shared/ports/`). Ports used by one module live
in that module's `ports.ts` — the consumer owns the abstraction.

## The rules (each one is checked or reviewable)

1. **Dependencies point inward.** Domain imports nothing outer; services never
   import routes, repositories, the DB client, the ORM, the HTTP framework or SDKs.
   *Why:* the core then compiles and tests without infrastructure — the defining
   property of onion (Palermo, tenet 4).
2. **Services receive narrow deps through the constructor.** No container
   parameter (service locator), no `new XRepository(db)` inside a service.
   *Why:* explicit deps document the use case and make fakes trivial.
3. **Only composition code touches the container**: `modules/<m>/compose.ts`
   builds the service from the container; `routes.ts` calls the factory.
   Shared repositories/facades are exposed as container getters.
4. **The ORM stays in repositories.** ORM imports, DB schema and inferred row
   types appear only in repository/mapper files. A repository returns a domain
   object or a read model declared in `ports.ts`/`domain.ts` — not a row type.
   Details: [references/persistence.md](references/persistence.md).
5. **The HTTP framework stays in `routes.ts`** (+ request-context helpers). No
   request/reply objects below the route. Details:
   [references/fastify.md](references/fastify.md).
6. **Parse at the edge, trust inside.** Routes declare request/response schemas;
   services take typed inputs and don't re-validate wire shapes. Domain never
   imports a runtime validation library. Details:
   [references/validation-boundaries.md](references/validation-boundaries.md).
7. **Map at every boundary.** Wire DTO → service input → domain → row and back.
   The `toXDto` mapper (domain/read model → contract) lives in `helpers.ts`;
   row ↔ domain mapping lives next to the repository.
8. **Transactions through a port.** A use case that writes >1 table calls
   `uow.run(async (repos) => …)` on a `UnitOfWork` port; the ORM adapter wraps
   the transaction and hands back tx-bound repositories. Never pass a
   transaction handle into a service.
9. **Domain errors carry a `code`, not a status.** New code throws module
   errors (`class OrderAlreadyShipped extends DomainError`); the route (or a
   module `toHttpError`) maps them to HTTP errors that the global error
   handler renders.
10. **External systems only via ports.** Modules never import concrete
    adapters; they get `PaymentGateway`, `LLMProvider`, … from the
    composition root. Secrets are resolved by adapters or the composition root,
    never by a service. Details:
    [references/external-adapters.md](references/external-adapters.md).
11. **Modules don't reach into each other.** Never import another module's
    repository/service/routes; use its container facade, its `constants.ts` /
    `types.ts`, or move the shared piece to `modules/_shared/`.
12. **Behaviour lives with data.** Put invariant checks and state transitions
    in `domain.ts` functions/classes, not scattered `if`s in services — but
    don't invent a domain model for plain CRUD.

## Where does X go?

| You're adding… | Put it in… |
|----------------|-----------|
| A new HTTP endpoint | `modules/<m>/routes.ts` (+ register the module where the app registers routes) |
| Request/response shape | the project's shared contract/schema location (keep every copy in sync if there are several) |
| A use case | a method on `<M>Service` in `service.ts` (split into `<verb>.service.ts` only when `service.ts` gets unwieldy) |
| An interface the service needs (store, queue, clock, gateway) | `modules/<m>/ports.ts` |
| Business invariant / state transition | `modules/<m>/domain.ts` (create it when the first one appears) |
| Pure transform, DTO mapper, parsing helper | `modules/<m>/helpers.ts` |
| SQL / ORM query | `modules/<m>/repository.ts` (or `repository/<entity>.repo.ts`) |
| Row ↔ domain mapping | inside the repository file or `modules/<m>/mappers.ts` |
| New table | the ORM schema → the project's migration generator (don't hand-edit generated migrations) |
| A client for a new external system | port in `ports.ts` (or the shared ports place); impl in `adapters/<system>/`; wire in the composition root; add a test fake/mock |
| Wiring service + its deps | `modules/<m>/compose.ts` |
| Background job handler | registered from `compose.ts`/`routes.ts`; handler body calls a service method |
| Literals / job kinds | `modules/<m>/constants.ts` |
| Code used by ≥2 modules | `modules/_shared/` (logic) or a container getter (stateful repo/facade) |

Full module template, with code: [references/layers-and-placement.md](references/layers-and-placement.md).

## Module template (new module)

```
src/modules/<m>/
├── routes.ts       # inbound adapter: schemas, request context, call service, status codes
├── compose.ts      # createXService(container) — the only non-route file that sees the container
├── service.ts      # use cases; constructor(deps: XDeps)
├── ports.ts        # XStore, read models, other interfaces the service needs
├── domain.ts       # OPTIONAL — invariants, transitions, domain errors
├── repository.ts   # implements XStore with the ORM; maps rows ↔ read models
├── helpers.ts      # pure functions, toXDto
└── constants.ts
```

Tests: service with in-memory fakes of `ports.ts` (unit), repository against
a real database (integration), route via the framework's in-process request
injection. See [references/testing.md](references/testing.md).

## Enforcement (optional, recommended)

Rules 1, 2, 4, 5, 6 (domain), 10 and 11 can be checked mechanically with
dependency-cruiser (or eslint-plugin-boundaries). When the project has such a
check, it is ground truth: a new violation fails the change. Example rule set,
how to read a failure and when re-baselining is legitimate:
[references/enforcement.md](references/enforcement.md).

## Review checklist

- [ ] The architecture check (if the project has one) is clean; baseline not regenerated to hide a new violation.
- [ ] New service takes explicit deps in its constructor; no container, no `new …Repository`.
- [ ] No ORM / DB client / row types outside repository & mapper files.
- [ ] No HTTP framework types below `routes.ts`; handlers stay thin (parse → call → map).
- [ ] Repositories return read models/domain objects; DTO mapping in `helpers.ts`.
- [ ] Multi-table writes go through a `UnitOfWork` port.
- [ ] New errors carry a `code`; HTTP status assigned at the edge.
- [ ] External calls go through a port; a fake/mock exists for tests.
- [ ] No import into another module's internals.
- [ ] `domain.ts` only where invariants exist; no empty scaffolding.
- [ ] Contract change applied everywhere the contract is defined.
- [ ] Use case has a unit test with fakes; DB code has an integration test.
