import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { format } from "date-fns";
import { getModeMeta } from "@/lib/gameModes";
import { ColorChip } from "./neo";
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
            className="mb-4 mr-[5px] bg-surface border-3 border-ink rounded-2xl shadow-neo-md overflow-hidden"
          >
            <div className="px-3.5 pt-3.5 pb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-extrabold truncate">{game.name}</p>
                <p className="font-mono mt-0.5 text-[11px] font-bold tracking-[0.08em] uppercase text-subtle">
                  {safeFormat(game.saved_at, "MMM d · h:mm a")} · {meta.label} · {rounds} {rounds === 1 ? "round" : "rounds"}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(game.id); }}
                aria-label="Delete saved game"
                className="neo-press flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface border-2.5 border-ink rounded-[10px] shadow-neo-sm"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="px-3.5 pb-3.5 flex flex-col gap-1.5">
              {players.map((p) => (
                <div key={p.id ?? p.name} className="h-9 flex items-center gap-2.5 px-2.5 bg-paper border-2 border-ink rounded-[10px]">
                  <ColorChip color={p.color} />
                  <span className="flex-1 truncate text-[15px] font-bold">{p.name}</span>
                  <span className="font-display text-base">{p.total}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onResume(game)}
              className="w-full h-12 flex items-center justify-center gap-2 bg-sun text-ink border-t-3 border-ink text-base font-extrabold active:bg-[#F5C62A]"
            >
              <Play size={18} strokeWidth={3} fill="currentColor" />
              Resume game
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
