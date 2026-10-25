import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildIndex } from '../../scripts/lib/index-builder.mjs';
import { BuildErrors } from '../../scripts/lib/fs-utils.mjs';
import { FIXTURE_ROOT, FIXTURE_SYNONYMS, SHA, buildFixture, searchConfig, t } from '../helpers/fixtures.mjs';

const { index, files } = buildFixture();
const byId = new Map(index.artifacts.map((a) => [a.id, a]));
const plugin = (name) => index.plugins.find((p) => p.name === name);

test('one artifact per plugin, skill, agent, command, hook (event+matcher) and MCP server (AC5)', () => {
  const expected = [
    'plugin:alpha-tools', 'skill:alpha-tools/refactor', 'skill:alpha-tools/code-review', 'command:alpha-tools/migrate',
    'agent:alpha-tools/review:security', 'hook:alpha-tools/PostToolUse Write',
    'plugin:beta-review', 'skill:beta-review/xss-skill', 'skill:beta-review/zebra-skill', 'agent:beta-review/striped',
    'plugin:gamma-mcp', 'hook:gamma-mcp/SessionStart', 'mcp:gamma-mcp/local-db', 'mcp:gamma-mcp/remote-api',
    'plugin:hello', 'skill:hello/hello', 'plugin:external-plugin',
  ];
  assert.deepEqual([...byId.keys()].sort(), expected.sort());
});

test('every artifact has the required fields (AC6)', () => {
  for (const a of index.artifacts) {
    for (const field of ['type', 'name', 'plugin', 'description', 'body', 'tags']) assert.ok(field in a, `${a.id} lacks ${field}`);
    assert.ok('path' in a && 'author' in a);
  }
  assert.match(byId.get('mcp:gamma-mcp/local-db').body, /node server\.js --readonly/);
});

test('marketplace entry wins for display fields, plugin.json for version (AC7)', () => {
  assert.equal(plugin('beta-review').displayName, 'Beta Review');
  assert.equal(plugin('alpha-tools').displayName, 'Alpha Tools');
  assert.equal(plugin('alpha-tools').category, 'engineering');
  assert.equal(plugin('alpha-tools').version, '1.2.3');
  assert.equal(plugin('alpha-tools').author, 'Alpha Team');
  assert.equal(plugin('beta-review').author, 'Beta Team');
});

test('tags = lowercase union of entry tags and keywords, inherited by components (AC8)', () => {
  assert.deepEqual(plugin('alpha-tools').tags, ['refactoring', 'code-quality']);
  assert.deepEqual(byId.get('skill:alpha-tools/refactor').tags, ['refactoring', 'code-quality']);
});

test('build metadata has UTC time and the full SHA (AC11)', () => {
  assert.equal(index.build.time, '2026-10-25T12:34:00Z');
  assert.equal(index.build.sha, SHA);
  assert.equal(index.build.marketplace, 'fixture-market');
});

test('transparency data per plugin (AC12) without env/header values (AC13)', () => {
  const g = plugin('gamma-mcp').transparency;
  assert.deepEqual(g.mcp.map((s) => s.name), ['local-db', 'remote-api']);
  assert.deepEqual(g.mcp[0].args, ['server.js', '--readonly']);
  assert.deepEqual(g.mcp[0].envNames, ['DB_PASSWORD']);
  assert.equal(g.mcp[1].url, 'https://api.example.com/mcp');
  assert.deepEqual(g.mcp[1].headerNames, ['Authorization']);
  assert.deepEqual(g.lsp[0].envNames, ['LSP_KEY']);
  assert.deepEqual(g.monitors, [{ name: 'db-health', command: 'node health.js' }]);
  assert.deepEqual(plugin('alpha-tools').transparency.bin, ['alpha-cli']);
  assert.deepEqual(plugin('alpha-tools').risks, ['hooks', 'bin']);
  assert.deepEqual(plugin('gamma-mcp').risks, ['hooks', 'mcp', 'lsp', 'monitors']);
  const all = JSON.stringify(index) + files.map((f) => f.content ?? '').join('');
  assert.ok(!all.includes('SECRET-MARKER-123'));
});

test('invocations for skill, command and nested agent (AC41)', () => {
  assert.equal(byId.get('skill:hello/hello').invocation, '/hello:hello');
  assert.equal(byId.get('command:alpha-tools/migrate').invocation, '/alpha-tools:migrate');
  assert.equal(byId.get('agent:alpha-tools/review:security').invocation, '@agent-alpha-tools:review:security');
  assert.equal(byId.get('hook:gamma-mcp/SessionStart').invocation, null);
});

test('tools from frontmatter: comma string and array are equal (AC79)', () => {
  assert.deepEqual(byId.get('skill:alpha-tools/refactor').tools, ['Read', 'Edit', 'Grep']);
  assert.deepEqual(byId.get('skill:alpha-tools/code-review').tools, ['Read', 'Grep']);
  const agent = byId.get('agent:alpha-tools/review:security');
  assert.deepEqual(agent.tools, ['Read', 'Grep', 'Glob']);
  assert.deepEqual(agent.disallowedTools, ['Bash']);
  assert.equal(agent.model, 'sonnet');
  assert.equal(byId.get('agent:beta-review/striped').tools, null);
});

test('markdown bodies are rendered to separate files (AC82)', () => {
  const skill = byId.get('skill:alpha-tools/refactor');
  const file = files.find((f) => f.out === skill.html);
  assert.ok(file);
  assert.match(file.content, /<h2>Refactor<\/h2>/);
  assert.match(file.content, /blob\/0123456789abcdef0123456789abcdef01234567\/plugins\/alpha-tools\/extra-skills\/code-review\/SKILL\.md/);
});

test('dependencies are normalized to {name, marketplace, version} (AC88)', () => {
  assert.deepEqual(plugin('alpha-tools').dependencies, [
    { name: 'beta-review', marketplace: 'fixture-market', version: null },
    { name: 'gamma-mcp', marketplace: 'fixture-market', version: '^1.0.0' },
    { name: 'outside-tool', marketplace: 'other-market', version: null },
  ]);
});

test('a plugin hosted outside the repo indexes only its entry (AC47)', () => {
  const ext = plugin('external-plugin');
  assert.equal(ext.external, true);
  assert.equal(ext.version, '2.0.0');
  assert.equal(index.artifacts.filter((a) => a.plugin === 'external-plugin').length, 1);
});

function withBrokenCopy(mutate) {
  const dir = mkdtempSync(path.join(tmpdir(), 'catalog-broken-'));
  cpSync(FIXTURE_ROOT, dir, { recursive: true });
  mutate(dir);
  try {
    buildIndex({
      repoRoot: dir,
      marketplaceFile: path.join(dir, '.claude-plugin', 'marketplace.json'),
      searchConfig,
      synonymsFile: FIXTURE_SYNONYMS,
      repo: 'o/r',
      sha: SHA,
      buildTime: '2026-10-25T12:34:00Z',
      t,
    });
    return null;
  } catch (err) {
    return err;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('broken JSON and missing frontmatter fields fail with `<path>: <reason>` lines (AC10)', () => {
  const err = withBrokenCopy((dir) => {
    writeFileSync(path.join(dir, 'plugins/gamma-mcp/.mcp.json'), '{ not json');
    writeFileSync(path.join(dir, 'plugins/hello/skills/hello/SKILL.md'), '---\nname: hello\n---\nbody');
    writeFileSync(path.join(dir, 'plugins/beta-review/agents/striped.md'), '---\ndescription: x\n---\nbody');
  });
  assert.ok(err instanceof BuildErrors);
  assert.ok(err.errors.some((l) => l.startsWith('plugins/gamma-mcp/.mcp.json: invalid JSON')));
  assert.ok(err.errors.includes('plugins/hello/skills/hello/SKILL.md: frontmatter is missing "description"'));
  assert.ok(err.errors.includes('plugins/beta-review/agents/striped.md: frontmatter is missing "name"'));
});

test('a broken marketplace.json fails the build (AC10)', () => {
  const err = withBrokenCopy((dir) => writeFileSync(path.join(dir, '.claude-plugin/marketplace.json'), '{'));
  assert.ok(err instanceof BuildErrors);
  assert.match(err.errors[0], /^\.claude-plugin\/marketplace\.json: invalid JSON/);
});

test('hooks and MCP referenced twice are read once; same event+matcher groups merge (AC5, EC19)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'catalog-dupe-'));
  cpSync(FIXTURE_ROOT, dir, { recursive: true });
  const gamma = path.join(dir, 'plugins/gamma-mcp');
  writeFileSync(
    path.join(gamma, 'hooks/hooks.json'),
    JSON.stringify({ hooks: { PreToolUse: [
      { matcher: 'Bash', hooks: [{ type: 'command', command: 'a' }] },
      { matcher: 'Bash', hooks: [{ type: 'command', command: 'b' }] },
    ] } }),
  );
  writeFileSync(
    path.join(gamma, '.claude-plugin/plugin.json'),
    JSON.stringify({ name: 'gamma-mcp', version: '1.0.1', hooks: './hooks/hooks.json', mcpServers: './.mcp.json' }),
  );
  try {
    const { index: idx } = buildIndex({
      repoRoot: dir, marketplaceFile: path.join(dir, '.claude-plugin/marketplace.json'), searchConfig,
      synonymsFile: FIXTURE_SYNONYMS, repo: 'o/r', sha: SHA, buildTime: '2026-10-25T12:34:00Z', t,
    });
    const hooks = idx.artifacts.filter((a) => a.plugin === 'gamma-mcp' && a.type === 'hook');
    assert.equal(hooks.length, 1);
    assert.deepEqual(hooks[0].hook.handlers.map((h) => h.command), ['a', 'b']);
    assert.equal(idx.artifacts.filter((a) => a.plugin === 'gamma-mcp' && a.type === 'mcp').length, 2);
    const ids = idx.artifacts.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length, 'artifact ids are unique');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
