#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/orders src/tax
cat > src/orders/total.ts <<'TS'
import type { OrderLine } from "./types";

export function orderSubtotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function orderTotal(lines: OrderLine[], shipping: number): number {
  // Tax is added later, at invoice time (see src/tax/invoice.ts).
  return orderSubtotal(lines) + shipping;
}
TS
cat > src/orders/types.ts <<'TS'
export interface OrderLine { sku: string; unitPrice: number; quantity: number }
TS
cat > src/tax/invoice.ts <<'TS'
import { orderTotal } from "../orders/total";
import type { OrderLine } from "../orders/types";

export const VAT_RATE = 0.2;

export function invoiceAmount(lines: OrderLine[], shipping: number): number {
  return orderTotal(lines, shipping) * (1 + VAT_RATE);
}
TS
