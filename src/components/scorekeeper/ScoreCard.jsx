import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { toNeoColor, twoToneBackground } from "@/lib/colors";
import { SPRING_SNAPPY } from "@/lib/motion";
import { AnimatedTotal, RoundTile, StatusTags, StreakTag, WinPips, editPressHandlers, scoreSubline } from "./PlayerColumn";

const QUICK_STEPS = [-1, 1, 5];

const quickButtonClass = "neo-press flex-1 min-w-0 h-14 flex items-center justify-center border-3 border-ink rounded-xl font-mono text-lg font-bold";

// Tablet scoreboard card: a big glanceable total for across-the-table reading,
// plus quick-step buttons so common scores skip the number pad.
export default function ScoreCard({ player, isLeader = false, isWorst = false, isHighlighted = false, streak = 0, winsNeeded = null, behind = 0, scoredThisRound = false, onAddScore, onQuickScore, onEditScore, onEditPlayer }) {
  const showLeader = isLeader && !isWorst;
  const total = player.scores.reduce((s, n) => s + n, 0);
  const isBestOf = winsNeeded !== null;
  const lastIdx = player.scores.length - 1;
  const lastScore = lastIdx >= 0 ? player.scores[lastIdx] : null;
  const color = toNeoColor(player.color);
  const background = player.cardStyle === "gradient" ? twoToneBackground(color) : color;
  const subline = scoreSubline({ lastScore, showLeader, behind, scoredThisRound });
  const stopPress = { onClick: (e) => e.stopPropagation(), onPointerDown: (e) => e.stopPropagation() };

  return (
    <div
      onClick={onAddScore}
      {...editPressHandlers(onEditPlayer)}
      role="button"
      aria-label={isBestOf ? `Add a win for ${player.name}` : `Add score for ${player.name}`}
      className="relative h-full flex flex-col p-5 text-ink border-3 border-ink rounded-[20px] cursor-pointer select-none transition-[box-shadow,transform] duration-150 active:translate-x-[2px] active:translate-y-[2px]"
      style={{
        background,
        boxShadow: isHighlighted ? "9px 9px 0 rgb(var(--ink))" : "7px 7px 0 rgb(var(--ink))",
        containerType: "size",
      }}
    >
      <StatusTags showLeader={showLeader} isWorst={isWorst} className="absolute -top-[15px] right-5" />

      <div className="flex items-center gap-3.5 min-w-0">
        <RoundTile icon={player.emoji} scoredThisRound={scoredThisRound} size={64} radius={14} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[26px] font-extrabold truncate leading-tight" title={player.name}>{player.name}</span>
            <StreakTag streak={streak} />
          </div>
          {isBestOf ? (
            <WinPips winsNeeded={winsNeeded} won={total} size="w-4 h-4" className="mt-1.5" />
          ) : (
            <div className="h-5 mt-0.5 flex items-center">
              {subline && (
                <motion.span
                  key={lastIdx}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SNAPPY}
                  onClick={(e) => { e.stopPropagation(); onEditScore?.(lastIdx); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="font-mono text-[13px] font-bold uppercase truncate cursor-pointer"
                >
                  {subline}
                </motion.span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sized off the card itself (height, and width per digit) so 2 or 12
          players, and 2- or 5-digit totals, all stay legible. */}
      <div
        className="flex-1 min-h-0 flex items-center overflow-hidden"
        style={{ fontSize: `clamp(40px, min(34cqh, calc(100cqw / ${String(total).length * 0.95})), 180px)` }}
      >
        <AnimatedTotal value={total} className="" />
      </div>

      {isBestOf ? (
        <div className="font-mono h-14 flex items-center text-sm font-bold tracking-[0.1em] uppercase">
          Tap to add a win
        </div>
      ) : (
        <div className="flex gap-2.5" {...stopPress}>
          {QUICK_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onQuickScore?.(step)}
              aria-label={`${step > 0 ? "Add" : "Subtract"} ${Math.abs(step)} for ${player.name}`}
              className={`${quickButtonClass} ${step > 0 ? "bg-ink text-white" : "bg-white text-ink"}`}
            >
              {step > 0 ? `+${step}` : `−${Math.abs(step)}`}
            </button>
          ))}
          <button
            type="button"
            onClick={onAddScore}
            aria-label={`Enter score for ${player.name}`}
            className={`${quickButtonClass} bg-white text-ink`}
          >
            <Calculator size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
