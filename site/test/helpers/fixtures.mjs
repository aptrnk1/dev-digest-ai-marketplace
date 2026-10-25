import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../../scripts/lib/index-builder.mjs';
import { createT, loadDictionary } from '../../scripts/lib/i18n.mjs';

export const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FIXTURE_ROOT = path.join(SITE_DIR, 'test', 'fixtures', 'marketplace');
export const FIXTURE_SYNONYMS = path.join(SITE_DIR, 'test', 'fixtures', 'synonyms.json');
export const SHA = '0123456789abcdef0123456789abcdef01234567';
export const t = createT(loadDictionary(path.join(SITE_DIR, 'src', 'i18n', 'uk.json')));
export const searchConfig = JSON.parse(readFileSync(path.join(SITE_DIR, 'data', 'search.json'), 'utf8'));

export function buildFixture(overrides = {}) {
  return buildIndex({
    repoRoot: FIXTURE_ROOT,
    marketplaceFile: path.join(FIXTURE_ROOT, '.claude-plugin', 'marketplace.json'),
    searchConfig,
    synonymsFile: FIXTURE_SYNONYMS,
    repo: 'fixture-owner/fixture-repo',
    sha: SHA,
    buildTime: '2026-10-25T12:34:00Z',
    t,
    ...overrides,
  });
}
