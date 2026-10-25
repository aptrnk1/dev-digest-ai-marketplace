// Home (no effective query, no filters) and results view on `/` (AC18–AC39, AC72–AC75).
import { $, clear, h } from '../lib/dom.js';
import { initApp } from '../lib/app.js';
import { withIndex } from '../lib/data.js';
import { t } from '../lib/i18n.js';
import { suggestHref } from '../lib/links.js';
import { createSearch, TYPES } from '../lib/search.js';
import { hasFilters, readState, writeState } from '../lib/url-state.js';
import { renderCard } from '../components/card.js';
import { kindDot } from '../components/kind.js';
import { errorState, skeleton } from '../components/states.js';

const DEBOUNCE_MS = 150;
const PAGE_SIZE = 50;
const TOP_TAGS = 7;
const STAT_TYPES = ['plugin', 'skill', 'agent', 'command', 'mcp'];

const homeView = $('[data-view="home"]');
const resultsView = $('[data-view="results"]');
const heroInput = $('[data-hero-search] input');
const headerInput = $('[data-header-search] input');
const filtersEl = $('[data-filters]');
const resultsEl = $('[data-results]');
const sortEl = $('[data-sort]');

let index = null;
let engine = null;
let pluginsByName = new Map();
let state = readState();
let shown = PAGE_SIZE;
let debounce = null;

initApp({ searchInput: () => (homeView.hidden ? headerInput : heroInput) });
for (const input of [heroInput, headerInput]) input.value = state.q;
sortEl.value = state.sort;

// --- input wiring --------------------------------------------------------------
for (const input of [heroInput, headerInput]) {
  input.form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', () => {
    const value = input.value.slice(0, 200);
    for (const other of [heroInput, headerInput]) if (other !== input) other.value = value;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.q = value;
      shown = PAGE_SIZE;
      update({ keepFocus: input });
    }, DEBOUNCE_MS);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      for (const i of [heroInput, headerInput]) i.value = '';
      clearTimeout(debounce);
      state.q = '';
      update({ keepFocus: input });
    } else if (e.key === 'ArrowDown') {
      const first = resultsEl.querySelector('[data-card-link]');
      if (first && !resultsView.hidden) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

sortEl.addEventListener('change', () => {
  state.sort = sortEl.value;
  shown = PAGE_SIZE;
  update();
});

$('[data-filters-toggle]').addEventListener('click', (e) => {
  const open = filtersEl.classList.toggle('is-open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

// ↓/↑ between cards (AC57).
resultsEl.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const links = [...resultsEl.querySelectorAll('[data-card-link]')];
  const current = links.findIndex((l) => l.closest('[data-card]').contains(e.target));
  if (current < 0) return;
  e.preventDefault();
  const next = e.key === 'ArrowDown' ? Math.min(current + 1, links.length - 1) : current - 1;
  if (next < 0) (homeView.hidden ? headerInput : heroInput).focus();
  else links[next].focus();
});

// --- index ---------------------------------------------------------------------
withIndex({
  onLoading: () => {
    clear($('[data-home-content]')).append(skeleton('home'));
    clear(resultsEl).append(skeleton('cards'));
  },
  onReady: (idx) => {
    index = idx;
    engine = createSearch(idx);
    pluginsByName = new Map(idx.plugins.map((p) => [p.name, p]));
    state = readState(location.search, known());
    state.q = heroInput.value.slice(0, 200) || state.q;
    renderHome();
    update({ initial: true });
  },
  onError: (retry) => {
    const box = () => errorState(() => retry());
    clear($('[data-home-content]')).append(box());
    clear(resultsEl).append(box());
  },
});

function known() {
  return {
    category: [...new Set(index.artifacts.map((a) => a.category).filter(Boolean))],
    tag: [...new Set(index.artifacts.flatMap((a) => a.tags ?? []))],
    author: [...new Set(index.artifacts.map((a) => a.author ?? ''))],
  };
}

const countByType = () => {
  const counts = Object.fromEntries(TYPES.map((t) => [t, 0]));
  for (const a of index.artifacts) counts[a.type]++;
  return counts;
};

function navigate(patch) {
  state = { ...state, type: [], category: [], tag: [], author: [], q: '', ...patch };
  for (const i of [heroInput, headerInput]) i.value = state.q;
  shown = PAGE_SIZE;
  update();
  window.scrollTo(0, 0);
}

// --- home (AC72, AC73, AC34) ------------------------------------------------------
function renderHome() {
  const tagsEl = $('[data-home-tags]');
  const content = clear($('[data-home-content]'));
  clear(tagsEl);
  if (!index.plugins.length) {
    content.append(
      h(
        'section',
        { class: 'empty-state' },
        h('div', { class: 'empty-icon', 'aria-hidden': 'true', text: t('home.empty.icon') }),
        h('h2', { text: t('home.empty.title') }),
        h('p', { text: t('home.empty.text') }),
        h(
          'div',
          { class: 'empty-actions' },
          h('a', { class: 'btn btn-primary', href: 'getting-started.html', text: t('home.empty.start') }),
          h('a', { class: 'btn', href: suggestHref(index.build), target: '_blank', rel: 'noopener noreferrer', text: t('common.suggest') }),
        ),
      ),
    );
    return;
  }

  const tagCounts = new Map();
  for (const a of index.artifacts) for (const tag of a.tags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const topTags = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, TOP_TAGS);
  for (const [tag] of topTags) {
    tagsEl.append(h('button', { type: 'button', class: 'chip', text: t('home.tag', { tag }), onClick: () => navigate({ tag: [tag] }) }));
  }

  const counts = countByType();
  content.append(
    h(
      'section',
      { class: 'stats', 'aria-label': t('home.statsAria') },
      STAT_TYPES.map((type) =>
        h(
          'button',
          { type: 'button', class: 'stat', onClick: () => navigate({ type: [type] }) },
          h('div', { class: 'stat-count', text: String(counts[type]) }),
          h('div', { class: 'stat-label', text: t(`home.stat.${type}`) }),
        ),
      ),
    ),
    h(
      'section',
      { class: 'section' },
      h('h2', { class: 'section-title', text: t('home.browseTitle') }),
      h(
        'div',
        { class: 'browse' },
        TYPES.map((type) =>
          h(
            'button',
            { type: 'button', class: 'browse-item', onClick: () => navigate({ type: [type] }) },
            kindDot(type),
            h('span', { class: 'browse-label', text: t(`type.plural.${type}`) }),
            h('span', { class: 'count', text: String(counts[type]) }),
          ),
        ),
      ),
    ),
  );
}

// --- results -----------------------------------------------------------------------
function update({ initial = false, keepFocus = null } = {}) {
  if (!initial) writeState(state);
  if (!engine) return;
  const result = engine.search(state.q, filterArg(), state.sort);
  const showHome = !result.hasTerms && result.detectedTypes.length === 0 && !hasFilters(state);
  homeView.hidden = !showHome;
  resultsView.hidden = showHome;
  document.body.classList.toggle('is-home-view', showHome);
  document.body.classList.toggle('is-results-view', !showHome);
  if (showHome) {
    if (keepFocus === headerInput && !initial) heroInput.focus();
    return;
  }
  if (keepFocus === heroInput) headerInput.focus();
  renderFilters();
  renderResults(result);
}

const filterArg = () => ({ type: state.type, category: state.category, tag: state.tag, author: state.author });

function renderFilters() {
  const counts = countByType();
  const toggle = (key, value) => {
    const list = state[key];
    state[key] = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    shown = PAGE_SIZE;
    update();
  };
  const option = (key, value, label, count, extra = null) => {
    const active = state[key].includes(value);
    return h(
      'label',
      { class: `filter-option${active ? ' is-active' : ''}` },
      h('input', { type: 'checkbox', checked: active, onChange: () => toggle(key, value) }),
      extra,
      h('span', { class: 'label', text: label }),
      count !== null ? h('span', { class: 'count', text: String(count) }) : null,
    );
  };
  const group = (legend, children) =>
    h('fieldset', { class: 'filter-group' }, h('legend', { text: legend }), children);

  const categories = [...new Set(index.artifacts.map((a) => a.category).filter(Boolean))].sort();
  const tags = [...new Set(index.artifacts.flatMap((a) => a.tags ?? []))].sort();
  const authorCounts = new Map();
  for (const a of index.artifacts) authorCounts.set(a.author ?? '', (authorCounts.get(a.author ?? '') ?? 0) + 1);

  clear(filtersEl).append(
    h(
      'div',
      { class: 'filters-head' },
      h('span', { class: 'filters-title', text: t('filters.title') }),
      h('button', { type: 'button', class: 'btn-link', text: t('filters.reset'), onClick: resetFilters }),
    ),
    group(t('filters.type'), h('div', { class: 'filter-list' }, TYPES.map((type) => option('type', type, t(`type.plural.${type}`), counts[type], kindDot(type))))),
    categories.length
      ? group(t('filters.category'), h('div', { class: 'filter-list' }, categories.map((c) => option('category', c, c, null))))
      : null,
    tags.length
      ? group(
          t('filters.keywords'),
          h(
            'div',
            { class: 'tag-list' },
            tags.map((tag) => {
              const active = state.tag.includes(tag);
              return h(
                'label',
                { class: `tag-option${active ? ' is-active' : ''}` },
                h('input', { type: 'checkbox', checked: active, onChange: () => toggle('tag', tag) }),
                tag,
              );
            }),
          ),
        )
      : null,
    group(
      t('filters.author'),
      h(
        'div',
        { class: 'filter-list' },
        [...authorCounts].sort((a, b) => a[0].localeCompare(b[0])).map(([author, count]) =>
          option('author', author, author || t('filters.unknownAuthor'), count),
        ),
      ),
    ),
  );
}

function resetFilters() {
  state = { ...state, type: [], category: [], tag: [], author: [] };
  shown = PAGE_SIZE;
  update();
}

function renderResults(result) {
  const { results, expansions } = result;
  $('[data-results-heading]').textContent = state.q.trim() && result.hasTerms ? t('results.heading', { q: state.q.trim() }) : t('results.overview');
  $('[data-results-count]').textContent = t('results.count', { count: results.length });

  const also = $('[data-also-searched]');
  also.hidden = expansions.length === 0;
  also.textContent = expansions.length
    ? t('results.alsoSearched', {
        list: expansions.map((e) => t('results.expansion', { term: e.term, synonyms: e.synonyms.join(', ') })).join(' · '),
      })
    : '';

  clear(resultsEl);
  if (!results.length) {
    resultsEl.append(
      h(
        'div',
        { class: 'empty-state' },
        h('div', { class: 'empty-icon', 'aria-hidden': 'true', text: t('results.empty.icon') }),
        h('h3', { text: t('results.empty.title') }),
        h('p', { text: t('results.empty.text') }),
        h(
          'div',
          { class: 'empty-actions' },
          hasFilters(state) ? h('button', { type: 'button', class: 'btn', text: t('results.clearFilters'), onClick: resetFilters }) : null,
          h('a', { class: 'btn btn-primary', href: suggestHref(index.build, state.q), target: '_blank', rel: 'noopener noreferrer', text: t('common.suggest') }),
        ),
      ),
    );
    return;
  }
  const list = h('div', { class: 'cards' }, results.slice(0, shown).map((r) => renderCard(r, index, pluginsByName)));
  resultsEl.append(list);
  if (results.length > shown) {
    resultsEl.append(
      h(
        'div',
        { class: 'show-more' },
        h('button', {
          type: 'button',
          class: 'btn',
          text: t('results.showMore', { count: PAGE_SIZE }),
          onClick: () => {
            shown += PAGE_SIZE;
            renderResults(result);
          },
        }),
      ),
    );
  }
}
