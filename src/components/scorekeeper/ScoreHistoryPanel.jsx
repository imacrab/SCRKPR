import { motion } from "framer-motion";
import FluentEmoji from "./FluentEmoji";
import { PlayerTile } from "./neo";
import { isLowMode } from "@/lib/gameModes";
import { toNeoColor } from "@/lib/colors";
import { TRANSITION_PANEL } from "@/lib/motion";

function bestInRound(players, roundIdx, lowWins) {
  const scores = players.map((p) => p.scores[roundIdx]);
  if (scores.some((s) => s === undefined)) return null;
  const best = lowWins ? Math.min(...scores) : Math.max(...scores);
  return scores.every((s) => s === best) ? null : best;
}

export default function ScoreHistoryPanel({ players, winMode, bare = false }) {
  const maxRounds = Math.max(0, ...players.map((p) => p.scores.length));
  const lowWins = isLowMode(winMode);

  if (maxRounds === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-6">
        <PlayerTile color="rgb(var(--surface))" size={104} radius={22} rotate={-6} className="shadow-neo-md">
          <FluentEmoji emoji="🤷‍♀️" size={72} />
        </PlayerTile>
        <h2 className="font-display mt-8 text-[26px] leading-[1.1] uppercase">No rounds yet</h2>
        <p className="mt-2.5 text-base font-medium text-subtle max-w-[280px]">Every round's scores will stack up here.</p>
      </div>
    );
  }

  const columns = `56px repeat(${players.length}, minmax(44px, 1fr))`;

  return (
    <div className={bare ? "bg-surface" : "mr-1.5 bg-surface border-3 border-ink rounded-2xl shadow-neo-lg overflow-hidden"}>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 56 + players.length * 44 }}>
          <div className="grid items-center h-[60px] border-b-3 border-ink bg-paper" style={{ gridTemplateColumns: columns }}>
            <div className="font-mono pl-3.5 text-[11px] font-bold tracking-[0.1em]">RND</div>
            {players.map((p) => (
              <div key={p.id} className="flex justify-center" title={p.name}>
                <PlayerTile emoji={p.emoji} color={toNeoColor(p.color)} size={34} radius={9} border={2.5} />
              </div>
            ))}
          </div>

          {Array.from({ length: maxRounds }).map((_, roundIdx) => {
            const best = bestInRound(players, roundIdx, lowWins);
            return (
              <motion.div
                key={roundIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...TRANSITION_PANEL, delay: Math.min(roundIdx, 10) * 0.03 }}
                className="grid items-center h-[52px] border-b-2 border-hairline text-lg font-bold text-center"
                style={{ gridTemplateColumns: columns }}
              >
                <div className="font-mono pl-3.5 text-left text-[15px]">{roundIdx + 1}</div>
                {players.map((p) => {
                  const score = p.scores[roundIdx];
                  if (score === undefined) return <div key={p.id} className="text-faint">—</div>;
                  return (
                    <div key={p.id} className="flex justify-center">
                      {score === best ? (
                        <span className="min-w-[38px] h-8 px-1 flex items-center justify-center bg-sun text-ink border-2 border-ink rounded-lg">{score}</span>
                      ) : (
                        score
                      )}
                    </div>
                  );
                })}
              </motion.div>
            );
          })}

          <div className="grid items-center h-[60px] bg-ink text-center font-display text-[22px]" style={{ gridTemplateColumns: columns }}>
            <div className="font-mono pl-3.5 text-left text-white text-[11px] font-bold tracking-[0.1em]">TOTAL</div>
            {players.map((p) => (
              <div key={p.id} style={{ color: toNeoColor(p.color) }}>
                {p.scores.reduce((s, n) => s + n, 0)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
