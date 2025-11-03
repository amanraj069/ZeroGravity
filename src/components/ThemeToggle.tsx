"use client";

import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Classic
      duration={750}
      toggled={isDark}
      toggle={toggleTheme}
      className="text-black dark:text-white"
      style={{ fontSize: "1.5rem" }}
    />
  );
}

