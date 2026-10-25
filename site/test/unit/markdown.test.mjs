import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixture } from '../helpers/fixtures.mjs';

const { index, files } = buildFixture();
const readme = files.find((f) => f.out === index.plugins.find((p) => p.name === 'alpha-tools').readme).content;

test('sanitizer drops dangerous elements and attributes (AC14)', () => {
  assert.doesNotMatch(readme, /<script|<iframe|onerror|onclick|style=|javascript:/i);
  assert.match(readme, /<p>styled<\/p>/);
});

test('relative links point at the commit on GitHub, external links get rel (AC15)', () => {
  assert.match(readme, /href="https:\/\/github\.com\/fixture-owner\/fixture-repo\/blob\/0123456789abcdef0123456789abcdef01234567\/plugins\/alpha-tools\/skills\/refactor\/SKILL\.md" rel="noopener noreferrer"/);
  assert.match(readme, /href="https:\/\/example\.com" rel="noopener noreferrer"/);
});

test('relative images inside the plugin are copied and rewritten (AC16)', () => {
  assert.match(readme, /<img src="content\/_assets\/plugins\/alpha-tools\/assets\/logo\.png" alt="Logo"/);
  assert.ok(files.some((f) => f.out === 'content/_assets/plugins/alpha-tools/assets/logo.png' && f.copyFrom));
});

test('external images become links labelled from uk.json (AC17)', () => {
  assert.match(readme, /<a href="https:\/\/example\.com\/shot\.png"[^>]*>зображення: Remote shot<\/a>/);
  assert.match(readme, /<a href="https:\/\/example\.com\/noalt\.png"[^>]*>зображення<\/a>/);
  assert.doesNotMatch(readme, /<img[^>]+https:/);
});

test('malformed %-escapes and non-image files do not break or leak (AC10, AC13)', async () => {
  const { renderMarkdown } = await import('../../scripts/lib/markdown.mjs');
  const { FIXTURE_ROOT: root } = await import('../helpers/fixtures.mjs');
  const pathMod = await import('node:path');
  const pluginRoot = pathMod.join(root, 'plugins/gamma-mcp');
  const copied = [];
  const html = renderMarkdown('[x](%E0%A4%A) ![cfg](.mcp.json) ![svg](icon.svg)', {
    file: pathMod.join(pluginRoot, 'README.md'), repoRoot: root, pluginRoot, blobBase: 'https://github.com/o/r/blob/s',
    copyImage: (p) => (copied.push(p), 'x'), externalImageLabel: () => 'img',
  });
  assert.match(html, /<a href="https:\/\/github\.com\/o\/r\/blob\/s\/plugins\/gamma-mcp\/%E0%A4%A"/);
  assert.deepEqual(copied, []);
  assert.doesNotMatch(html, /<img/);
});
