import { useState, useEffect, useCallback } from "react";

export type ThemeType = "light" | "dark" | "neon" | "sunset";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (["light", "dark", "neon", "sunset"].includes(stored || "")) return stored as ThemeType;
      return "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "neon", "sunset");
    if (theme !== "light") {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setThemeValue = useCallback((t: ThemeType) => setTheme(t), []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const order: ThemeType[] = ["light", "dark", "neon", "sunset"];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  return { theme, toggleTheme, setTheme: setThemeValue };
}
