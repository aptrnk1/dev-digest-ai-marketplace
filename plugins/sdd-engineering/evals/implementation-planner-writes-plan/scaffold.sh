#!/usr/bin/env bash
set -euo pipefail
mkdir -p specs/plans src/api test
cat > specs/2026-01-01-csv-export.md <<'SPEC'
# Spec: CSV export of orders
Spec ID: SPEC-2026-01-01-csv-export
Status: approved
Modules: api

## Problem and user
A manager wants to export the orders for a period as CSV.

## Acceptance criteria
- **AC1** (event, US1) When the manager requests `GET /orders/export?from=&to=`, the API shall return `text/csv` with one row per order in the period. `[unit]`
- **AC2** (unwanted, US1) If `from` is after `to`, then the API shall return 400 with code `invalid_range`. `[unit]`
- **AC3** (ubiquitous, US1) The CSV shall have the header `id,created_at,total`. `[unit]`

## Open questions
- (none)
SPEC
printf '{"name":"orders","type":"module","scripts":{"test":"node --test"}}
' > package.json
printf 'export function listOrders(from, to) { return []; }
' > src/api/orders.js
git init -q && git add -A && git -c user.email=e@x -c user.name=eval commit -qm init
