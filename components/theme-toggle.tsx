"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const resolved = getStoredTheme() ?? getSystemTheme();
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  }, [theme]);

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="font-mono-display"
      onClick={toggle}
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        fontSize: '9px',
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-muted)',
        border: '1px solid var(--border-muted)',
        background: 'var(--bg-card)',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <span style={{ fontSize: '11px', lineHeight: 1 }}>
        {theme === "dark" ? "☀" : "☾"}
      </span>
      {theme === "dark" ? "LIGHT" : "DARK"}
    </button>
  );
}
