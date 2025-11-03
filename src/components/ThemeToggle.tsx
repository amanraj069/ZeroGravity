"use client";

import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ComponentType } from "react";

interface ClassicProps {
  duration: number;
  toggled: boolean;
  toggle: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Type assertion to work around React 19 type incompatibility with @theme-toggles/react
  const ClassicComponent = Classic as unknown as ComponentType<ClassicProps>;

  return (
    <ClassicComponent
      duration={750}
      toggled={isDark}
      toggle={toggleTheme}
      className="text-black dark:text-white"
      style={{ fontSize: "1.5rem" }}
    />
  );
}

