import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';

export function errorState(onRetry) {
  return h(
    'div',
    { class: 'error-state', role: 'alert' },
    h('p', { text: t('error.index') }),
    h('button', { type: 'button', class: 'btn btn-primary', text: t('error.retry'), onClick: onRetry }),
  );
}

export function skeleton(kind) {
  const box = h('div', { 'aria-busy': 'true', 'aria-label': t('common.loading') });
  if (kind === 'cards') {
    box.className = 'cards';
    for (let i = 0; i < 3; i++) box.append(h('div', { class: 'skeleton skeleton-card' }));
  } else if (kind === 'home') {
    box.append(h('div', { class: 'skeleton skeleton-block' }), h('div', { class: 'skeleton skeleton-line' }));
  } else {
    box.append(
      h('div', { class: 'skeleton skeleton-title' }),
      h('div', { class: 'skeleton skeleton-line' }),
      h('div', { class: 'skeleton skeleton-block' }),
      h('div', { class: 'skeleton skeleton-block' }),
    );
  }
  return box;
}
