// Artifact page: skill, agent, command, hook, mcp (AC78–AC82).
import { $, clear, h } from '../lib/dom.js';
import { initApp } from '../lib/app.js';
import { withIndex } from '../lib/data.js';
import { t } from '../lib/i18n.js';
import { installText, pluginHref } from '../lib/links.js';
import { copyButton } from '../components/copy.js';
import { kindBadge } from '../components/kind.js';
import { markdownSection, notFound, terminal } from '../components/detail.js';
import { errorState, skeleton } from '../components/states.js';

initApp();
const root = $('[data-artifact-root]');
const params = new URLSearchParams(location.search);
const key = { plugin: params.get('plugin') ?? '', type: params.get('type') ?? '', name: params.get('name') ?? '' };

withIndex({
  onLoading: () => clear(root).append(skeleton('detail')),
  onError: (retry) => clear(root).append(errorState(retry)),
  onReady: (index) => render(index).catch((err) => console.error(err)),
});

const tools = (list) => h('div', { class: 'tool-list' }, list.map((x) => h('span', { class: 'tool', text: x })));

function toolsSection(a) {
  if (a.type !== 'skill' && a.type !== 'command' && a.type !== 'agent') return null;
  const parts = [h('div', { class: 'tools-title', text: t('artifact.tools') })];
  if (a.tools?.length) parts.push(tools(a.tools));
  else parts.push(h('p', { class: 'dim', text: a.type === 'agent' ? t('artifact.inheritsAll') : t('artifact.noExtraPermissions') }));
  if (a.disallowedTools?.length) parts.push(h('div', { class: 'tools-title', text: t('artifact.disallowed') }), tools(a.disallowedTools));
  if (a.model) parts.push(h('p', { class: 'faint mono', text: t('artifact.model', { model: a.model }) }));
  return h('div', {}, parts);
}

function configPanel(a) {
  const rows = [];
  const names = (o) => [
    o.envNames?.length ? t('transparency.env', { names: o.envNames.join(', ') }) : null,
    o.headerNames?.length ? t('transparency.headers', { names: o.headerNames.join(', ') }) : null,
  ];
  if (a.type === 'hook') {
    rows.push(t('artifact.hookEvent', { event: a.hook.event }));
    if (a.hook.matcher) rows.push(t('artifact.hookMatcher', { matcher: a.hook.matcher }));
    for (const hd of a.hook.handlers) rows.push([hd.command, ...(hd.args ?? []), hd.url].filter(Boolean).join(' ') || hd.type, ...names(hd));
  } else {
    rows.push(t('artifact.mcpTransport', { transport: a.mcp.transport }));
    rows.push(a.mcp.url ?? [a.mcp.command, ...(a.mcp.args ?? [])].filter(Boolean).join(' '), ...names(a.mcp));
  }
  return h('div', { class: 'panel' }, h('ul', { class: 'transparency-list' }, rows.filter(Boolean).map((r) => h('li', { text: r }))));
}

async function render(index) {
  const a = index.artifacts.find((x) => x.type !== 'plugin' && x.plugin === key.plugin && x.type === key.type && x.name === key.name);
  if (!key.plugin || !key.type || !key.name || !a) {
    clear(root).append(notFound(t('artifact.notFound')));
    return;
  }
  document.title = t('page.artifact.titleNamed', { name: a.displayName || a.name });
  const plugin = index.plugins.find((p) => p.name === a.plugin);

  const crumbs = h(
    'nav',
    { class: 'breadcrumbs', 'aria-label': t('artifact.catalog') },
    h('a', { href: './', text: t('artifact.catalog') }),
    h('span', { class: 'sep', 'aria-hidden': 'true', text: t('artifact.separator') }),
    h('a', { href: pluginHref(a.plugin), text: plugin?.displayName ?? a.plugin }),
    h('span', { class: 'sep', 'aria-hidden': 'true', text: t('artifact.separator') }),
    h('span', { 'aria-current': 'page', text: a.name }),
  );

  const title = h(
    'div',
    { class: 'detail-title' },
    kindBadge(a.type),
    h('h1', { text: a.displayName || a.name }),
    a.invocation
      ? h('span', { class: 'invocation-pill', 'data-copy-host': '' }, h('code', { text: a.invocation }), copyButton(t('common.copy'), () => a.invocation, 'btn-link'))
      : null,
  );

  const install = terminal(installText(index.build, a.plugin), t('common.copyInstall'));
  if (a.githubUrl) install.append(h('a', { class: 'btn btn-lg', href: a.githubUrl, target: '_blank', rel: 'noopener noreferrer', text: t('plugin.viewOnGithub') }));

  const docs = h('section', { class: 'section' }, h('h2', { class: 'section-title', text: t('artifact.docs') }));
  clear(root).append(crumbs, title, a.description ? h('p', { class: 'detail-desc', text: a.description }) : null, toolsSection(a), install, docs);
  if (a.type === 'hook' || a.type === 'mcp') docs.append(configPanel(a));
  else docs.append(await markdownSection(a.html, t('artifact.noDocs')));
}
