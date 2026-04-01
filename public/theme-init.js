(function () {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.backgroundColor = "#0a0a0a";
        document.body.style.backgroundColor = "#0a0a0a";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.backgroundColor = "#ffffff";
        document.body.style.backgroundColor = "#ffffff";
      }
    } else {
      // Default to light theme if nothing is stored
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
      localStorage.setItem("theme", "light");
    }
  } catch (e) {
    // If localStorage fails, default to light
    document.documentElement.classList.remove("dark");
    document.documentElement.style.backgroundColor = "#ffffff";
    document.body.style.backgroundColor = "#ffffff";
  }
})();
