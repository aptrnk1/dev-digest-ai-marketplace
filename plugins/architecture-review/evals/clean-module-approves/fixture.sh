#!/usr/bin/env bash
set -euo pipefail
mkdir -p docs src/modules/orders src/db
cat > docs/architecture.md <<'MD'
# Architecture

Layers inside `src/modules/<module>/` point inward only: `domain.ts` ← `ports.ts`
← `service.ts`; `repository.ts` implements a port with the database client;
`compose.ts` is the only file that wires concrete classes.
MD
cat > src/db/client.ts <<'TS'
export const db = { query: async (_sql: string, _args: unknown[]) => [] as unknown[] };
TS
cat > src/modules/orders/domain.ts <<'TS'
export interface Order { id: string; status: "open" | "paid" }
export function markPaid(o: Order): Order {
  if (o.status === "paid") throw new Error("already paid");
  return { ...o, status: "paid" };
}
TS
cat > src/modules/orders/ports.ts <<'TS'
import type { Order } from "./domain";
export interface OrderRepository { find(id: string): Promise<Order | null>; save(o: Order): Promise<void> }
TS
cat > src/modules/orders/repository.ts <<'TS'
import { db } from "../../db/client";
import type { Order } from "./domain";
import type { OrderRepository } from "./ports";
export class SqlOrderRepository implements OrderRepository {
  async find(id: string) { const rows = await db.query("select * from orders where id = $1", [id]); return (rows[0] as Order) ?? null; }
  async save(o: Order) { await db.query("update orders set status = $1 where id = $2", [o.status, o.id]); }
}
TS
cat > src/modules/orders/service.ts <<'TS'
import { markPaid } from "./domain";
import type { OrderRepository } from "./ports";

export function makePayOrder(repo: OrderRepository) {
  return async (id: string): Promise<void> => {
    const order = await repo.find(id);
    if (!order) throw new Error("not found");
    await repo.save(markPaid(order));
  };
}
TS
cat > src/modules/orders/compose.ts <<'TS'
import { SqlOrderRepository } from "./repository";
import { makePayOrder } from "./service";
export const payOrder = makePayOrder(new SqlOrderRepository());
TS
