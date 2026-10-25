import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BuildErrors, listFiles } from './fs-utils.mjs';
import { checkKeys, createT, loadDictionary } from './i18n.mjs';
import { buildIndex } from './index-builder.mjs';

export const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(SITE_DIR, 'src');

const FONTS = [
  ['ibm-plex-sans', [400, 500, 600, 700]],
  ['ibm-plex-mono', [400, 500, 600]],
];
const FONT_SUBSETS = ['latin', 'cyrillic'];

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Builds the whole static site into `outDir`.
 * @param {object} o
 * @param {string} o.repoRoot   marketplace repository root
 * @param {string} o.outDir
 * @param {string} o.repo       "<owner>/<repo>"
 * @param {string} o.sha
 * @param {string} [o.buildTime]
 * @param {string} [o.synonymsFile]
 * @param {boolean} [o.dev]     inject the live-reload client (dev server only)
 */
export function buildSite(o) {
  const dict = loadDictionary(path.join(SRC, 'i18n', 'uk.json'));
  const keyErrors = checkKeys(SRC, dict);
  if (keyErrors.length) throw new BuildErrors(keyErrors);
  const t = createT(dict);

  const searchConfig = JSON.parse(readFileSync(path.join(SITE_DIR, 'data', 'search.json'), 'utf8'));
  const { index, files } = buildIndex({
    repoRoot: o.repoRoot,
    marketplaceFile: path.join(o.repoRoot, '.claude-plugin', 'marketplace.json'),
    searchConfig,
    synonymsFile: o.synonymsFile ?? path.join(SITE_DIR, 'data', 'synonyms.json'),
    repo: o.repo,
    sha: o.sha,
    buildTime: o.buildTime ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    t,
  });

  rmSync(o.outDir, { recursive: true, force: true });
  mkdirSync(o.outDir, { recursive: true });
  const write = (rel, content) => {
    const file = path.join(o.outDir, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  };

  write('index.json', JSON.stringify(index));
  for (const f of files) {
    if (f.copyFrom) {
      mkdirSync(path.dirname(path.join(o.outDir, f.out)), { recursive: true });
      cpSync(f.copyFrom, path.join(o.outDir, f.out));
    } else write(f.out, f.content);
  }

  cpSync(path.join(SRC, 'css'), path.join(o.outDir, 'assets', 'css'), { recursive: true });
  cpSync(path.join(SRC, 'js'), path.join(o.outDir, 'assets', 'js'), { recursive: true });
  cpSync(path.join(SRC, 'assets'), path.join(o.outDir, 'assets'), { recursive: true });
  write('assets/js/i18n-data.js', `export default ${JSON.stringify(dict)};\n`);
  versionImports(path.join(o.outDir, 'assets', 'js'), o.sha.slice(0, 12));
  copyFonts(o.outDir);

  const vars = {
    repo: o.repo,
    marketplace: index.build.marketplace,
    repoUrl: `https://github.com/${o.repo}`,
    firstPlugin: index.plugins[0]?.name ?? '<plugin>',
    version: o.sha.slice(0, 12),
  };
  for (const page of listFiles(path.join(SRC, 'pages'), { ext: '.html' })) {
    let html = renderTemplate(readFileSync(page, 'utf8'), { t, vars });
    if (o.dev) html = html.replace('</body>', '<script type="module" src="__dev/reload.js"></script>\n</body>');
    write(path.basename(page), html);
  }
  write('.nojekyll', '');
  return { index, outDir: o.outDir };
}

/** Appends ?v=<version> to relative ES module imports so a deploy never mixes old and new modules. */
function versionImports(dir, version) {
  for (const file of listFiles(dir, { recursive: true, ext: '.js' })) {
    const source = readFileSync(file, 'utf8');
    const out = source.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+\.js)\2/g, `$1$2$3?v=${version}$2`);
    if (out !== source) writeFileSync(file, out);
  }
}

export function renderTemplate(source, { t, vars }) {
  const withPartials = source.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) =>
    readFileSync(path.join(SRC, 'partials', `${name}.html`), 'utf8'),
  );
  return withPartials
    .replace(/\{\{t:([\w.-]+)\}\}/g, (_, key) => escapeHtml(t(key)))
    .replace(/\{\{(\w+)\}\}/g, (m, name) => {
      if (!(name in vars)) throw new Error(`unknown template variable "${name}"`);
      return escapeHtml(vars[name]);
    });
}

function copyFonts(outDir) {
  const dir = path.join(outDir, 'assets', 'fonts');
  mkdirSync(dir, { recursive: true });
  for (const [family, weights] of FONTS) {
    const pkg = path.join(SITE_DIR, 'node_modules', '@fontsource', family);
    for (const weight of weights) {
      for (const subset of FONT_SUBSETS) {
        const name = `${family}-${subset}-${weight}-normal.woff2`;
        cpSync(path.join(pkg, 'files', name), path.join(dir, name));
      }
    }
    if (existsSync(path.join(pkg, 'LICENSE'))) cpSync(path.join(pkg, 'LICENSE'), path.join(dir, `${family}-LICENSE.txt`));
  }
}

/** Repository slug and HEAD SHA from git, or nulls outside a git checkout. */
export function gitInfo(root) {
  const git = (...args) => {
    try {
      return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return null;
    }
  };
  const remote = git('remote', 'get-url', 'origin') ?? '';
  const fromRemote = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote)?.[1];
  return { repo: fromRemote ?? null, sha: git('rev-parse', 'HEAD') };
}
