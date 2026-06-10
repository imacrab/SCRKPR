import { TrendingUp, TrendingDown, Trophy, Spade, Heart, Sparkles } from "lucide-react";

// All supported game modes with their UI metadata, scoring direction, and target score.
// direction: "high" | "low" | "bestof" | "phases"  (drives sort/winner logic)
// targetScore: number | null            (when set, reaching it auto-ends the game)
export const GAME_MODES = {
  low:        { label: "Low Score",   Icon: TrendingDown, direction: "low",    targetScore: null },
  high:       { label: "High Score",  Icon: TrendingUp,   direction: "high",   targetScore: null },
  bestof:     { label: "Best Of",     Icon: Trophy,       direction: "bestof", targetScore: null },
  ginrummy:   { label: "Gin Rummy",   Icon: Spade,        direction: "high",   targetScore: 100 },
  fivecrowns: { label: "Five Crowns", Icon: Heart,        direction: "low",    targetScore: null },
  phase10:    { label: "Phase 10",    Icon: Sparkles,     direction: "phases", targetScore: null },
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
  return dir === "bestof" || dir === "phases";
}