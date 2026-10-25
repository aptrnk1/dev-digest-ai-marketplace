import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ErrorSink, isDir, isFile, listFiles, readJson, toPosix } from './fs-utils.mjs';
import { parseFrontmatter, toolList } from './frontmatter.mjs';
import { markdownToText, renderMarkdown } from './markdown.mjs';

export const INDEX_VERSION = 1;
// Keeps index.json small at 2 000 artifacts (NFR2); the full body is in the rendered HTML.
export const MAX_BODY_CHARS = 4000;

const lower = (list) => [...new Set((list ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const slug = (s) => String(s).replace(/[^a-zA-Z0-9._-]+/g, '_');

/**
 * Reads the marketplace and every local plugin, returning the search index and
 * the content files (rendered Markdown, copied images) the site needs.
 *
 * @param {object} opts
 * @param {string} opts.repoRoot
 * @param {string} opts.marketplaceFile
 * @param {object} opts.searchConfig  { stopwords, typeWords }
 * @param {string} opts.synonymsFile
 * @param {string} opts.repo          "<owner>/<repo>"
 * @param {string} opts.sha           full commit SHA
 * @param {string} opts.buildTime     ISO 8601 UTC
 * @param {(key: string, params?: object) => string} opts.t  i18n lookup for build-time strings
 */
export function buildIndex(opts) {
  const sink = new ErrorSink(opts.repoRoot);
  const files = []; // { out, content } | { out, copyFrom }
  const copied = new Map();

  const marketplace = readJson(opts.marketplaceFile, sink);
  const synonyms = readJson(opts.synonymsFile, sink) ?? {};
  sink.throwIfAny();

  const marketplaceName = marketplace.name;
  const blobBase = `https://github.com/${opts.repo}/blob/${opts.sha}`;
  const treeBase = `https://github.com/${opts.repo}/tree/${opts.sha}`;
  const marketplaceDir = path.dirname(path.dirname(opts.marketplaceFile));
  const pluginRootPrefix = marketplace.metadata?.pluginRoot;

  const plugins = [];
  const artifacts = [];

  for (const entry of marketplace.plugins ?? []) {
    const plugin = readPlugin(entry);
    if (!plugin) continue;
    plugins.push(plugin.meta);
    artifacts.push(...plugin.artifacts);
  }

  sink.throwIfAny();

  plugins.sort((a, b) => a.displayName.localeCompare(b.displayName, 'uk', { sensitivity: 'base' }));

  return {
    index: {
      version: INDEX_VERSION,
      build: { time: opts.buildTime, sha: opts.sha, repo: opts.repo, marketplace: marketplaceName },
      search: { stopwords: opts.searchConfig.stopwords, typeWords: opts.searchConfig.typeWords, synonyms },
      plugins,
      artifacts,
    },
    files,
  };

  // ---------------------------------------------------------------------------

  function localSource(source) {
    if (typeof source !== 'string') return null;
    if (source.startsWith('./') || source.startsWith('../')) return path.resolve(marketplaceDir, source);
    if (pluginRootPrefix) return path.resolve(marketplaceDir, pluginRootPrefix, source);
    return null;
  }

  function md(file, pluginRoot, markdown) {
    return renderMarkdown(markdown, {
      file,
      repoRoot: opts.repoRoot,
      pluginRoot,
      blobBase,
      externalImageLabel: (alt) => (alt ? opts.t('md.externalImage', { alt }) : opts.t('md.externalImageNoAlt')),
      copyImage: (abs) => {
        if (!copied.has(abs)) {
          const out = `content/_assets/${toPosix(path.relative(opts.repoRoot, abs))}`;
          copied.set(abs, out);
          files.push({ out, copyFrom: abs });
        }
        return copied.get(abs);
      },
    });
  }

  function readPlugin(entry) {
    const name = entry.name;
    const root = localSource(entry.source);
    const tagsFromEntry = lower([...asArray(entry.tags), ...asArray(entry.keywords)]);

    if (!root) {
      // Hosted outside this repo: only the marketplace entry is indexed (AC47).
      const meta = {
        name,
        displayName: entry.displayName ?? name,
        description: entry.description ?? '',
        version: entry.version ?? null,
        category: entry.category ?? null,
        tags: tagsFromEntry,
        author: entry.author?.name ?? null,
        license: entry.license ?? null,
        path: null,
        githubUrl: null,
        external: true,
        readme: null,
        counts: {},
        transparency: null,
        risks: [],
        dependencies: [],
      };
      return { meta, artifacts: [pluginArtifact(meta, '')] };
    }

    const manifestFile = path.join(root, '.claude-plugin', 'plugin.json');
    const manifest = isFile(manifestFile) ? readJson(manifestFile, sink) ?? {} : {};
    const relRoot = toPosix(path.relative(opts.repoRoot, root));

    const meta = {
      name,
      displayName: entry.displayName ?? manifest.displayName ?? name,
      description: entry.description ?? manifest.description ?? '',
      version: manifest.version ?? entry.version ?? null,
      category: entry.category ?? manifest.category ?? null,
      tags: lower([...tagsFromEntry, ...asArray(manifest.keywords)]),
      author: entry.author?.name ?? manifest.author?.name ?? null,
      license: manifest.license ?? entry.license ?? null,
      path: relRoot,
      githubUrl: `${treeBase}/${relRoot}`,
      external: false,
      readme: null,
      counts: {},
      transparency: null,
      risks: [],
      dependencies: normalizeDependencies(manifest.dependencies),
    };

    let readmeText = '';
    const readmeFile = path.join(root, 'README.md');
    if (isFile(readmeFile)) {
      const source = readFileSync(readmeFile, 'utf8');
      readmeText = markdownToText(source);
      const out = `content/${slug(name)}/README.html`;
      files.push({ out, content: md(readmeFile, root, source) });
      meta.readme = out;
    }

    const components = [
      ...readSkills(root, manifest, meta),
      ...readCommands(root, manifest, meta),
      ...readAgents(root, manifest, meta),
    ];
    const transparency = readTransparency(root, manifest, meta);
    components.push(...transparency.artifacts);
    meta.transparency = transparency.data;
    meta.risks = riskList(transparency.data);
    for (const c of components) meta.counts[c.type] = (meta.counts[c.type] ?? 0) + 1;

    return { meta, artifacts: [pluginArtifact(meta, readmeText), ...components] };
  }

  function normalizeDependencies(deps) {
    return asArray(deps)
      .map((d) => {
        if (typeof d === 'string') {
          const [depName, depMarket] = d.split('@');
          return { name: depName, marketplace: depMarket || marketplaceName, version: null };
        }
        if (d && typeof d === 'object' && d.name) {
          return { name: d.name, marketplace: d.marketplace || marketplaceName, version: d.version ?? null };
        }
        return null;
      })
      .filter(Boolean);
  }

  function pluginArtifact(meta, body) {
    return {
      id: `plugin:${meta.name}`,
      type: 'plugin',
      name: meta.name,
      displayName: meta.displayName,
      plugin: meta.name,
      description: meta.description,
      body: body.slice(0, MAX_BODY_CHARS),
      path: meta.path,
      tags: meta.tags,
      author: meta.author,
      category: meta.category,
      version: meta.version,
      invocation: null,
    };
  }

  function baseComponent(meta, type, name, file, extra = {}) {
    return {
      id: `${type}:${meta.name}/${name}`,
      type,
      name,
      displayName: name,
      plugin: meta.name,
      description: '',
      body: '',
      path: file ? toPosix(path.relative(opts.repoRoot, file)) : meta.path,
      githubUrl: file ? `${blobBase}/${toPosix(path.relative(opts.repoRoot, file))}` : meta.githubUrl,
      tags: meta.tags,
      author: meta.author,
      category: meta.category,
      version: meta.version,
      invocation: null,
      html: null,
      ...extra,
    };
  }

  function markdownComponent(meta, root, type, name, file, data, body) {
    const component = baseComponent(meta, type, name, file, {
      description: typeof data.description === 'string' ? data.description.trim() : '',
      body: markdownToText(body).slice(0, MAX_BODY_CHARS),
    });
    if (body.trim()) {
      const out = `content/${slug(meta.name)}/${type}/${slug(name)}.html`;
      files.push({ out, content: md(file, root, body) });
      component.html = out;
    }
    return component;
  }

  function readMarkdown(file, requireFields) {
    const source = readFileSync(file, 'utf8');
    const { data, body, error } = parseFrontmatter(source);
    if (error) sink.add(file, error);
    for (const field of requireFields) {
      if (typeof data[field] !== 'string' || !data[field].trim()) sink.add(file, `frontmatter is missing "${field}"`);
    }
    return { data, body };
  }

  function resolvePaths(root, value) {
    return asArray(value).map((p) => path.resolve(root, p));
  }

  function readSkills(root, manifest, meta) {
    // `skills` in plugin.json adds to the default location (R2).
    const dirs = [path.join(root, 'skills'), ...resolvePaths(root, manifest.skills)];
    const skillFiles = [];
    for (const dir of dirs) {
      if (isFile(path.join(dir, 'SKILL.md'))) skillFiles.push(path.join(dir, 'SKILL.md'));
      else for (const sub of childDirs(dir)) {
        if (isFile(path.join(sub, 'SKILL.md'))) skillFiles.push(path.join(sub, 'SKILL.md'));
      }
    }
    return [...new Set(skillFiles)].map((file) => {
      const { data, body } = readMarkdown(file, ['name', 'description']);
      const name = String(data.name ?? path.basename(path.dirname(file)));
      const c = markdownComponent(meta, root, 'skill', name, file, data, body);
      c.invocation = `/${meta.name}:${name}`;
      c.tools = toolList(data['allowed-tools']);
      return c;
    });
  }

  function childDirs(dir) {
    if (!isDir(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(dir, e.name))
      .sort();
  }

  function readCommands(root, manifest, meta) {
    // `commands` in plugin.json replaces the default location (R2).
    const sources = manifest.commands ? resolvePaths(root, manifest.commands) : [path.join(root, 'commands')];
    const commandFiles = sources.flatMap((p) => (isFile(p) ? [p] : listFiles(p, { ext: '.md' })));
    return commandFiles.map((file) => {
      const { data, body } = readMarkdown(file, []);
      const name = path.basename(file, '.md');
      const c = markdownComponent(meta, root, 'command', name, file, data, body);
      c.invocation = `/${meta.name}:${name}`;
      c.tools = toolList(data['allowed-tools']);
      return c;
    });
  }

  function readAgents(root, manifest, meta) {
    // `agents` in plugin.json replaces the default location (R2).
    const sources = manifest.agents ? resolvePaths(root, manifest.agents) : [path.join(root, 'agents')];
    const agents = [];
    for (const src of sources) {
      const agentFiles = isFile(src) ? [src] : listFiles(src, { recursive: true, ext: '.md' });
      for (const file of agentFiles) {
        const { data, body } = readMarkdown(file, ['name', 'description']);
        const base = isFile(src) ? path.dirname(src) : src;
        const dirs = toPosix(path.relative(base, path.dirname(file))).split('/').filter(Boolean);
        const name = [...dirs, String(data.name ?? path.basename(file, '.md'))].join(':');
        const c = markdownComponent(meta, root, 'agent', name, file, data, body);
        c.displayName = String(data.name ?? name);
        c.invocation = `@agent-${meta.name}:${name}`;
        c.tools = toolList(data.tools);
        c.disallowedTools = toolList(data.disallowedTools);
        c.model = data.model ? String(data.model) : null;
        agents.push(c);
      }
    }
    return agents;
  }

  // --- Things the plugin runs on the user's machine (AC12, AC13) -------------

  function readConfigs(root, defaultFile, inline, unwrapKey) {
    // Returns [{ file, map }] from the default file plus plugin.json paths / inline objects (merged).
    // A file referenced both by default and from plugin.json is read once.
    const out = [];
    const seen = new Set();
    const load = (file) => {
      if (seen.has(file)) return;
      seen.add(file);
      const json = readJson(file, sink);
      if (json) out.push({ file, map: (unwrapKey && json[unwrapKey]) || json });
    };
    if (isFile(path.join(root, defaultFile))) load(path.join(root, defaultFile));
    for (const item of asArray(inline)) {
      if (typeof item === 'string') {
        const file = path.resolve(root, item);
        if (isFile(file)) load(file);
        else sink.add(file, 'file referenced from plugin.json does not exist');
      } else if (item && typeof item === 'object') {
        out.push({ file: path.join(root, '.claude-plugin', 'plugin.json'), map: (unwrapKey && item[unwrapKey]) || item });
      }
    }
    return out;
  }

  function names(obj) {
    return obj && typeof obj === 'object' ? Object.keys(obj).sort() : [];
  }

  function readTransparency(root, manifest, meta) {
    const data = { hooks: [], mcp: [], lsp: [], monitors: [], bin: [] };
    const artifacts = [];

    // One artifact per event + matcher pair; handlers from every source are merged (AC5, EC19).
    const hookGroups = new Map();
    for (const { file, map } of readConfigs(root, 'hooks/hooks.json', manifest.hooks, 'hooks')) {
      for (const [event, groups] of Object.entries(map ?? {})) {
        for (const group of asArray(groups)) {
          const matcher = group.matcher || null;
          const key = `${event}\u0000${matcher ?? ''}`;
          if (!hookGroups.has(key)) hookGroups.set(key, { file, hook: { event, matcher, handlers: [] } });
          hookGroups.get(key).hook.handlers.push(
            ...asArray(group.hooks).map((h) => ({
              type: h.type ?? 'command',
              command: h.command ?? null,
              args: Array.isArray(h.args) ? h.args : null,
              url: h.url ?? null,
              envNames: names(h.env),
              headerNames: names(h.headers),
            })),
          );
        }
      }
    }
    for (const { file, hook } of hookGroups.values()) {
      data.hooks.push(hook);
      const { event, matcher, handlers } = hook;
      artifacts.push(
        baseComponent(meta, 'hook', matcher ? `${event} ${matcher}` : event, file, {
          displayName: matcher ? `${event} · ${matcher}` : event,
          description: '',
          body: handlers.map((h) => [h.command, ...(h.args ?? []), h.url].filter(Boolean).join(' ')).join('\n'),
          hook,
        }),
      );
    }

    const seenMcp = new Set();
    for (const { file, map } of readConfigs(root, '.mcp.json', manifest.mcpServers, 'mcpServers')) {
      for (const [name, cfg] of Object.entries(map ?? {})) {
        if (seenMcp.has(name)) continue;
        seenMcp.add(name);
        const remote = Boolean(cfg.url);
        const server = {
          name,
          transport: cfg.type ?? (remote ? 'http' : 'stdio'),
          command: remote ? null : cfg.command ?? null,
          args: remote ? null : cfg.args ?? [],
          url: remote ? cfg.url : null,
          envNames: names(cfg.env),
          headerNames: names(cfg.headers),
        };
        data.mcp.push(server);
        artifacts.push(
          baseComponent(meta, 'mcp', name, file, {
            description: cfg.description ?? '',
            body: remote ? server.url : [server.command, ...server.args].filter(Boolean).join(' '),
            mcp: server,
          }),
        );
      }
    }

    for (const { map } of readConfigs(root, '.lsp.json', manifest.lspServers, 'lspServers')) {
      for (const [name, cfg] of Object.entries(map ?? {})) {
        data.lsp.push({ name, command: cfg.command ?? null, args: cfg.args ?? [], envNames: names(cfg.env) });
      }
    }

    for (const { map } of readConfigs(root, 'monitors/monitors.json', manifest.monitors, 'monitors')) {
      const list = Array.isArray(map) ? map : Object.entries(map ?? {}).map(([name, cfg]) => ({ name, ...cfg }));
      for (const m of list) data.monitors.push({ name: m.name ?? null, command: m.command ?? null });
    }

    data.bin = listFiles(path.join(root, 'bin')).map((f) => path.basename(f));
    return { data, artifacts };
  }

  function riskList(t) {
    const risks = [];
    if (t.hooks.length) risks.push('hooks');
    if (t.mcp.length) risks.push('mcp');
    if (t.lsp.length) risks.push('lsp');
    if (t.monitors.length) risks.push('monitors');
    if (t.bin.length) risks.push('bin');
    return risks;
  }
}
