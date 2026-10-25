// Applies the saved or system theme before first paint (AC76). Classic script, loaded in <head>.
(function () {
  var stored = null;
  try {
    stored = window.localStorage.getItem('dd-theme');
  } catch (e) {
    stored = null;
  }
  var theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
