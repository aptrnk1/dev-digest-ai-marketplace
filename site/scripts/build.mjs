#!/usr/bin/env node
// Builds the catalog site: `node scripts/build.mjs [--root <repo>] [--out <dir>] [--repo owner/name] [--sha <sha>]`
import path from 'node:path';
import { parseArgs } from 'node:util';
import { BuildErrors } from './lib/fs-utils.mjs';
import { SITE_DIR, buildSite, gitInfo } from './lib/site-builder.mjs';

const { values } = parseArgs({
  options: {
    root: { type: 'string', default: path.resolve(SITE_DIR, '..') },
    out: { type: 'string', default: path.join(SITE_DIR, 'dist') },
    repo: { type: 'string' },
    sha: { type: 'string' },
    synonyms: { type: 'string' },
    'build-time': { type: 'string' },
  },
});

const root = path.resolve(values.root);
const info = gitInfo(root);
const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? info.repo ?? 'aptrnk1/dev-digest-ai-marketplace';
const sha = values.sha ?? process.env.GITHUB_SHA ?? info.sha ?? '0'.repeat(40);

try {
  const started = Date.now();
  const { index, outDir } = buildSite({
    repoRoot: root,
    outDir: path.resolve(values.out),
    repo,
    sha,
    synonymsFile: values.synonyms && path.resolve(values.synonyms),
    buildTime: values['build-time'],
  });
  console.log(
    `Built ${index.plugins.length} plugins, ${index.artifacts.length} artifacts → ${path.relative(process.cwd(), outDir) || outDir} (${Date.now() - started} ms)`,
  );
} catch (err) {
  if (err instanceof BuildErrors) {
    for (const line of err.errors) console.error(line);
    process.exit(1);
  }
  throw err;
}
