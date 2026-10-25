import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const fixtureIndex = () => JSON.parse(readFileSync(path.join(SITE, 'dist-fixtures', 'index.json'), 'utf8'));

/** Serves a modified index.json for the page. */
export async function mockIndex(page, mutate) {
  const index = mutate(fixtureIndex());
  await page.route('**/index.json', (route) => route.fulfill({ json: index }));
}

/** Index with `n` extra skills, all matching "bulk". */
export function bulkIndex(n) {
  return (index) => {
    for (let i = 0; i < n; i++) {
      index.artifacts.push({
        id: `skill:hello/bulk-${i}`, type: 'skill', name: `bulk-${String(i).padStart(3, '0')}`, displayName: `bulk-${String(i).padStart(3, '0')}`,
        plugin: 'hello', description: 'bulk generated skill', body: '', path: null, tags: [], author: null, category: 'examples',
        version: '0.1.0', invocation: `/hello:bulk-${i}`, html: null,
      });
    }
    return index;
  };
}
