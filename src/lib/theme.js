import { useEffect, useState } from "react";

// Keep this key and the "dark" class logic in sync with the inline bootstrap
// script in index.html, which applies the theme before first paint.
const STORAGE_KEY = "scrkpr_theme";
const CHANGE_EVENT = "scrkpr:theme-change";
const PAPER = { light: "#F4EFE3", dark: "#20242C" };

const systemQuery = () => window.matchMedia?.("(prefers-color-scheme: dark)");

export function getThemePreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(pref = getThemePreference()) {
  if (pref === "light" || pref === "dark") return pref;
  return systemQuery()?.matches ? "dark" : "light";
}

export function applyTheme(pref = getThemePreference()) {
  const theme = resolveTheme(pref);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.backgroundColor = PAPER[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PAPER[theme]);

  if (window.Capacitor?.isNativePlatform?.()) {
    import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light }))
      .catch(() => {});
  }
  return theme;
}

export function setThemePreference(pref) {
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  applyTheme(pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function initTheme() {
  applyTheme();
  systemQuery()?.addEventListener?.("change", () => {
    if (getThemePreference() === "system") {
      applyTheme("system");
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  });
}

export function useThemePreference() {
  const [pref, setPref] = useState(getThemePreference);
  useEffect(() => {
    const sync = () => setPref(getThemePreference());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);
  return [pref, setThemePreference];
}
