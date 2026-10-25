// Result card (AC26, AC30, AC41).
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { artifactHref, installText, pluginHref } from '../lib/links.js';
import { copyButton } from './copy.js';
import { kindBadge, riskBadges } from './kind.js';
import { highlight, snippetText } from './snippet.js';

const MAX_TAGS = 3;

export function renderCard({ artifact: a, matched }, index, pluginsByName) {
  const href = artifactHref(a);
  const plugin = pluginsByName.get(a.plugin);
  const meta =
    a.type === 'plugin'
      ? a.author ?? ''
      : h('span', {}, h('a', { href: pluginHref(a.plugin), text: plugin?.displayName ?? a.plugin }), a.author ? ` · ${a.author}` : '');

  return h(
    'article',
    { class: 'card', 'data-card': '' },
    h(
      'div',
      { class: 'card-body' },
      h(
        'div',
        { class: 'card-top' },
        kindBadge(a.type),
        a.version ? h('span', { class: 'card-version', text: t('plugin.version', { version: a.version }) }) : null,
      ),
      h('h2', { class: 'card-h' }, h('a', { class: 'card-title', href, 'data-card-link': '', text: a.displayName || a.name })),
      h('p', { class: 'card-snippet' }, highlight(snippetText(a, matched), matched)),
      a.invocation
        ? h(
            'div',
            { class: 'card-invocation', 'data-copy-host': '' },
            h('code', { text: a.invocation }),
            copyButton(t('common.copy'), () => a.invocation, 'btn btn-sm', t('card.copyInvocation')),
          )
        : null,
      a.type === 'plugin' ? riskBadges(plugin?.risks) : null,
      a.tags?.length
        ? h('div', { class: 'card-tags' }, a.tags.slice(0, MAX_TAGS).map((tag) => h('span', { text: t('card.tag', { tag }) })))
        : null,
    ),
    h(
      'div',
      { class: 'card-foot', 'data-copy-host': '' },
      h('span', { class: 'card-meta' }, meta),
      h(
        'div',
        { class: 'card-actions' },
        copyButton(t('common.copyInstall'), () => installText(index.build, a.plugin)),
        h('a', { class: 'btn btn-sm btn-primary', href, text: t('card.open'), tabindex: '-1' }),
      ),
    ),
  );
}
