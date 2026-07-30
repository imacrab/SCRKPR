import { motion } from "framer-motion";
import { ChevronLeft, Handshake } from "lucide-react";
import { format } from "date-fns";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
import FluentEmoji from "./FluentEmoji";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import HistoryGameStats from "./HistoryGameStats";
import { TRANSITION_PANEL, SPRING_SNAPPY } from "@/lib/motion";

const safeFormat = (value, fmt) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};

// Detail view for a single past game. Rendered inside the History page,
// slides in from the right when a game card is tapped. The parent handles
// the enter/exit transition; this component owns its own header + content.
//
// Swipe-back: horizontal drag from the left edge closes the view (native iOS
// feel). Framer's drag handles the gesture; we snap-close past a threshold.
export default function HistoryGameDetail({ game, onBack }) {
  if (!game) return null;

  const isLowWin = isLowMode(game.win_mode);
  const modeMeta = getModeMeta(game.win_mode);
  const sorted = [...game.players].sort((a, b) =>
    isLowWin ? a.total - b.total : b.total - a.total
  );
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;

  // ScoreHistoryPanel keys by player.id — stored games use `name` as identity,
  // so synthesize a stable id from the index.
  const roundsPlayers = game.players.map((p, i) => ({
    id: `${i}-${p.name}`,
    name: p.name,
    color: p.color,
    emoji: p.emoji,
    scores: p.scores || [],
  }));

  return (
    <motion.div
      className="absolute inset-0 z-40 bg-background flex flex-col overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={TRANSITION_PANEL}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.6 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 || info.velocity.x > 500) onBack();
      }}
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Header — back arrow left, centered title */}
      <div
        className="pt-10 pb-2 px-3 flex items-center flex-shrink-0 relative"
        style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}
      >
        <button
          onClick={onBack}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-accent transition-colors flex-shrink-0"
          aria-label="Back to history"
        >
          <ChevronLeft size={26} strokeWidth={2.2} />
        </button>
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center pr-11">Game Details</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ paddingBottom: "calc(56px + 24px + env(safe-area-inset-bottom))" }}>
        {/* Winner hero — mirrors the "Latest Game" card on the main list */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING_SNAPPY, delay: 0.05 }}
          className="mb-4 rounded-3xl overflow-hidden relative border"
          style={{
            borderColor: `${winner.color}66`,
            background: `linear-gradient(155deg, ${winner.color}30 0%, ${winner.color}10 35%, hsl(var(--card)) 70%)`,
          }}
        >
          {!isTie && winner.emoji && (
            <div
              className="absolute pointer-events-none select-none"
              style={{ right: -18, top: -14, transform: "rotate(16deg)", opacity: 0.22 }}
              aria-hidden="true"
            >
              <FluentEmoji emoji={winner.emoji} size={130} />
            </div>
          )}

          <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-10">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Game</p>
            <p className="text-xs text-muted-foreground">{safeFormat(game.played_at, "MMM d · h:mm a")}</p>
          </div>

          <div className="px-5 pb-3 flex items-center gap-3 relative z-10">
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-white/25 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: isTie ? "hsl(var(--muted))" : winner.color }}
            >
              {isTie ? (
                <Handshake size={26} strokeWidth={2} className="text-muted-foreground" />
              ) : winner.emoji ? (
                <FluentEmoji emoji={winner.emoji} size={34} />
              ) : (
                <FluentEmoji emoji="🏆" size={30} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5 flex items-center gap-1">
                {!isTie && <FluentEmoji emoji="🏆" size={12} />}
                {isTie ? "It's a Tie" : "Winner"}
              </p>
              <h2 className="font-display text-2xl font-bold text-foreground leading-tight truncate">
                {isTie ? sorted.filter((p) => p.total === winner.total).map((p) => p.name).join(" & ") : winner.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                {winner.total} pts
                <span>·</span>
                <FluentEmoji emoji={modeMeta.emoji} size={12} />
                {modeMeta.label}
              </p>
            </div>
          </div>

          {/* Podium */}
          <div className="px-4 pb-4 space-y-1 relative z-10">
            {sorted.map((p, i) => (
              <motion.div
                key={`${i}-${p.name}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ backgroundColor: `${p.color}14` }}
              >
                <span className="text-xs text-muted-foreground w-5 text-right">
                  {!isTie && i === 0 ? <FluentEmoji emoji="🥇" size={16} />
                    : !isTie && i === 1 ? <FluentEmoji emoji="🥈" size={16} />
                    : !isTie && i === 2 ? <FluentEmoji emoji="🥉" size={16} />
                    : i + 1}
                </span>
                {p.emoji ? (
                  <span
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: p.color }}
                  >
                    <FluentEmoji emoji={p.emoji} size={16} />
                  </span>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-[7px]" style={{ backgroundColor: p.color }} />
                )}
                <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.total}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Game stats — recoverable meta from stored scores */}
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 pt-2 pb-2">
          Stats
        </p>
        <div className="mb-4">
          <HistoryGameStats game={game} />
        </div>

        {/* Round-by-round */}
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 pt-2 pb-2">
          Rounds
        </p>
        <ScoreHistoryPanel players={roundsPlayers} />
      </div>
    </motion.div>
  );
}