// Light/dark theme: applied before first paint; remembers the choice, else follows the OS.
(function () {
  var root = document.documentElement, KEY = 'calcgraph-theme';
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function system() { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function apply(t) { root.setAttribute('data-theme', t); }
  apply(stored() || system());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!stored()) apply(system());
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.theme-toggle')) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (err) {}
  });
})();
