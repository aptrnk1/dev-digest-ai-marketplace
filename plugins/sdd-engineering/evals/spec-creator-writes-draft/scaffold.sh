#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/api specs
printf '# Orders service\n\nModules: `src/api` (HTTP routes), `src/db` (storage).\n' > README.md
printf 'export function listOrders(from, to) { return []; }\n' > src/api/orders.js
git init -q && git add -A && git -c user.email=e@x -c user.name=eval commit -qm init
