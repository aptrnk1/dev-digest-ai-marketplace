// Client-side keyword search over the catalog index. Pure ESM, no DOM: the same
// module runs in the browser and in Node unit tests.

export const TYPES = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
export const MAX_QUERY_LENGTH = 200;

const FIELD_WEIGHTS = { name: 3, tags: 2, description: 2, body: 1 };
const FIELDS = Object.keys(FIELD_WEIGHTS);
const MATCH_QUALITY = { exact: 1, prefix: 0.8, fuzzy: 0.6 };
const MIN_PREFIX = 2;
const collator = new Intl.Collator('uk', { sensitivity: 'base' });
const MIN_FUZZY = 5;
// Ukrainian is inflected: a synonym key also matches a longer form of the word
// (an inflected form = key + a short suffix) when the key is at least this long.
const MIN_INFLECTION_KEY = 5;
const MAX_INFLECTION_SUFFIX = 3;
const CYRILLIC = /^[\u0400-\u04FF']+$/;

const APOSTROPHES = /[’ʼ`´‘]/g;
const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}']*/gu;

export function normalize(text) {
  return String(text ?? '').normalize('NFC').toLowerCase().replace(APOSTROPHES, "'");
}

export function tokenize(text) {
  const tokens = normalize(text).match(TOKEN) ?? [];
  return tokens.map((t) => t.replace(/'+$/, '')).filter(Boolean);
}

/** True when `a` and `b` differ by at most one insertion, deletion, substitution or adjacent swap. */
export function editDistanceAtMostOne(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // substitution
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // adjacent swap
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1); // deletion / insertion
}

function buildTypeWordMap(typeWords) {
  const map = new Map();
  for (const [type, words] of Object.entries(typeWords ?? {})) {
    for (const w of words) map.set(normalize(w), type);
  }
  return map;
}

function buildSynonymMap(synonyms) {
  const map = new Map();
  for (const [key, values] of Object.entries(synonyms ?? {})) {
    map.set(normalize(key), values.map((v) => tokenize(v)).filter((t) => t.length));
  }
  return map;
}

function artifactFields(a) {
  return {
    name: `${a.name} ${a.displayName ?? ''}`,
    tags: (a.tags ?? []).join(' '),
    description: a.description ?? '',
    body: a.body ?? '',
  };
}

/**
 * Parses a raw query into search terms.
 * @returns {{terms: string[], types: string[], raw: string}}
 */
export function parseQuery(raw, config) {
  const text = String(raw ?? '').slice(0, MAX_QUERY_LENGTH);
  const stop = new Set([...(config.stopwords?.en ?? []), ...(config.stopwords?.uk ?? [])].map(normalize));
  const typeWords = config._typeWordMap ?? buildTypeWordMap(config.typeWords);
  const terms = [];
  const types = [];
  for (const token of tokenize(text)) {
    const type = typeWords.get(token);
    if (type) {
      if (!types.includes(type)) types.push(type);
      continue;
    }
    if (stop.has(token)) continue;
    if (!terms.includes(token)) terms.push(token);
  }
  return { terms, types, raw: text };
}

export function createSearch(index) {
  const config = { ...(index.search ?? {}) };
  config._typeWordMap = buildTypeWordMap(config.typeWords);
  const synonyms = buildSynonymMap(config.synonyms);
  const artifacts = index.artifacts ?? [];
  const N = artifacts.length;

  // Field-weight sum for every field bitmask.
  const MASK_WEIGHT = new Float64Array(1 << FIELDS.length);
  for (let mask = 0; mask < MASK_WEIGHT.length; mask++) {
    FIELDS.forEach((field, bit) => {
      if (mask & (1 << bit)) MASK_WEIGHT[mask] += FIELD_WEIGHTS[field];
    });
  }

  // Inverted index: token → { ids: Int32Array, masks: Uint8Array }.
  const building = new Map();
  artifacts.forEach((a, idx) => {
    const fields = artifactFields(a);
    FIELDS.forEach((field, bit) => {
      for (const token of tokenize(fields[field])) {
        let postings = building.get(token);
        if (!postings) building.set(token, (postings = new Map()));
        postings.set(idx, (postings.get(idx) ?? 0) | (1 << bit));
      }
    });
  });
  const vocabulary = new Map();
  for (const [token, postings] of building) {
    vocabulary.set(token, { ids: Int32Array.from(postings.keys()), masks: Uint8Array.from(postings.values()) });
  }
  const vocabList = [...vocabulary.keys()];
  const tokenMatches = new Map(); // term → [[vocabToken, quality]]

  function matchToken(term) {
    let out = tokenMatches.get(term);
    if (out) return out;
    out = [];
    for (const token of vocabList) {
      if (token === term) out.push([token, MATCH_QUALITY.exact]);
      else if (term.length >= MIN_PREFIX && token.startsWith(term)) out.push([token, MATCH_QUALITY.prefix]);
      else if (term.length >= MIN_FUZZY && editDistanceAtMostOne(term, token)) out.push([token, MATCH_QUALITY.fuzzy]);
    }
    tokenMatches.set(term, out);
    return out;
  }

  // Scores of one alternative (a phrase: every token must match) per artifact; 0 = no match.
  function scoreAlternative(tokens, matched) {
    let acc = null;
    for (const tok of tokens) {
      const scores = new Float64Array(N);
      for (const [vocabToken, quality] of matchToken(tok)) {
        matched.add(vocabToken);
        const { ids, masks } = vocabulary.get(vocabToken);
        for (let k = 0; k < ids.length; k++) {
          const s = MASK_WEIGHT[masks[k]] * quality;
          if (s > scores[ids[k]]) scores[ids[k]] = s;
        }
      }
      if (acc === null) acc = scores;
      else for (let i = 0; i < N; i++) acc[i] = acc[i] > 0 && scores[i] > 0 ? acc[i] + scores[i] : 0;
    }
    return acc ?? new Float64Array(N);
  }

  function synonymsFor(term) {
    if (synonyms.has(term)) return { key: term, values: synonyms.get(term) };
    for (const [key, values] of synonyms) {
      if (
        key.length >= MIN_INFLECTION_KEY &&
        CYRILLIC.test(key) &&
        !key.includes(' ') &&
        term.startsWith(key) &&
        term.length - key.length <= MAX_INFLECTION_SUFFIX
      ) {
        return { key, values };
      }
    }
    return null;
  }

  function passesFilters(a, filters) {
    if (filters.type?.length && !filters.type.includes(a.type)) return false;
    if (filters.category?.length && !filters.category.includes(a.category)) return false;
    if (filters.tag?.length && !filters.tag.some((t) => (a.tags ?? []).includes(t))) return false;
    if (filters.author?.length && !filters.author.includes(a.author ?? '')) return false;
    return true;
  }

  const byName = (x, y) =>
    collator.compare(x.displayName || x.name, y.displayName || y.name) ||
    x.plugin.localeCompare(y.plugin) ||
    TYPES.indexOf(x.type) - TYPES.indexOf(y.type);

  /**
   * @param {string} raw query text
   * @param {{type?: string[], category?: string[], tag?: string[], author?: string[]}} filters
   * @param {'relevance'|'name'} sort
   * @returns {{results: {artifact: object, score: number, matched: string[]}[], terms: string[],
   *   detectedTypes: string[], hasTerms: boolean, expansions: {term: string, synonyms: string[]}[]}}
   */
  function search(raw, filters = {}, sort = 'relevance') {
    const parsed = parseQuery(raw, config);
    const effective = { ...filters, type: [...new Set([...(filters.type ?? []), ...parsed.types])] };
    const expansions = [];
    const matchedSet = new Set();

    let total = null;
    for (const term of parsed.terms) {
      const alternatives = [[term]];
      const syn = synonymsFor(term);
      if (syn) {
        alternatives.push(...syn.values);
        expansions.push({ term, synonyms: syn.values.map((v) => v.join(' ')) });
      }
      const best = new Float64Array(N);
      for (const alt of alternatives) {
        const scores = scoreAlternative(alt, matchedSet);
        for (let i = 0; i < N; i++) if (scores[i] > best[i]) best[i] = scores[i];
      }
      if (total === null) total = best;
      else for (let i = 0; i < N; i++) total[i] = total[i] > 0 && best[i] > 0 ? total[i] + best[i] : 0;
    }

    const matched = [...matchedSet];
    const results = [];
    for (let i = 0; i < N; i++) {
      if (total !== null && total[i] === 0) continue;
      const artifact = artifacts[i];
      if (!passesFilters(artifact, effective)) continue;
      results.push({ artifact, score: total ? total[i] : 0, matched });
    }
    const relevance = sort === 'relevance' && parsed.terms.length > 0;
    results.sort((a, b) => (relevance ? b.score - a.score : 0) || byName(a.artifact, b.artifact));
    return { results, terms: parsed.terms, detectedTypes: parsed.types, hasTerms: parsed.terms.length > 0, expansions };
  }

  return { search, parseQuery: (raw) => parseQuery(raw, config) };
}
