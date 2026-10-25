import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';

export const kindBadge = (type) => h('span', { class: `kind-badge kind-${type}`, text: t(`type.badge.${type}`) });
export const kindDot = (type) => h('span', { class: `kind-dot kind-${type}`, 'aria-hidden': 'true' });

export const RISKS = ['hooks', 'mcp', 'lsp', 'monitors', 'bin'];
export function riskBadges(risks) {
  if (!risks?.length) return null;
  return h('div', { class: 'risk-list' }, risks.map((r) => h('span', { class: 'risk', text: t(`risk.${r}`) })));
}
