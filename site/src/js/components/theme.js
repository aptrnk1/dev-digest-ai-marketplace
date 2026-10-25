// Manual light/dark toggle; system theme until the user picks one (AC58, AC76, AC77).
import { t } from '../lib/i18n.js';

const KEY = 'dd-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function stored() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

let sessionChoice = null;
const current = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

function apply(theme, button) {
  document.documentElement.setAttribute('data-theme', theme);
  if (!button) return;
  button.textContent = theme === 'dark' ? t('header.themeIconDark') : t('header.themeIconLight');
  button.setAttribute('aria-label', theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark'));
}

export function initTheme(button) {
  apply(stored() ?? (media.matches ? 'dark' : 'light'), button);
  media.addEventListener('change', (e) => {
    if (!stored() && !sessionChoice) apply(e.matches ? 'dark' : 'light', button);
  });
  button?.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    sessionChoice = next;
    apply(next, button);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage blocked: the choice lives only on this page (AC77).
    }
  });
}
