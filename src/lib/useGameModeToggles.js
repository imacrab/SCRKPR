// Per-device toggles for which game modes appear in the Game Mode picker.
// Kept intentionally simple: a plain object of { modeId: boolean } persisted
// to localStorage, exposed via a tiny useSyncExternalStore-style hook so any
// component reading it stays in sync when the settings page flips a toggle.
import { useEffect, useState } from "react";

const STORAGE_KEY = "scrkpr_game_mode_toggles";

// Modes users can turn off. "high" / "low" / "bestof" are considered core and
// always visible — only optional/experimental modes live here.
export const OPTIONAL_MODES = [
  { id: "swish", label: "Swish", emoji: "⚡", description: "Race to 500 — lowest total wins." },
];

const DEFAULTS = OPTIONAL_MODES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});

function readToggles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeToggles(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  // Notify same-tab listeners (storage event only fires across tabs).
  window.dispatchEvent(new Event("scrkpr:game-mode-toggles"));
}

export function useGameModeToggles() {
  const [toggles, setToggles] = useState(readToggles);

  useEffect(() => {
    const sync = () => setToggles(readToggles());
    window.addEventListener("scrkpr:game-mode-toggles", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("scrkpr:game-mode-toggles", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = (id, enabled) => {
    const next = { ...readToggles(), [id]: !!enabled };
    writeToggles(next);
    setToggles(next);
  };

  return { toggles, setMode };
}

export function isModeEnabled(id) {
  // Non-optional modes are always enabled.
  if (!OPTIONAL_MODES.some((m) => m.id === id)) return true;
  return readToggles()[id] !== false;
}