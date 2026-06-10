import { TrendingUp, TrendingDown, Trophy, Spade, Club, Diamond, Heart, Sparkles, Sliders } from "lucide-react";

// All supported game modes with their UI metadata, scoring direction, and target score.
// direction: "high" | "low" | "bestof"  (drives sort/winner logic)
// targetScore: number | null            (when set, reaching it auto-ends the game)
export const GAME_MODES = {
  low:        { label: "Low Score",   Icon: TrendingDown, direction: "low",    targetScore: null },
  high:       { label: "High Score",  Icon: TrendingUp,   direction: "high",   targetScore: null },
  bestof:     { label: "Best Of",     Icon: Trophy,       direction: "bestof", targetScore: null },
  gin:        { label: "Gin",         Icon: Spade,        direction: "high",   targetScore: 100 },
  rummy:      { label: "Rummy",       Icon: Club,         direction: "high",   targetScore: 500 },
  skipbo:     { label: "Skip-Bo",     Icon: Diamond,      direction: "high",   targetScore: 500 },
  fivecrowns: { label: "Five Crowns", Icon: Heart,        direction: "low",    targetScore: null },
  phase10:    { label: "Phase 10",    Icon: Sparkles,     direction: "low",    targetScore: null },
  custom:     { label: "Custom",      Icon: Sliders,      direction: "high",   targetScore: null },
};

export function getModeMeta(winMode) {
  return GAME_MODES[winMode] || GAME_MODES.high;
}

// Whether the winner is the player with the lowest total
export function isLowMode(winMode) {
  return getModeMeta(winMode).direction === "low";
}