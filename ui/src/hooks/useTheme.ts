import { useState, useEffect, useCallback } from "react";
import { getSystemTheme, getStoredTheme, storeTheme, isBrowser } from "../utils/cn";

export type Theme = "dark" | "light";

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    return getSystemTheme();
  });

  const resolvedTheme = isBrowser
    ? document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
    : theme;

  useEffect(() => {
    if (!isBrowser) return;

    const root = document.documentElement;

    if (!getStoredTheme()) {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!isBrowser) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const stored = getStoredTheme();
      if (!stored) {
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
        root.setAttribute("data-theme", systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
    if (isBrowser) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      root.setAttribute("data-theme", newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    toggleTheme,
    setTheme,
    resolvedTheme,
  };
}
