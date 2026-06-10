import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users } from "lucide-react";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";

export default function Players({ onBack, onModalChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | player (existing)
  const [canScroll, setCanScroll] = useState(false);
  const scrollRef = useRef(null);

  const fetchPlayers = async () => {
    const data = await base44.entities.Player.list("-created_date", 100);
    setPlayers(data);
  };

  useEffect(() => {
    fetchPlayers().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onModalChange?.(!!editing);
  }, [editing, onModalChange]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [players, loading]);

  const handleSave = async ({ id, name, color, emoji }) => {
    if (id) {
      await base44.entities.Player.update(id, { name, color, emoji });
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, color, emoji } : p)));
    } else {
      const created = await base44.entities.Player.create({ name, color, emoji });
      setPlayers((prev) => [created, ...prev]);
    }
    setEditing(null);
  };

  const handleDelete = async (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
    await base44.entities.Player.delete(id);
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="pt-10 pb-2 px-5 flex items-center flex-shrink-0 relative" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center">Players</h1>
        <button
          onClick={() => setEditing({})}
          className="absolute right-5 top-10 text-sm font-medium text-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {canScroll && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {canScroll && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 py-4 space-y-2"
          style={{ paddingBottom: "calc(56px + 16px + 16px + env(safe-area-inset-bottom))" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users size={36} strokeWidth={2} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No saved players yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Tap + to add one.</p>
            </div>
          ) : (
            <AnimatePresence>
              {players.map((p) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setEditing(p)}
                  className="w-full rounded-lg border border-border bg-card overflow-hidden flex items-center gap-3 px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center leading-none overflow-hidden"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.emoji && <FluentEmoji emoji={p.emoji} size={22} />}
                  </div>
                  <span className="flex-1 text-foreground text-base">{p.name}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <PlayerEditModal
        isOpen={!!editing}
        player={editing}
        usedColors={players.map((p) => p.color)}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}