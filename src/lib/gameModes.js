// All supported game modes with their UI metadata, scoring direction, and target score.
// direction: "high" | "low" | "bestof"  (drives sort/winner logic)
// targetScore: number | null            (when set, reaching it auto-ends the game)
// icon: string                          (Lucide id from @/lib/playerIcons)
export const GAME_MODES = {
  ginrummy: { label: "Gin Rummy",  icon: "spade",          direction: "low",    targetScore: 100 },
  hotdice:  { label: "Hot Dice",   icon: "dices",          direction: "high",   targetScore: 10000 },
  phase10:  { label: "Phase 10",   icon: "layers",         direction: "low",    targetScore: null },
  skipbo:   { label: "Skip-Bo",    icon: "square-stack",   direction: "high",   targetScore: 500 },
  swish:    { label: "Swish",      icon: "zap",            direction: "low",    targetScore: 500 },
  low:      { label: "Low Score",  icon: "arrow-big-down", direction: "low",    targetScore: null },
  high:     { label: "High Score", icon: "arrow-big-up",   direction: "high",   targetScore: null },
  bestof:   { label: "Best Of",    icon: "trophy",         direction: "bestof", targetScore: null },
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