// URLs are relative: GitHub Pages serves the site from /<repo>/.
import { t } from './i18n.js';

export const pluginHref = (name) => `plugin.html?name=${encodeURIComponent(name)}`;

export const artifactHref = (a) =>
  a.type === 'plugin'
    ? pluginHref(a.name)
    : `artifact.html?plugin=${encodeURIComponent(a.plugin)}&type=${encodeURIComponent(a.type)}&name=${encodeURIComponent(a.name)}`;

export const installText = (build, plugin) =>
  `/plugin marketplace add ${build.repo}\n/plugin install ${plugin}@${build.marketplace}`;

export const repoUrl = (build) => `https://github.com/${build.repo}`;

/** Prefilled GitHub issue for the "suggest a plugin" button (AC51). */
export function suggestHref(build, query = '') {
  const q = query.trim();
  const title = q ? t('issue.titleWithQuery', { q }) : t('issue.title');
  const body = [q ? t('issue.searched', { q }) : '', '', t('issue.what'), '', '', t('issue.example'), '', '']
    .join('\n')
    .replace(/^\n+/, '');
  return `${repoUrl(build)}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
