// Plugin page (AC43–AC48, AC89).
import { $, clear, h } from '../lib/dom.js';
import { initApp } from '../lib/app.js';
import { withIndex } from '../lib/data.js';
import { t } from '../lib/i18n.js';
import { artifactHref, installText, pluginHref } from '../lib/links.js';
import { TYPES } from '../lib/search.js';
import { copyButton } from '../components/copy.js';
import { kindDot, riskBadges } from '../components/kind.js';
import { markdownSection, notFound, terminal, transparencySection } from '../components/detail.js';
import { errorState, skeleton } from '../components/states.js';

initApp();
const root = $('[data-plugin-root]');
const name = new URLSearchParams(location.search).get('name') ?? '';

withIndex({
  onLoading: () => clear(root).append(skeleton('detail')),
  onError: (retry) => clear(root).append(errorState(retry)),
  onReady: (index) => render(index).catch((err) => console.error(err)),
});

function backLink() {
  // Back to the previous search state when we came from it (AC43).
  const ref = document.referrer ? new URL(document.referrer) : null;
  const fromSearch = ref && ref.origin === location.origin && /\/(index\.html)?$/.test(ref.pathname);
  return h('a', { class: 'btn-link', href: fromSearch ? `./${ref.search}` : './', text: t('plugin.back') });
}

async function render(index) {
  const plugin = index.plugins.find((p) => p.name === name);
  if (!plugin) {
    clear(root).append(notFound(t('plugin.notFound', { name })));
    return;
  }
  document.title = t('page.plugin.titleNamed', { name: plugin.displayName });
  const components = index.artifacts.filter((a) => a.plugin === plugin.name && a.type !== 'plugin');
  const install = installText(index.build, plugin.name);

  const head = h(
    'div',
    { class: 'detail-head' },
    h('div', { class: 'detail-icon', 'aria-hidden': 'true', text: t('plugin.icon') }),
    h(
      'div',
      {},
      h(
        'div',
        { class: 'detail-title' },
        h('h1', { text: plugin.displayName }),
        plugin.version ? h('span', { class: 'version-badge', text: t('plugin.version', { version: plugin.version }) }) : null,
      ),
      h('p', { class: 'detail-desc', text: plugin.description }),
      h(
        'div',
        { class: 'detail-meta' },
        h('span', { text: plugin.name }),
        plugin.author ? h('span', { text: plugin.author }) : null,
        plugin.category ? h('span', { text: t('plugin.category', { category: plugin.category }) }) : null,
        plugin.license ? h('span', { text: t('plugin.license', { license: plugin.license }) }) : null,
      ),
      plugin.tags.length ? h('div', { class: 'detail-tags' }, plugin.tags.map((tag) => h('span', { text: t('card.tag', { tag }) }))) : null,
      riskBadges(plugin.risks),
    ),
  );

  const installBlock = terminal(install, t('common.copyInstall'));
  if (plugin.githubUrl) {
    installBlock.append(h('a', { class: 'btn btn-lg', href: plugin.githubUrl, target: '_blank', rel: 'noopener noreferrer', text: t('plugin.viewOnGithub') }));
  }

  const sections = [];
  if (plugin.external) {
    sections.push(h('section', { class: 'section' }, h('div', { class: 'panel dim', text: t('plugin.external') })));
  } else {
    sections.push(componentsSection(components));
    const deps = dependenciesSection(plugin, index);
    if (deps) sections.push(deps);
    sections.push(transparencySection(plugin.transparency));
  }

  const readme = h('section', { class: 'section' }, h('h2', { class: 'section-title', text: t('plugin.readme') }));
  clear(root).append(backLink(), head, installBlock, ...sections, readme);
  readme.append(await markdownSection(plugin.readme, t('plugin.noReadme')));
}

function componentsSection(components) {
  const groups = TYPES.filter((type) => type !== 'plugin')
    .map((type) => ({ type, items: components.filter((c) => c.type === type) }))
    .filter((g) => g.items.length);
  return h(
    'section',
    { class: 'section' },
    h('h2', { class: 'section-title', text: t('plugin.components') }),
    h(
      'div',
      { class: 'comp-groups' },
      groups.map(({ type, items }) =>
        h(
          'div',
          {},
          h(
            'div',
            { class: 'comp-group-head' },
            kindDot(type),
            h('h3', { class: 'comp-group-title', text: t(`type.plural.${type}`) }),
            h('span', { class: 'count', text: String(items.length) }),
          ),
          h(
            'div',
            { class: 'comp-grid' },
            items.map((c) =>
              h(
                'div',
                { class: 'comp', 'data-copy-host': '' },
                h(
                  'div',
                  { class: 'comp-top' },
                  h('a', { class: 'comp-name', href: artifactHref(c), text: c.displayName || c.name }),
                  c.invocation ? copyButton(t('common.copy'), () => c.invocation, 'btn-link') : null,
                ),
                c.invocation ? h('div', { class: 'comp-invocation', text: c.invocation }) : null,
                c.description ? h('div', { class: 'comp-desc', text: c.description }) : null,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function dependenciesSection(plugin, index) {
  if (!plugin.dependencies?.length) return null;
  const names = new Set(index.plugins.map((p) => p.name));
  return h(
    'section',
    { class: 'section' },
    h('h2', { class: 'section-title', text: t('plugin.dependencies') }),
    h(
      'div',
      { class: 'deps' },
      plugin.dependencies.map((d) => {
        const label = d.version ? t('plugin.dependencyVersion', { name: d.name, version: d.version }) : d.name;
        if (d.marketplace === index.build.marketplace && names.has(d.name)) {
          return h('a', { class: 'dep', href: pluginHref(d.name), text: t('plugin.dependencyLink', { name: label }) });
        }
        const ext = d.version ? `${d.name}@${d.marketplace} ${d.version}` : `${d.name}@${d.marketplace}`;
        return h('span', { class: 'dep' }, ext, h('span', { class: 'dep-note', text: t('plugin.dependencyExternal') }));
      }),
    ),
  );
}
