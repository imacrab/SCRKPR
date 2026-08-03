// All supported game modes with their UI metadata, scoring direction, and target score.
// direction: "high" | "low" | "bestof"  (drives sort/winner logic)
// targetScore: number | null            (when set, reaching it auto-ends the game)
// emoji: string                         (rendered via FluentEmoji in the UI)
export const GAME_MODES = {
  ginrummy: { label: "Gin Rummy",  emoji: "🎴", direction: "low",    targetScore: 100 },
  hotdice:  { label: "Hot Dice",   emoji: "🎲", direction: "high",   targetScore: 10000 },
  phase10:  { label: "Phase 10",   emoji: "🃏", direction: "low",    targetScore: null },
  skipbo:   { label: "Skip-Bo",    emoji: "🔢", direction: "high",   targetScore: 500 },
  swish:    { label: "Swish",      emoji: "⚡", direction: "low",    targetScore: 500 },
  low:      { label: "Low Score",  emoji: "📉", direction: "low",    targetScore: null },
  high:     { label: "High Score", emoji: "📈", direction: "high",   targetScore: null },
  bestof:   { label: "Best Of",    emoji: "🏆", direction: "bestof", targetScore: null },
};

export function getModeMeta(winMode) {
  return GAME_MODES[winMode] || GAME_MODES.high;
}

// Whether the winner is the player with the lowest total
export function isLowMode(winMode) {
  return getModeMeta(winMode).direction === "low";
}

// Whether the mode uses circle indicators instead of numeric score input
export function isCircleMode(winMode) {
  const dir = getModeMeta(winMode).direction;
  return dir === "bestof";
}