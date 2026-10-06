// Runs before first paint so the page never flashes the wrong theme. Dark is the brand default.
(function () {
  try {
    if (localStorage.getItem("rc.theme") === "light") document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
})();
