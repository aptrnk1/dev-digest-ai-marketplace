import { readFileSync } from 'node:fs';
import path from 'node:path';
import { listFiles, toPosix } from './fs-utils.mjs';

const pluralRules = new Intl.PluralRules('uk');

export function loadDictionary(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Same lookup rules as the browser `t()` in src/js/lib/i18n.js. */
export function createT(dict) {
  return (key, params = {}) => {
    let value = dict[key];
    if (value === undefined) throw new Error(`unknown i18n key "${key}"`);
    if (typeof value === 'object') value = value[pluralRules.select(params.count ?? 0)] ?? value.other;
    return String(value).replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? String(params[name]) : m));
  };
}

const TEMPLATE_KEY = /\{\{t:([\w.-]+)\}\}/g;
const JS_KEY = /\bt\(\s*['"]([\w.-]+)['"]/g;
const JS_PREFIX = /\bt\(\s*`([\w.-]+)\$\{/g;

/**
 * Finds every i18n key used in templates and JS (AC90, AC91).
 * @returns {{ used: Map<string, string[]>, prefixes: Map<string, string[]> }} key → files
 */
export function collectKeys(srcDir) {
  const used = new Map();
  const prefixes = new Map();
  const add = (map, key, file) => map.set(key, [...(map.get(key) ?? []), file]);
  for (const file of listFiles(srcDir, { recursive: true })) {
    if (!/\.(html|js)$/.test(file)) continue;
    const rel = toPosix(path.relative(path.dirname(srcDir), file));
    const text = readFileSync(file, 'utf8');
    const pattern = file.endsWith('.html') ? TEMPLATE_KEY : JS_KEY;
    for (const m of text.matchAll(pattern)) add(used, m[1], rel);
    if (file.endsWith('.js')) for (const m of text.matchAll(JS_PREFIX)) add(prefixes, m[1], rel);
  }
  return { used, prefixes };
}

/** Returns `<file>: unknown i18n key "<key>"` errors. */
export function checkKeys(srcDir, dict) {
  const { used, prefixes } = collectKeys(srcDir);
  const errors = [];
  for (const [key, files] of used) {
    if (!(key in dict)) for (const f of new Set(files)) errors.push(`${f}: unknown i18n key "${key}"`);
  }
  for (const [prefix, files] of prefixes) {
    if (!Object.keys(dict).some((k) => k.startsWith(prefix))) {
      for (const f of new Set(files)) errors.push(`${f}: unknown i18n key prefix "${prefix}"`);
    }
  }
  return errors;
}
