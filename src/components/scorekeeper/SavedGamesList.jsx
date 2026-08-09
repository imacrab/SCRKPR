import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { format } from "date-fns";
import { getModeMeta } from "@/lib/gameModes";
import FluentEmoji from "./FluentEmoji";
import { SPRING_SNAPPY } from "@/lib/motion";

const safeFormat = (value, fmt) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};

// Cards for paused games in History → Saved. Each shows the user-given name,
// when it was saved, the mode, round count, and current standings — with an
// explicit Resume button (restores the full game) and a delete (X).
export default function SavedGamesList({ savedGames, onResume, onDelete }) {
  return (
    <AnimatePresence>
      {savedGames.map((game, idx) => {
        const meta = getModeMeta(game.win_mode);
        const players = (game.players || []).map((p) => ({
          ...p,
          total: (p.scores || []).reduce((s, n) => s + n, 0),
        }));
        const rounds = players.reduce((m, p) => Math.max(m, (p.scores || []).length), 0);
        const enterDelay = Math.min(idx, 8) * 0.06;

        return (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { ...SPRING_SNAPPY, delay: enterDelay } }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 rounded-2xl border border-border bg-card overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
          >
            {/* Header — name + meta, with delete */}
            <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-border">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-base text-foreground [font-family:'Geist',_sans-serif] font-semibold truncate">
                  {game.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{safeFormat(game.saved_at, "MMM d · h:mm a")}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <FluentEmoji emoji={meta.emoji} size={14} />
                    {meta.label}
                  </span>
                  <span>·</span>
                  <span>{rounds} {rounds === 1 ? "round" : "rounds"}</span>
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(game.id); }}
                aria-label="Delete saved game"
                className="flex-shrink-0 w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Standings */}
            <div className="px-4 py-3 space-y-1">
              {players.map((p) => (
                <div key={p.id ?? p.name} className="flex items-center gap-3 py-1.5">
                  {p.emoji
                    ? <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: p.color }}><FluentEmoji emoji={p.emoji} size={16} /></span>
                    : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-[7px]" style={{ backgroundColor: p.color }} />}
                  <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                  <span className="text-sm font-semibold" style={{ color: p.color }}>{p.total}</span>
                </div>
              ))}
            </div>

            {/* Resume */}
            <button
              onClick={() => onResume(game)}
              className="w-full h-11 flex items-center justify-center gap-2 border-t border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Play size={16} strokeWidth={2.5} />
              Resume game
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
