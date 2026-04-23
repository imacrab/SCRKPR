import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function History({ onBack }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.GameHistory.list("-played_at", 50).then((data) => {
      setGames(data);
      setLoading(false);
    });
  }, []);

  const deleteGame = async (id) => {
    await base44.entities.GameHistory.delete(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-5 flex items-center gap-3 bg-card border-b border-border flex-shrink-0">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-sans font-medium text-lg text-foreground">Past Rounds</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy size={36} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No rounds saved yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Finish a game to see it here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {games.map((game) => {
              const sorted = [...game.players].sort((a, b) => b.total - a.total);
              const winner = sorted[0];
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Game header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(game.played_at), "MMM d, yyyy · h:mm a")}
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        🏆 {winner.name}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteGame(game.id)}
                      className="text-muted-foreground hover:text-accent-red transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Player scores */}
                  <div className="px-4 py-3 space-y-2">
                    {sorted.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                        <span className="text-sm font-semibold" style={{ color: p.color }}>
                          {p.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}