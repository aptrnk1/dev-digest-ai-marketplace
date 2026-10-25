import { h } from '../lib/dom.js';

const TOAST_MS = 1800;
let current = null;
let timer = null;

export function showToast(text) {
  current?.remove();
  clearTimeout(timer);
  current = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(current);
  timer = setTimeout(() => {
    current?.remove();
    current = null;
  }, TOAST_MS);
}
