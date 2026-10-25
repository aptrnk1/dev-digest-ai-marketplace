// Card snippet ≤ 160 chars with matched terms in <mark> (AC26), built from text nodes only.
import { normalize } from '../lib/search.js';

export const SNIPPET_MAX = 160;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’ʼ]*/gu;

function findFirstMatch(text, matched) {
  for (const m of text.matchAll(WORD)) {
    if (matched.has(normalize(m[0]).replace(/'+$/, ''))) return m.index;
  }
  return -1;
}

/** Picks the source text and window for the snippet. */
export function snippetText(artifact, matchedTokens) {
  const matched = new Set(matchedTokens);
  const description = artifact.description ?? '';
  const body = artifact.body ?? '';
  let text = description;
  let start = 0;
  if (matched.size && findFirstMatch(description, matched) < 0) {
    const pos = findFirstMatch(body, matched);
    if (pos >= 0) {
      text = body;
      start = Math.max(0, pos - 40);
      if (start > 0) {
        const space = text.indexOf(' ', start);
        if (space > 0 && space < pos) start = space + 1;
      }
    }
  }
  if (!text) text = body;
  const prefix = start > 0 ? '…' : '';
  const room = SNIPPET_MAX - prefix.length;
  let out = text.slice(start);
  if (out.length > room) out = `${out.slice(0, room - 1).trimEnd()}…`;
  return prefix + out;
}

export function highlight(text, matchedTokens) {
  const matched = new Set(matchedTokens);
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    if (!matched.has(normalize(m[0]).replace(/'+$/, ''))) continue;
    if (m.index > last) frag.append(document.createTextNode(text.slice(last, m.index)));
    const mark = document.createElement('mark');
    mark.textContent = m[0];
    frag.append(mark);
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.append(document.createTextNode(text.slice(last)));
  return frag;
}
