"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextValue {
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ dark: false, setDark: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("jynx-theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("jynx-theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Sync on mount (handles SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("jynx-theme") === "dark";
    if (stored !== dark) setDark(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
