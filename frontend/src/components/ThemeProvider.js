"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Initialize from localStorage or system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
      }
    } catch {}
    setTheme("light");
  }, []);

  // Apply class to html element and persist
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Toggle dark class
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // Maintain a 'light' class for explicit light-mode overrides
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");

    // Apply requested light theme overrides
    const setVar = (name, value) => root.style.setProperty(name, value);
    const delVar = (name) => root.style.removeProperty(name);

    if (theme === "light") {
      // Clean modern light theme
      body.style.backgroundColor = "#F8FAFC";
      body.style.color = "#0F172A";

      // Token-based variables used across the UI system
      setVar("--background", "#F8FAFC");
      setVar("--foreground", "#0F172A");
      setVar("--card", "#ffffff");
      setVar("--card-foreground", "#0F172A");
      setVar("--popover", "#ffffff");
      setVar("--popover-foreground", "#0F172A");
      setVar("--secondary", "#f1f5f9");
      setVar("--secondary-foreground", "#0F172A");
      setVar("--muted", "#f1f5f9");
      setVar("--muted-foreground", "#64748B");
      setVar("--accent", "#f1f5f9");
      setVar("--accent-foreground", "#0F172A");
      setVar("--input-background", "#ffffff");
      setVar("--switch-background", "#cbd5e1");
      setVar("--border", "#E2E8F0");
    } else {
      // Clean modern dark theme
      body.style.backgroundColor = "#0B0F19";
      body.style.color = "#F8FAFC";

      setVar("--background", "#0B0F19");
      setVar("--foreground", "#F8FAFC");
      setVar("--card", "#111827");
      setVar("--card-foreground", "#F8FAFC");
      setVar("--popover", "#111827");
      setVar("--popover-foreground", "#F8FAFC");
      setVar("--secondary", "#1e293b");
      setVar("--secondary-foreground", "#F8FAFC");
      setVar("--muted", "#1e293b");
      setVar("--muted-foreground", "#94A3B8");
      setVar("--accent", "#1e293b");
      setVar("--accent-foreground", "#F8FAFC");
      setVar("--input-background", "#1e293b");
      setVar("--switch-background", "#334155");
      setVar("--border", "#1F2937");
    }

    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
