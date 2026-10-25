import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFilters, readState, toQueryString } from '../../src/js/lib/url-state.js';

test('state round-trips through the URL, empty params and default sort omitted (AC37, AC38)', () => {
  const state = { q: 'code review', type: ['skill', 'agent'], category: [], tag: ['react'], author: [], sort: 'relevance' };
  const qs = toQueryString(state);
  assert.equal(qs, '?q=code+review&type=skill,agent&tag=react');
  assert.deepEqual(readState(qs), state);
  assert.equal(toQueryString({ ...state, sort: 'name' }), `${qs}&sort=name`);
});

test('unknown values are ignored, the rest applied (AC39)', () => {
  const s = readState('?type=skill,banana&tag=react,nope&sort=weird', { tag: ['react'] });
  assert.deepEqual(s.type, ['skill']);
  assert.deepEqual(s.tag, ['react']);
  assert.equal(s.sort, 'relevance');
  assert.equal(hasFilters(s), true);
  assert.equal(hasFilters(readState('?q=x')), false);
});

test('query is capped at 200 characters (AC35)', () => {
  assert.equal(readState(`?q=${'a'.repeat(300)}`).q.length, 200);
});

test('the "unknown author" filter round-trips through the URL (AC37, AC38)', () => {
  const state = { q: '', type: [], category: [], tag: [], author: ['', 'aptrnk1'], sort: 'relevance' };
  const qs = toQueryString(state);
  assert.equal(qs, '?author=_unknown,aptrnk1');
  assert.deepEqual(readState(qs, { author: ['', 'aptrnk1'] }).author, ['', 'aptrnk1']);
});
