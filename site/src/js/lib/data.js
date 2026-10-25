// Loads the build-time index from the same origin (AC50, AC54).
let pending = null;

export function loadIndex() {
  if (!pending) {
    pending = fetch('index.json', { cache: 'no-cache' })
      .then((res) => {
        if (res.status !== 200) throw new Error(`index.json: HTTP ${res.status}`);
        return res.json();
      })
      .then((index) => {
        if (!index || !Array.isArray(index.artifacts) || !Array.isArray(index.plugins)) throw new Error('index.json: bad shape');
        return index;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

const SKELETON_DELAY_MS = 300;

/**
 * Runs `onReady(index)`; shows `onLoading()` only if loading takes > 300 ms (AC49),
 * and `onError(retry)` on failure (AC50).
 */
export function withIndex({ onLoading, onReady, onError }) {
  const run = () => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) onLoading?.();
    }, SKELETON_DELAY_MS);
    loadIndex().then(
      (index) => {
        settled = true;
        clearTimeout(timer);
        onReady(index);
      },
      (err) => {
        settled = true;
        clearTimeout(timer);
        console.error(err);
        onError?.(run);
      },
    );
  };
  run();
}
