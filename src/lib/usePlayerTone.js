import { useEffect, useState } from "react";

const STORAGE_KEY = "scorekeeper_player_tone";
const DEFAULT_TONE = "dark"; // dark backgrounds + white text (existing look)

export function usePlayerTone() {
  const [tone, setToneState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "light" || saved === "dark" ? saved : DEFAULT_TONE;
    } catch {
      return DEFAULT_TONE;
    }
  });

  const setTone = (next) => {
    setToneState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    window.dispatchEvent(new CustomEvent("playerToneChange", { detail: next }));
  };

  useEffect(() => {
    const handler = (e) => setToneState(e.detail);
    window.addEventListener("playerToneChange", handler);
    return () => window.removeEventListener("playerToneChange", handler);
  }, []);

  return [tone, setTone];
}