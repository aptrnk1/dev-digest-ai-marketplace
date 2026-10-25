import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../../scripts/lib/static-server.mjs';

test('static server refuses paths outside its root, including sibling prefixes', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'catalog-srv-'));
  mkdirSync(path.join(base, 'dist'));
  mkdirSync(path.join(base, 'dist-secret'));
  writeFileSync(path.join(base, 'dist', 'index.html'), 'ok');
  writeFileSync(path.join(base, 'dist-secret', 's.txt'), 'SECRET');
  const server = createStaticServer({ root: path.join(base, 'dist') });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = (p) => `http://127.0.0.1:${server.address().port}${p}`;
  try {
    assert.equal((await fetch(url('/'))).status, 200);
    for (const p of ['/..%2fdist-secret/s.txt', '/..%2f..%2fetc/hosts', '/%2e%2e/dist-secret/s.txt']) {
      const res = await fetch(url(p));
      assert.notEqual(res.status, 200, p);
      assert.ok(!(await res.text()).includes('SECRET'), p);
    }
  } finally {
    server.close();
    rmSync(base, { recursive: true, force: true });
  }
});
