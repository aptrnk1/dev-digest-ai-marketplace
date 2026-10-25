# The ORM as an outbound adapter

The ORM is infrastructure. The schema, the query builder, inferred row types
and transactions belong to the outer ring. The application sees **ports**
(`NoteStore`, `UnitOfWork`, `SimilaritySearch`) and **read models**. The
snippets use Drizzle; the same shape works with Prisma, Kysely, TypeORM or
raw SQL.

## Rules

1. The ORM package, the DB schema, row types and the DB client may be imported
   only by repository files (`repository.ts`, `repository/*.repo.ts`,
   `mappers.ts`) and by infrastructure folders (`db/`, `adapters/`, the
   composition root). A dependency-cruiser rule such as
   `drizzle-only-in-repositories` can enforce it.
2. **One repository per aggregate/table cluster**, owned by one module. Other
   modules reach it through a container getter, never by import
   (`no-cross-module-internals`).
3. **Return read models, not rows.** Define the shape in `ports.ts`; map with
   a `toRecord(row)` function in the repository. Row types (`$inferSelect`,
   Prisma model types) are private to the adapter.
   - Legacy repositories that return row types: when you touch such a method,
     return a read model for *new* methods; convert an existing method only if
     you are changing its callers anyway.
4. **Tenant scoping lives in the repository** (if the app is multi-tenant) —
   the service passes the tenant id, the repository enforces it.
5. **No business decisions in SQL-building code** beyond filtering/sorting the
   use case asked for. "Can this transition happen?" is a domain question.
6. **Schema changes** go through the project's migration tool (generate from
   the schema; don't hand-edit generated migrations unless the project says so).
7. **Read-side shortcuts are allowed in the adapter**: a repository method may
   join several tables and return a purpose-built view model (CQRS-lite) — it
   is still behind a port, and the service still doesn't see the ORM.

## Unit of Work (transactions)

When a use case must write several tables atomically, introduce a port — don't
pass `db`/`tx` into the service.

```ts
// modules/<m>/ports.ts
export interface NoteTxRepos {
  notes: NoteStore;
  audit: AuditStore;
}
export interface UnitOfWork {
  run<T>(work: (repos: NoteTxRepos) => Promise<T>): Promise<T>;
}
```

```ts
// modules/<m>/repository.ts (adapter side)
import type { Db } from '../../db/client.js';

/** Db or a transaction handle — repositories accept either. */
type DbOrTx = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export class NoteRepository implements NoteStore {
  constructor(private readonly db: DbOrTx) {}
  // …
}

export class DrizzleNotesUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Db) {}
  run<T>(work: (repos: NoteTxRepos) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) =>
      work({ notes: new NoteRepository(tx), audit: new AuditRepository(tx) }),
    );
  }
}
```

```ts
// service.ts
await this.deps.uow.run(async ({ notes, audit }) => {
  const n = await notes.insert({ … });
  await audit.record({ noteId: n.id, action: 'created' });
});
```

- Throwing inside `work` rolls back (the ORM rejects the transaction promise).
- Keep external calls (LLM, payment, VCS) **outside** the transaction — never
  hold a DB transaction open across a network call.
- If the `DbOrTx` alias is needed by a second module, move it next to the DB
  client (it's infrastructure, not a module type).
- Pattern source: Sentry, *Atomic Repositories in Clean Architecture and
  TypeScript*; Fowler, *Unit of Work*.

In unit tests the fake UoW just calls `work(fakeRepos)`.

## Vector / full-text / similarity search

Search is a capability, not a table detail. Put it behind a port:

```ts
export interface SimilaritySearch {
  nearest(tenantId: string, embedding: number[], k: number): Promise<{ id: string; score: number }[]>;
}
```

The adapter owns the operator (e.g. pgvector `<=>`), index hints and the
column type; the service owns *what* to search for and what to do with hits.
An embedding provider is another port; when it is disabled or unavailable,
callers degrade gracefully.

## Legacy patterns you'll meet (don't copy)

| Pattern | On touch |
|---------|----------|
| ORM queries in route handlers | move the touched query into a repository method + service call |
| DTO mapper takes a row type | introduce a read model; mapper takes it |
| Row types in application code | new methods return read models |
| Service builds its own repository (`new XRepository(container.db)`) | inject via constructor from `compose.ts` |
