import { parse } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Splits a Markdown file into YAML frontmatter data and body. */
export function parseFrontmatter(source) {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source, error: null };
  try {
    const data = parse(match[1]) ?? {};
    return { data: typeof data === 'object' ? data : {}, body: source.slice(match[0].length), error: null };
  } catch (err) {
    return { data: {}, body: source.slice(match[0].length), error: `invalid frontmatter (${err.message.split('\n')[0]})` };
  }
}

/** `allowed-tools: Read, Grep` and `[Read, Grep]` give the same list (AC79). */
export function toolList(value) {
  if (value == null) return null;
  const items = Array.isArray(value) ? value : String(value).split(',');
  const list = items.map((s) => String(s).trim()).filter(Boolean);
  return list.length ? list : null;
}
