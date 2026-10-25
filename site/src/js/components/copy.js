// Copy buttons: "copied" label for 2 s + toast (AC40, AC41), manual fallback (AC42).
import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { showToast } from './toast.js';

const COPIED_MS = 2000;

async function writeClipboard(text) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
  await navigator.clipboard.writeText(text);
}

function showFallback(button, text) {
  const host = button.closest('[data-copy-host]') ?? button.parentElement;
  host.querySelector('.copy-fallback')?.remove();
  const id = `copy-fallback-${Math.random().toString(36).slice(2, 8)}`;
  const area = h('textarea', { id, readonly: true, rows: String(Math.max(1, text.split('\n').length)) });
  area.value = text;
  const box = h('div', { class: 'copy-fallback' }, h('label', { for: id, text: t('common.copyFailed') }), area);
  host.after(box);
  area.focus();
  area.select();
}

/** Wires a button to copy `getText()`. */
export function bindCopy(button, getText) {
  const label = button.textContent;
  let timer = null;
  button.addEventListener('click', async () => {
    const text = getText();
    try {
      await writeClipboard(text);
    } catch {
      showFallback(button, text);
      return;
    }
    clearTimeout(timer);
    button.textContent = t('common.copied');
    button.classList.add('is-copied');
    showToast(t('common.toastCopied'));
    timer = setTimeout(() => {
      button.textContent = label;
      button.classList.remove('is-copied');
    }, COPIED_MS);
  });
  return button;
}

/** Creates a copy button. */
export function copyButton(label, getText, className = 'btn btn-sm', ariaLabel = null) {
  return bindCopy(h('button', { type: 'button', class: className, text: label, title: ariaLabel }), getText);
}

/** Static pages: `<pre data-copy-source>` + `<button data-copy>` inside one container. */
export function bindStaticCopyButtons(root = document) {
  for (const button of root.querySelectorAll('[data-copy]')) {
    const source = button.parentElement.querySelector('[data-copy-source]');
    button.parentElement.setAttribute('data-copy-host', '');
    bindCopy(button, () => source.textContent);
  }
}
