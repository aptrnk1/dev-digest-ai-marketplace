# Migrating legacy code — "fix on touch"

Policy: new code strict; legacy moves toward the target **only in code you are
already changing**. No big-bang rewrites, no drive-by refactors. Each step
should keep tests green and, if the project baselines violations, shrink the
baseline a little.

## Common legacy shapes

| Smell | Target |
|-------|--------|
| Service takes the container (service locator) | `constructor(deps: XDeps)` + `compose.ts` |
| Service does `new XRepository(container.db)` | injected `XStore` port |
| ORM queries in routes | repository method + service |
| Row types in application code | read models in `ports.ts` |
| Modules import concrete adapters or pure helpers from `adapters/` | port via the container, or move the pure helper out of `adapters/` |
| Adapters import a module | move constants next to the port |
| HTTP-aware errors thrown from services | domain error with `code`; map at the route |

## Recipes

**Service locator → explicit deps** (smallest useful step)

1. Add `export interface XDeps { … }` listing only what the service actually
   uses (`store`, `jobs`, `vcs`, `secrets`…).
2. Change the constructor to `constructor(private deps: XDeps)`; replace
   `this.container.jobs` with `this.deps.jobs`, etc.
3. Create `compose.ts` with `createXService(c: Container)`; update `routes.ts`
   (and the container getter, if the service is exposed there).
4. Declare the store interface in `ports.ts`, `implements` it in the repository.
5. Run the architecture check (if any) and the tests; then shrink the baseline
   by the entries you fixed.

**ORM in a route → repository**

1. Move the query verbatim into a repository method (create `repository.ts` if
   the module has none), scoped by tenant if the app is multi-tenant.
2. Add a service method the route calls; the route keeps only parse → call → map.
3. Return a read model; map to DTO in `helpers.ts`.

**Row type leaking → read model**

1. Define `XRecord` in `ports.ts` with the fields the caller uses.
2. Add `toRecord(row)` in the repository; return it from the touched method.
3. Change the DTO mapper to take `XRecord`.

## Don'ts

- Don't convert a module you're not otherwise changing.
- Don't add `domain.ts` to CRUD modules during migration.
- Don't change public HTTP contracts as part of an architectural refactor —
  keep the wire shape identical and prove it with existing route tests.
- Don't regenerate the baseline unless it got **smaller**.
