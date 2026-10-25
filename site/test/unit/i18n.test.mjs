import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkKeys, createT } from '../../scripts/lib/i18n.mjs';
import { t } from '../helpers/fixtures.mjs';

test('Ukrainian plural forms for the result count (AC29)', () => {
  assert.equal(t('results.count', { count: 1 }), '1 артефакт');
  assert.equal(t('results.count', { count: 2 }), '2 артефакти');
  assert.equal(t('results.count', { count: 5 }), '5 артефактів');
  assert.equal(t('results.count', { count: 21 }), '21 артефакт');
  assert.equal(t('results.count', { count: 11 }), '11 артефактів');
});

test('placeholders are substituted', () => {
  assert.equal(createT({ a: 'Hi {name}' })('a', { name: 'X' }), 'Hi X');
  assert.throws(() => createT({})('missing'), /unknown i18n key "missing"/);
});

test('unknown keys in templates and JS are reported per file (AC91)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'catalog-i18n-'));
  const src = path.join(dir, 'src');
  mkdirSync(path.join(src, 'pages'), { recursive: true });
  mkdirSync(path.join(src, 'js'), { recursive: true });
  writeFileSync(path.join(src, 'pages', 'a.html'), '<h1>{{t:known}}</h1><p>{{t:nope.html}}</p>');
  writeFileSync(path.join(src, 'js', 'b.js'), "t('known'); t('nope.js'); t(`type.${x}`);");
  try {
    const errors = checkKeys(src, { known: 'ok' });
    assert.deepEqual(errors.sort(), [
      'src/js/b.js: unknown i18n key "nope.js"',
      'src/js/b.js: unknown i18n key prefix "type."',
      'src/pages/a.html: unknown i18n key "nope.html"',
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
