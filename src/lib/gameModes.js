import { TrendingUp, TrendingDown, Trophy, Spade, Zap } from "lucide-react";

// All supported game modes with their UI metadata, scoring direction, and target score.
// direction: "high" | "low" | "bestof"  (drives sort/winner logic)
// targetScore: number | null            (when set, reaching it auto-ends the game)
export const GAME_MODES = {
  ginrummy: { label: "Gin Rummy",  Icon: Spade,        direction: "high",   targetScore: 100 },
  swish:    { label: "Swish",      Icon: Zap,          direction: "high",   targetScore: 500 },
  low:      { label: "Low Score",  Icon: TrendingDown, direction: "low",    targetScore: null },
  high:     { label: "High Score", Icon: TrendingUp,   direction: "high",   targetScore: null },
  bestof:   { label: "Best Of",    Icon: Trophy,       direction: "bestof", targetScore: null },
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