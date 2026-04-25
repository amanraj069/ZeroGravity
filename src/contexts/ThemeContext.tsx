"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to light
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to dark theme if nothing is stored
      setThemeState("dark");
      applyTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  // Apply theme to document
  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      // Manually update variables to force instant scrollbar update
      root.style.setProperty("--scrollbar-thumb", "rgba(75, 85, 99, 0.4)");
      root.style.setProperty(
        "--scrollbar-thumb-hover",
        "rgba(107, 114, 128, 0.6)",
      );
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      // Manually update variables to force instant scrollbar update
      root.style.setProperty("--scrollbar-thumb", "rgba(156, 163, 175, 0.3)");
      root.style.setProperty(
        "--scrollbar-thumb-hover",
        "rgba(156, 163, 175, 0.5)",
      );
    }

    // Force a repaint of the scrollbar
    const originalOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    root.offsetHeight;
    root.style.overflow = originalOverflow;
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Set theme directly
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Apply theme on change
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
