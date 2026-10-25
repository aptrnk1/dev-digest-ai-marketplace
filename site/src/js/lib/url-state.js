// Search state ⇄ URL query string (AC37–AC39).
import { TYPES } from './search.js';

export const SORTS = ['relevance', 'name'];
const LIST_KEYS = ['type', 'category', 'tag', 'author'];
// Artifacts without an author have author '' in filters; the URL needs a non-empty token.
export const UNKNOWN_AUTHOR = '_unknown';

const splitList = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** Parses the URL. Unknown values are dropped when `known` lists are given. */
export function readState(search = location.search, known = {}) {
  const params = new URLSearchParams(search);
  const state = { q: (params.get('q') ?? '').slice(0, 200), sort: 'relevance' };
  for (const key of LIST_KEYS) {
    let values = splitList(params.get(key));
    if (key === 'author') values = values.map((v) => (v === UNKNOWN_AUTHOR ? '' : v));
    const allowed = key === 'type' ? TYPES : known[key];
    state[key] = allowed ? values.filter((v) => allowed.includes(v)) : values;
  }
  const sort = params.get('sort');
  if (SORTS.includes(sort)) state.sort = sort;
  return state;
}

export function toQueryString(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  for (const key of LIST_KEYS) {
    const values = key === 'author' ? (state[key] ?? []).map((v) => v || UNKNOWN_AUTHOR) : state[key];
    if (values?.length) params.set(key, values.join(','));
  }
  if (state.sort && state.sort !== 'relevance') params.set('sort', state.sort);
  const qs = params.toString().replace(/%2C/g, ',');
  return qs ? `?${qs}` : '';
}

export function writeState(state) {
  const url = `${location.pathname}${toQueryString(state)}${location.hash}`;
  history.replaceState(null, '', url);
}

export const hasFilters = (state) => LIST_KEYS.some((k) => state[k]?.length);
