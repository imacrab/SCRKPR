import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown } from "lucide-react";
import FluentEmoji from "./FluentEmoji";
import { TRANSITION_FADE, TRANSITION_PANEL } from "@/lib/motion";

export default function ScoreHistoryPanel({ players }) {
  const [open, setOpen] = useState(false);

  const maxRounds = Math.max(0, ...players.map((p) => p.scores.length));
  const hasAnyScores = maxRounds > 0;

  if (!hasAnyScores) return null;

  return (
    <div className="px-2 pb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <History size={14} strokeWidth={2} />
        <span>{open ? "Hide" : "Show"} Score History</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={TRANSITION_FADE}>
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION_PANEL}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card/50 mt-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground sticky left-0 bg-card/80 backdrop-blur-sm">
                        Round
                      </th>
                      {players.map((p) => (
                        <th key={p.id} className="px-3 py-2 text-center font-medium">
                          {p.emoji ? (
                            <FluentEmoji emoji={p.emoji} size={20} />
                          ) : (
                            <span
                              className="inline-block w-4 h-4 rounded-full"
                              style={{ backgroundColor: p.color }}
                              aria-label={p.name}
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxRounds }).map((_, roundIdx) => (
                      <tr key={roundIdx} className="border-b border-border/50 last:border-0">
                        <td className="text-left px-3 py-2 text-muted-foreground sticky left-0 bg-card/80 backdrop-blur-sm">
                          {roundIdx + 1}
                        </td>
                        {players.map((p) => {
                          const score = p.scores[roundIdx];
                          return (
                            <td key={p.id} className="px-3 py-2 text-center font-medium text-foreground">
                              {score === undefined ? <span className="text-muted-foreground">—</span> : score}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-muted/30">
                      <td className="text-left px-3 py-2 font-semibold sticky left-0 bg-muted/60 backdrop-blur-sm">
                        Total
                      </td>
                      {players.map((p) => {
                        const total = p.scores.reduce((s, n) => s + n, 0);
                        return (
                          <td key={p.id} className="px-3 py-2 text-center font-bold" style={{ color: p.color }}>
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
