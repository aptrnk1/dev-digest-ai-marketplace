// Shared bootstrap for every page: header, theme, palette, footer, keyboard.
import { $ } from './dom.js';
import { loadIndex } from './data.js';
import { initTheme } from '../components/theme.js';
import { initPalette, isPaletteOpen } from '../components/palette.js';
import { renderFooter } from '../components/footer.js';
import { bindStaticCopyButtons } from '../components/copy.js';

const isTyping = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const visible = (el) => el && el.offsetParent !== null;

/**
 * @param {object} [opts]
 * @param {() => HTMLInputElement|null} [opts.searchInput] input that `/` focuses (AC55)
 */
export function initApp(opts = {}) {
  initTheme($('[data-theme-toggle]'));
  initPalette($('[data-palette-open]'));
  bindStaticCopyButtons();

  const headerForm = $('[data-header-search]');
  if (document.body.dataset.page !== 'home') {
    headerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = headerForm.q.value.trim();
      location.href = q ? `./?q=${encodeURIComponent(q)}` : './';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement) || isPaletteOpen()) return;
    const input = opts.searchInput?.() ?? (visible(headerForm?.q) ? headerForm.q : null);
    if (!input) return;
    e.preventDefault();
    input.focus();
  });

  // Footer: hidden until the index is available (AC52).
  loadIndex().then(renderFooter, () => {});
}
