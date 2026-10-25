// ⌘K / Ctrl+K command palette (AC84–AC86).
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { loadIndex } from '../lib/data.js';
import { artifactHref } from '../lib/links.js';
import { createSearch, TYPES } from '../lib/search.js';
import { kindDot } from './kind.js';

const LIMIT = 8;
const collator = new Intl.Collator('uk', { sensitivity: 'base' });
let search = null;
let index = null;
let state = null; // { backdrop, input, list, opener, selected, items }

const byPaletteOrder = (a, b) =>
  (a.type === 'plugin' ? 0 : 1) - (b.type === 'plugin' ? 0 : 1) ||
  collator.compare(a.displayName || a.name, b.displayName || b.name) ||
  TYPES.indexOf(a.type) - TYPES.indexOf(b.type);

function results(query) {
  if (!search) return null;
  const { results: hits, hasTerms } = search.search(query, {}, 'relevance');
  const list = hasTerms ? hits.map((r) => r.artifact) : [...index.artifacts].sort(byPaletteOrder);
  return list.slice(0, LIMIT);
}

function render() {
  const { list, input } = state;
  const items = results(input.value);
  list.replaceChildren();
  state.items = items ?? [];
  if (items === null) {
    list.append(h('li', { class: 'palette-status', role: 'presentation', text: state.error ? '' : t('common.loading') }));
    if (state.error) {
      list.firstChild.append(
        h('div', { text: t('error.index') }),
        h('button', { type: 'button', class: 'btn btn-sm', text: t('error.retry'), onClick: () => prepare() }),
      );
    }
    input.removeAttribute('aria-activedescendant');
    return;
  }
  if (!items.length) {
    list.append(h('li', { class: 'palette-status', role: 'presentation', text: t('palette.empty') }));
    input.removeAttribute('aria-activedescendant');
    return;
  }
  state.selected = Math.min(state.selected, items.length - 1);
  items.forEach((a, i) => {
    const id = `palette-item-${i}`;
    list.append(
      h(
        'li',
        {
          id,
          role: 'option',
          class: 'palette-item',
          'aria-selected': String(i === state.selected),
          onClick: () => go(a),
          onMousemove: () => select(i),
        },
        kindDot(a.type),
        h(
          'span',
          { class: 'main' },
          h('span', { class: 'name', text: a.displayName || a.name }),
          ' ',
          h('span', { class: 'meta', text: `· ${a.type === 'plugin' ? t('palette.pluginMeta') : a.plugin}` }),
        ),
        h('span', { class: 'kbd', text: t(`type.badge.${a.type}`) }),
      ),
    );
  });
  input.setAttribute('aria-activedescendant', `palette-item-${state.selected}`);
}

function select(i) {
  if (!state || i === state.selected) return;
  state.selected = i;
  state.list.querySelectorAll('.palette-item').forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
  state.input.setAttribute('aria-activedescendant', `palette-item-${i}`);
  state.list.children[i]?.scrollIntoView({ block: 'nearest' });
}

function go(artifact) {
  location.href = artifactHref(artifact);
}

function prepare() {
  if (state) state.error = false;
  loadIndex().then(
    (idx) => {
      index = idx;
      search = createSearch(idx);
      if (state) render();
    },
    () => {
      if (state) {
        state.error = true;
        render();
      }
    },
  );
}

export function openPalette() {
  if (state) return;
  const opener = document.activeElement;
  const input = h('input', {
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': 'palette-list',
    'aria-autocomplete': 'list',
    autocomplete: 'off',
    placeholder: t('palette.placeholder'),
    'aria-label': t('palette.placeholder'),
  });
  const list = h('ul', { id: 'palette-list', class: 'palette-list', role: 'listbox' });
  const dialog = h(
    'div',
    { class: 'palette', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('palette.label') },
    h('div', { class: 'palette-head' }, h('span', { class: 'faint', 'aria-hidden': 'true', text: '⌕' }), input, h('span', { class: 'kbd', text: t('palette.esc') })),
    list,
  );
  const backdrop = h('div', { class: 'palette-backdrop' }, dialog);
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) closePalette();
  });
  input.addEventListener('input', () => {
    state.selected = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      select(Math.min(state.selected + 1, state.items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      select(Math.max(state.selected - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const a = state.items[state.selected];
      if (a) go(a);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // keep focus inside the modal
    }
  });
  state = { backdrop, input, list, opener, selected: 0, items: [], error: false };
  document.body.append(backdrop);
  input.focus();
  render();
  if (!search) prepare();
}

export function closePalette() {
  if (!state) return;
  const { backdrop, opener } = state;
  state = null;
  backdrop.remove();
  if (opener instanceof HTMLElement) opener.focus();
}

export const isPaletteOpen = () => state !== null;

export function initPalette(button) {
  button?.addEventListener('click', () => (isPaletteOpen() ? closePalette() : openPalette()));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isPaletteOpen()) closePalette();
      else openPalette();
    } else if (e.key === 'Escape' && isPaletteOpen()) {
      e.preventDefault();
      closePalette();
    }
  });
}
