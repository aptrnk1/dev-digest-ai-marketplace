import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { repoUrl } from '../lib/links.js';

/** Build time and commit line (AC52). */
export function renderFooter(index) {
  const footer = document.querySelector('[data-footer]');
  if (!footer) return;
  const { time, sha } = index.build;
  const date = time.replace('T', ' ').slice(0, 16);
  footer.replaceChildren(
    t('footer.built', { date }),
    ' · ',
    h('a', {
      href: `${repoUrl(index.build)}/commit/${sha}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': t('footer.commitAria', { sha: sha.slice(0, 7) }),
      text: sha.slice(0, 7),
    }),
  );
}
