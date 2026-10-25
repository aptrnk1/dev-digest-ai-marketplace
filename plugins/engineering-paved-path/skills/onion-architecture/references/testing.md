# Testing by ring

Onion makes each ring testable with the cheapest tool that can break it. The
project's testing doc (if any) is the source of truth for suites, naming and
CI; this file only says which ring gets which test.

| Ring | Test type | Tools | Example file |
|------|-----------|-------|--------------|
| Domain | unit, pure | vitest/jest, no setup | `test/<m>-domain.test.ts` |
| Application (service) | unit with **fakes of ports** | hand-written in-memory fakes | `test/<m>-service.test.ts` |
| Outbound adapter (repository) | integration, real database | Testcontainers or a disposable DB | a separate integration suite (e.g. `*.it.test.ts`) |
| Inbound adapter (routes) | HTTP-level | `app.inject` + container overrides | unit lane for smoke; integration lane when DB-backed |
| Whole flow | e2e | Playwright or the project's e2e runner | — |

## Fakes over mocks for ports

A fake is a tiny working implementation (Fowler, *Mocks Aren't Stubs*):

```ts
class InMemoryNoteStore implements NoteStore {
  private notes = new Map<string, NoteRecord>();
  async get(ws: string, id: string) {
    const n = this.notes.get(id);
    return n?.workspaceId === ws ? n : undefined;
  }
  async insert(n: Omit<NoteRecord, 'id' | 'createdAt'>) {
    const rec = { ...n, id: crypto.randomUUID(), createdAt: new Date() };
    this.notes.set(rec.id, rec);
    return rec;
  }
  // …
}

const jobs = { enqueue: vi.fn(async () => ({})) };
const service = new NotesService({ store: new InMemoryNoteStore(), jobs });
```

Assert on **outcomes** (returned DTO, store state, enqueued job), not on call
order. Because `implements NoteStore` is type-checked, a fake can't silently
drift from the port.

## Rules

- A service test must not need Docker, network or keys. If it does, a port is
  missing.
- Repository tests prove the SQL, mapping and tenant scoping against a real
  DB — don't fake the ORM.
- Don't re-test business branches through HTTP; route tests cover status
  codes, validation, serialization and error mapping.
- The fake UoW runs `work(fakeRepos)` directly; rollback is covered by one
  integration test against the real database.
