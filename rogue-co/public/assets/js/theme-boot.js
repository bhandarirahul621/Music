// Runs before first paint so the page never flashes the wrong theme.
(function () {
  try {
    var t = localStorage.getItem("rc.theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
