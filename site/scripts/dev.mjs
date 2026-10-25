#!/usr/bin/env node
// Local dev server: builds the site from the working tree (uncommitted changes included),
// serves it on http://localhost:4321, rebuilds and live-reloads on changes (AC92).
import { watch } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { BuildErrors } from './lib/fs-utils.mjs';
import { SITE_DIR, buildSite, gitInfo } from './lib/site-builder.mjs';
import { createStaticServer } from './lib/static-server.mjs';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: process.env.PORT ?? '4321' },
    root: { type: 'string', default: path.resolve(SITE_DIR, '..') },
  },
});

const repoRoot = path.resolve(values.root);
const outDir = path.join(SITE_DIR, '.dev');
const clients = new Set();
const info = gitInfo(repoRoot);

const RELOAD_CLIENT = `const es = new EventSource('__dev/events');
es.addEventListener('reload', () => location.reload());
`;

function build(reason) {
  const started = Date.now();
  try {
    const { index } = buildSite({
      repoRoot,
      outDir,
      repo: info.repo ?? 'aptrnk1/dev-digest-ai-marketplace',
      sha: info.sha ?? '0'.repeat(40),
      dev: true,
    });
    console.log(`[dev] ${reason}: ${index.plugins.length} plugins, ${index.artifacts.length} artifacts (${Date.now() - started} ms)`);
    for (const res of clients) res.write('event: reload\ndata: {}\n\n');
  } catch (err) {
    // Keep serving the last good build; the error stays in the terminal.
    console.error(`[dev] build failed (${reason}); still serving the last good build:`);
    if (err instanceof BuildErrors) for (const line of err.errors) console.error(`  ${line}`);
    else console.error(err);
  }
}

build('initial build');

const server = createStaticServer({
  root: outDir,
  routes: {
    '/__dev/reload.js': (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }).end(RELOAD_CLIENT);
    },
    '/__dev/events': (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
    },
  },
});
server.listen(Number(values.port), '127.0.0.1', () => {
  console.log(`[dev] http://localhost:${values.port}  (watching plugins/, .claude-plugin/, site/src, site/data)`);
});

let timer = null;
let changed = new Set();
const schedule = (file) => {
  changed.add(file);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const list = [...changed].slice(0, 3).join(', ');
    changed = new Set();
    build(`changed ${list}`);
  }, 200);
};

const targets = [
  path.join(repoRoot, 'plugins'),
  path.join(repoRoot, '.claude-plugin'),
  path.join(SITE_DIR, 'src'),
  path.join(SITE_DIR, 'data'),
];
for (const dir of targets) {
  try {
    watch(dir, { recursive: true }, (event, file) => {
      if (file && !/(^|\/)\.DS_Store$/.test(file)) schedule(path.relative(repoRoot, path.join(dir, file)));
    });
  } catch (err) {
    console.warn(`[dev] cannot watch ${dir}: ${err.message}`);
  }
}
