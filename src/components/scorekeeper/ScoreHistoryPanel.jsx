import { motion } from "framer-motion";
import FluentEmoji from "./FluentEmoji";
import { TRANSITION_PANEL } from "@/lib/motion";

// The per-round breakdown table. Lives behind the "Rounds" tab on the
// scoreboard (no longer an inline collapsible panel). Renders nothing until at
// least one round has been logged.
export default function ScoreHistoryPanel({ players }) {
  const maxRounds = Math.max(0, ...players.map((p) => p.scores.length));
  if (maxRounds === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ gap: 20 }}>
        <FluentEmoji emoji="🤷‍♀️" size={140} style={{ display: "block" }} />
        <p className="text-white text-2xl [font-family:'Geist',_sans-serif] font-medium">No rounds played yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground sticky left-0 bg-card/80 backdrop-blur-sm">
                Round
              </th>
              {players.map((p) => (
                <th key={p.id} className="px-3 py-2.5 text-center font-medium">
                  {p.emoji ? (
                    <FluentEmoji emoji={p.emoji} size={22} />
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
              <motion.tr
                key={roundIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...TRANSITION_PANEL, delay: Math.min(roundIdx, 10) * 0.03 }}
                className="border-b border-border/50 last:border-0">
                <td className="text-left px-3 py-2.5 text-muted-foreground sticky left-0 bg-card/80 backdrop-blur-sm">
                  {roundIdx + 1}
                </td>
                {players.map((p) => {
                  const score = p.scores[roundIdx];
                  return (
                    <td key={p.id} className="px-3 py-2.5 text-center font-medium text-foreground">
                      {score === undefined ? <span className="text-muted-foreground">—</span> : score}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
            <tr className="bg-muted/30">
              <td className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-muted/60 backdrop-blur-sm">
                Total
              </td>
              {players.map((p) => {
                const total = p.scores.reduce((s, n) => s + n, 0);
                return (
                  <td key={p.id} className="px-3 py-2.5 text-center font-bold" style={{ color: p.color }}>
                    {total}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}