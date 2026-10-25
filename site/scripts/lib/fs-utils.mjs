import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export class BuildErrors extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.errors = errors;
  }
}

/** Collects `<repo path>: <reason>` errors so a build reports all of them at once (AC10). */
export class ErrorSink {
  constructor(root) {
    this.root = root;
    this.errors = [];
  }
  add(file, reason) {
    this.errors.push(`${this.rel(file)}: ${reason}`);
  }
  rel(file) {
    return path.relative(this.root, file).split(path.sep).join('/');
  }
  throwIfAny() {
    if (this.errors.length) throw new BuildErrors(this.errors);
  }
}

export function readJson(file, sink) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    sink.add(file, `invalid JSON (${err.message})`);
    return null;
  }
}

export const isFile = (p) => existsSync(p) && statSync(p).isFile();
export const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

export function listFiles(dir, { recursive = false, ext } = {}) {
  if (!isDir(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) out.push(...listFiles(full, { recursive, ext }));
    } else if (!ext || entry.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

export const toPosix = (p) => p.split(path.sep).join('/');
