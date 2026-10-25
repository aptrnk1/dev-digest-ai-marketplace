#!/usr/bin/env node
// Serves an already-built directory (default dist/) without rebuilding — used by e2e tests.
import path from 'node:path';
import { createStaticServer } from './lib/static-server.mjs';

const dir = path.resolve(process.argv[2] ?? 'dist');
const port = Number(process.env.PORT ?? process.argv[3] ?? 4322);
createStaticServer({ root: dir }).listen(port, '127.0.0.1', () => console.log(`Serving ${dir} on http://localhost:${port}`));
