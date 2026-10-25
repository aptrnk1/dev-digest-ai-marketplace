// Pieces shared by the plugin and artifact pages.
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { copyButton } from './copy.js';

/** `$ <command>` terminal block with a copy button. */
export function terminal(text, buttonLabel) {
  return h(
    'div',
    { class: 'install', 'data-copy-host': '' },
    h('div', { class: 'terminal' }, h('span', { class: 'prompt', 'aria-hidden': 'true', text: t('common.prompt') }), h('pre', { text })),
    copyButton(buttonLabel, () => text, 'btn btn-primary btn-lg'),
  );
}

/** Fetches pre-rendered, build-time-sanitized Markdown (AC14–AC17, AC82). */
export async function markdownSection(url, emptyText) {
  const panel = h('div', { class: 'panel markdown' });
  if (!url) {
    panel.append(h('p', { text: emptyText }));
    return panel;
  }
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Trusted: produced and sanitized by index-build, same origin, CSP blocks inline script.
    panel.innerHTML = await res.text();
  } catch {
    panel.append(h('p', { text: emptyText }));
  }
  return panel;
}

export function notFound(message) {
  return h('div', { class: 'error-state' }, h('p', { text: message }), h('a', { class: 'btn', href: './', text: t('common.backHome') }));
}

const list = (items) => items.join(', ');

/** The "what this plugin runs on your machine" section (AC45, AC46). */
export function transparencySection(tr) {
  const blocks = [];
  const sub = (title, rows) =>
    rows.length ? [h('h3', { class: 'transparency-sub', text: title }), h('ul', { class: 'transparency-list' }, rows)] : [];
  const extras = (o) =>
    [o.envNames?.length ? t('transparency.env', { names: list(o.envNames) }) : null, o.headerNames?.length ? t('transparency.headers', { names: list(o.headerNames) }) : null]
      .filter(Boolean)
      .map((text) => h('div', { class: 'faint', text }));

  blocks.push(
    ...sub(
      t('transparency.hooks'),
      tr.hooks.flatMap((hook) =>
        hook.handlers.map((hd) =>
          h(
            'li',
            {},
            h('div', { text: t('transparency.hookLine', { event: hook.event, matcher: hook.matcher ?? t('transparency.anyMatcher') }) }),
            h('div', { text: [hd.command, ...(hd.args ?? []), hd.url].filter(Boolean).join(' ') || hd.type }),
            extras(hd),
          ),
        ),
      ),
    ),
    ...sub(
      t('transparency.mcp'),
      tr.mcp.map((s) => h('li', {}, h('div', { text: `${s.name} · ${s.url ?? [s.command, ...(s.args ?? [])].filter(Boolean).join(' ')}` }), extras(s))),
    ),
    ...sub(
      t('transparency.lsp'),
      tr.lsp.map((s) => h('li', {}, h('div', { text: `${s.name} · ${[s.command, ...(s.args ?? [])].filter(Boolean).join(' ')}` }), extras(s))),
    ),
    ...sub(t('transparency.monitors'), tr.monitors.map((m) => h('li', { text: [m.name, m.command].filter(Boolean).join(' · ') }))),
    ...sub(t('transparency.bin'), tr.bin.map((b) => h('li', { text: b }))),
  );

  return h(
    'section',
    { class: 'section' },
    h('h2', { class: 'section-title', text: t('transparency.title') }),
    h(
      'div',
      { class: 'panel' },
      blocks.length ? blocks : h('p', { class: 'dim', text: t('transparency.none') }),
      h('p', { class: 'transparency-note', text: t('transparency.note') }),
    ),
  );
}
