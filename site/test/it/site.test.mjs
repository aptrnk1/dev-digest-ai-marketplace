import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { buildSite } from '../../scripts/lib/site-builder.mjs';
import { collectKeys, loadDictionary } from '../../scripts/lib/i18n.mjs';
import { listFiles } from '../../scripts/lib/fs-utils.mjs';
import { createSearch } from '../../src/js/lib/search.js';
import { FIXTURE_ROOT, FIXTURE_SYNONYMS, SHA, SITE_DIR } from '../helpers/fixtures.mjs';

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://img.shields.io; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

const tmp = mkdtempSync(path.join(tmpdir(), 'catalog-it-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

const fixtureOut = path.join(tmp, 'fixtures');
buildSite({ repoRoot: FIXTURE_ROOT, outDir: fixtureOut, repo: 'fixture-owner/fixture-repo', sha: SHA, synonymsFile: FIXTURE_SYNONYMS });
const allFiles = listFiles(fixtureOut, { recursive: true });
const pages = allFiles.filter((f) => f.endsWith('.html') && !f.includes(`${path.sep}content${path.sep}`));

test('every page carries the CSP meta tag (AC53)', () => {
  assert.deepEqual(pages.map((p) => path.basename(p)).sort(), ['artifact.html', 'getting-started.html', 'index.html', 'plugin.html']);
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`), path.basename(page));
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, 'no inline scripts');
    assert.doesNotMatch(html, /\sstyle="/, 'no inline style attributes');
    assert.doesNotMatch(html, /__dev\/reload/, 'no live reload in production');
    assert.doesNotMatch(html, /\{\{/, 'all template tags resolved');
  }
});

test('no env/header value reaches any published file (AC13)', () => {
  for (const file of allFiles) {
    if (/\.(woff2|png)$/.test(file)) continue;
    assert.ok(!readFileSync(file, 'utf8').includes('SECRET-MARKER-123'), path.relative(fixtureOut, file));
  }
});

test('getting-started has repo and marketplace baked in (AC83)', () => {
  const html = readFileSync(path.join(fixtureOut, 'getting-started.html'), 'utf8');
  assert.match(html, />\/plugin marketplace add fixture-owner\/fixture-repo</);
  assert.match(html, />\/plugin install alpha-tools@fixture-market</);
  assert.match(html, />\/plugin marketplace update fixture-market</);
});

test('the production index contains only plugins of the root marketplace (AC9)', () => {
  const out = path.join(tmp, 'prod');
  const { index } = buildSite({ repoRoot: path.resolve(SITE_DIR, '..'), outDir: out, repo: 'aptrnk1/dev-digest-ai-marketplace', sha: SHA });
  const root = JSON.parse(readFileSync(path.resolve(SITE_DIR, '..', '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.deepEqual(index.plugins.map((p) => p.name).sort(), root.plugins.map((p) => p.name).sort());
  for (const fixturePlugin of ['alpha-tools', 'beta-review', 'gamma-mcp']) {
    assert.ok(!readFileSync(path.join(out, 'index.json'), 'utf8').includes(fixturePlugin));
  }
});

test('UI strings live only in uk.json (AC90)', () => {
  const src = path.join(SITE_DIR, 'src');
  for (const file of listFiles(src, { recursive: true })) {
    if (!/\.(html|js|css)$/.test(file)) continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      assert.doesNotMatch(line, /[Ѐ-ӿ]/, `${path.relative(SITE_DIR, file)}:${i + 1} has Cyrillic text`);
    });
  }
  const dict = loadDictionary(path.join(src, 'i18n', 'uk.json'));
  const used = new Set(collectKeys(src).used.keys());
  const prefixes = [...collectKeys(src).prefixes.keys()];
  const scriptsText = listFiles(path.join(SITE_DIR, 'scripts'), { recursive: true }).map((f) => readFileSync(f, 'utf8')).join('\n');
  const unused = Object.keys(dict).filter(
    (k) => !used.has(k) && !prefixes.some((p) => k.startsWith(p)) && !scriptsText.includes(`'${k}'`),
  );
  assert.deepEqual(unused, [], 'every key in uk.json is used');
});

test('JS ≤ 100 KB gzip (NFR3) and fonts ≤ 400 KB (NFR12)', () => {
  const js = allFiles.filter((f) => f.endsWith('.js'));
  const jsGz = js.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0);
  assert.ok(jsGz <= 100 * 1024, `JS gzip ${jsGz} B`);
  const fonts = allFiles.filter((f) => f.endsWith('.woff2'));
  const fontBytes = fonts.reduce((sum, f) => sum + statSync(f).size, 0);
  assert.ok(fonts.length === 14 && fontBytes <= 400 * 1024, `fonts ${fontBytes} B`);
});

// --- Synthetic marketplace: 200 plugins / 2 000 artifacts (NFR1, NFR2, NFR8) ------------
const WORDS = 'react next fastify testing security review refactor architecture database cache queue deploy docs lint format migrate audit spec plan agent hook schema api auth token parser render state router'.split(' ');
const words = (seed, n) => Array.from({ length: n }, (_, i) => WORDS[(seed * 7 + i * 13) % WORDS.length]).join(' ');

function syntheticRepo() {
  const root = path.join(tmp, 'synthetic');
  const plugins = [];
  for (let p = 0; p < 200; p++) {
    const name = `plugin-${p}`;
    const dir = path.join(root, 'plugins', name);
    mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name, version: '1.0.0', description: words(p, 12), keywords: [WORDS[p % WORDS.length]] }));
    writeFileSync(path.join(dir, 'README.md'), `# ${name}\n\n${words(p, 300)}\n`);
    for (let s = 0; s < 9; s++) {
      const skill = path.join(dir, 'skills', `skill-${s}`);
      mkdirSync(skill, { recursive: true });
      writeFileSync(path.join(skill, 'SKILL.md'), `---\nname: skill-${s}\ndescription: ${words(p + s, 20)}\n---\n\n${words(p * s + 3, 600)}\n`);
    }
    plugins.push({ name, source: `./plugins/${name}` });
  }
  mkdirSync(path.join(root, '.claude-plugin'), { recursive: true });
  writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ name: 'synthetic', owner: { name: 'x' }, plugins }));
  return root;
}

test('synthetic 2 000-artifact build: ≤ 60 s (NFR8), index ≤ 1 MB gzip (NFR2), search p95 ≤ 50 ms (NFR1)', { timeout: 120_000 }, () => {
  const root = syntheticRepo();
  const started = Date.now();
  const { index } = buildSite({ repoRoot: root, outDir: path.join(tmp, 'synthetic-out'), repo: 'o/r', sha: SHA });
  const buildMs = Date.now() - started;
  assert.equal(index.artifacts.length, 2000);
  assert.ok(buildMs <= 60_000, `build ${buildMs} ms`);

  const gz = gzipSync(readFileSync(path.join(tmp, 'synthetic-out', 'index.json'))).length;
  assert.ok(gz <= 1024 * 1024, `index gzip ${gz} B`);

  const engine = createSearch(index);
  const queries = Array.from({ length: 200 }, (_, i) => `${WORDS[i % WORDS.length]} ${WORDS[(i * 5) % WORDS.length].slice(0, 4)}`);
  engine.search('warm up');
  const times = queries.map((q) => {
    const t0 = performance.now();
    engine.search(q, {}, 'relevance');
    return performance.now() - t0;
  });
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)];
  assert.ok(p95 <= 50, `search p95 ${p95.toFixed(1)} ms`);
});
