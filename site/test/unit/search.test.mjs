import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearch, editDistanceAtMostOne, normalize, parseQuery, tokenize } from '../../src/js/lib/search.js';
import { buildFixture, searchConfig } from '../helpers/fixtures.mjs';

const { index } = buildFixture();
const engine = createSearch(index);
const ids = (q, filters, sort) => engine.search(q, filters, sort).results.map((r) => r.artifact.id);

test('normalize unifies case, NFC and apostrophes (AC19, EC22)', () => {
  assert.equal(normalize('Рев’ю'), "рев'ю");
  assert.equal(normalize('РЕВʼЮ'), "рев'ю");
  assert.deepEqual(tokenize("рев'ю, рев’ю і ревʼю"), ["рев'ю", "рев'ю", 'і', "рев'ю"]);
});

test('English and Ukrainian stop-words are removed (AC19)', () => {
  const base = ids('code review');
  assert.ok(base.length > 0);
  assert.deepEqual(ids('I need help with code review'), base);
  assert.deepEqual(ids('Мені треба щось для code review'), base);
});

test('type words act as a type filter in both languages (AC20)', () => {
  const expected = ids('code review', { type: ['skill'] });
  assert.ok(expected.length > 0);
  assert.deepEqual(ids('I need a skill for code review'), expected);
  assert.deepEqual(ids('мені треба скіл для code review'), expected);
  assert.deepEqual(parseQuery('агентів хуки', searchConfig).types, ['agent', 'hook']);
});

test('a query of only a type word lists all artifacts of that type by name (AC21, EC2)', () => {
  const r = engine.search('скіли');
  assert.equal(r.hasTerms, false);
  assert.deepEqual(r.detectedTypes, ['skill']);
  const names = r.results.map((x) => x.artifact.displayName);
  assert.ok(r.results.every((x) => x.artifact.type === 'skill'));
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' })));
});

test('only stop-words means no effective terms and no type (EC1)', () => {
  const r = engine.search('I need a');
  assert.equal(r.hasTerms, false);
  assert.deepEqual(r.detectedTypes, []);
});

test('a name match ranks above a body-only match (AC22)', () => {
  const order = ids('zebra');
  assert.ok(order.indexOf('skill:beta-review/zebra-skill') < order.indexOf('agent:beta-review/striped'));
  assert.ok(order.includes('agent:beta-review/striped'));
});

test('prefix ≥ 2 chars and edit distance ≤ 1 for ≥ 5 chars (AC23)', () => {
  assert.ok(ids('refac').includes('skill:alpha-tools/refactor'));
  assert.ok(ids('reveiw').includes('skill:alpha-tools/code-review'));
  assert.ok(editDistanceAtMostOne('review', 'reveiw')); // adjacent swap
  assert.ok(editDistanceAtMostOne('review', 'reviw')); // deletion
  assert.ok(editDistanceAtMostOne('review', 'reviews')); // insertion
  assert.ok(editDistanceAtMostOne('review', 'reviaw')); // substitution
  assert.ok(!editDistanceAtMostOne('review', 'rvwiee'));
});

test('synonyms expand terms, including Ukrainian keys and inflected forms (AC24, AC25)', () => {
  const r = engine.search('рефакторинг');
  assert.ok(r.results.some((x) => x.artifact.id === 'skill:alpha-tools/refactor'));
  assert.deepEqual(r.expansions, [{ term: 'рефакторинг', synonyms: ['refactor', 'refactoring'] }]);
  assert.ok(ids('рефакторингу').includes('skill:alpha-tools/refactor'));
});

test('an untranslated Ukrainian word gives 0 results (EC21)', () => {
  assert.deepEqual(ids('тестування'), []);
});

test('long and special-character queries do not throw (AC35, EC3)', () => {
  assert.doesNotThrow(() => engine.search('c++ .* <script>alert(1)</script> (['));
  const long = 'review '.repeat(100);
  assert.equal(parseQuery(long, searchConfig).raw.length, 200);
});

test('filters: OR inside a group, AND across groups (AC36)', () => {
  const both = engine.search('', { type: ['skill', 'agent'], category: ['review'] }).results;
  assert.ok(both.length > 0);
  assert.ok(both.every((r) => ['skill', 'agent'].includes(r.artifact.type) && r.artifact.category === 'review'));
  const byTag = engine.search('', { tag: ['database'] }).results;
  assert.ok(byTag.every((r) => r.artifact.tags.includes('database')));
  const byAuthor = engine.search('', { author: ['Alpha Team'] }).results;
  assert.ok(byAuthor.length > 0 && byAuthor.every((r) => r.artifact.author === 'Alpha Team'));
});

test('sort by name is case-insensitive (AC75)', () => {
  const names = engine.search('', {}, 'name').results.map((r) => r.artifact.displayName);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' })));
});
