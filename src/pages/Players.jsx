import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Check, Trash2 } from "lucide-react";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import DeletePlayerConfirmModal from "@/components/scorekeeper/DeletePlayerConfirmModal";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";
import { SPRING_SHEET, DUR_MEDIUM } from "@/lib/motion";

export default function Players({ onBack, onModalChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | player (existing)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
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
    // Hide the tab bar (and its gradient) for modals AND select mode —
    // the bulk-delete pill takes the nav's place while selecting.
    onModalChange?.(!!editing || showBulkConfirm || selectMode);
  }, [editing, showBulkConfirm, selectMode, onModalChange]);

  // Long-press a card (0.5s) to jump straight into select mode with it selected
  const longPressFiredRef = useRef(false);
  const startLongPress = (e, player) => {
    if (selectMode) return;
    const timer = setTimeout(() => {
      longPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      setSelectMode(true);
      setSelectedIds(new Set([player.id]));
    }, 500);
    const cancel = () => clearTimeout(timer);
    e.currentTarget.addEventListener("pointerup", cancel, { once: true });
    e.currentTarget.addEventListener("pointerleave", cancel, { once: true });
    e.currentTarget.addEventListener("pointercancel", cancel, { once: true });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const allSelected = players.length > 0 && selectedIds.size === players.length;
  const toggleSelectAll = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setSelectedIds(allSelected ? new Set() : new Set(players.map((p) => p.id)));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    setShowBulkConfirm(false);
    exitSelectMode();
    setPlayers((prev) => prev.filter((p) => !ids.includes(p.id)));
    await Promise.allSettled(ids.map((id) => base44.entities.Player.delete(id)));
  };

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
      {/* Edit-mode frame — a 4px brand border around the whole screen that
          fades in while selecting, signalling a distinct "edit mode". Sits
          above content but is click-through; portaled modals (body-level)
          still render above it. */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            key="edit-frame"
            aria-hidden="true"
            className="fixed inset-0 z-30 pointer-events-none rounded-[44px]"
            style={{ border: "4px solid #2DC5F8", boxShadow: "inset 0 0 26px -8px rgba(45,197,248,0.6)" }}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div className="pt-10 pb-2 px-5 flex items-center flex-shrink-0 relative" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        {players.length > 0 && (
          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className="absolute left-5 top-10 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        )}
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center">Players</h1>
        {!selectMode && (
          <button
            onClick={() => setEditing({})}
            className="absolute right-5 top-10 text-sm font-medium text-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
          >
            <Plus size={20} strokeWidth={2} />
          </button>
        )}
        {selectMode && players.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="absolute right-5 top-10 text-sm font-medium text-accent-blue hover:opacity-80 transition-opacity px-2 py-1"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}
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
              {players.map((p, idx) => {
                const isSelected = selectedIds.has(p.id);
                // Same rise + settle as the scoreboard, 70ms apart; capped so
                // long lists don't keep staggering below the fold. Delay lives
                // on `animate` only — exits stay instant.
                const delay = Math.min(idx, 8) * 0.07;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 48, scale: 0.95 }}
                    animate={{
                      opacity: 1, y: 0, scale: 1,
                      transition: {
                        y: { ...SPRING_SHEET, delay },
                        scale: { ...SPRING_SHEET, delay },
                        opacity: { duration: DUR_MEDIUM, delay },
                      },
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                      if (selectMode) toggleSelect(p.id); else setEditing(p);
                    }}
                    onPointerDown={(e) => startLongPress(e, p)}
                    onContextMenu={(e) => e.preventDefault()}
                    // transition-colors, NOT transition-all: a CSS transition on
                    // transform would re-interpolate every frame framer-motion
                    // writes during the entrance spring, making it look choppy.
                    // The tap squish moved to whileTap for the same reason.
                    className={`w-full rounded-lg border bg-card overflow-hidden flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected ? "border-accent-red bg-accent-red/5" : "border-border"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center leading-none overflow-hidden"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.emoji && <FluentEmoji emoji={p.emoji} size={22} />}
                    </div>
                    <span className="flex-1 text-foreground text-base">{p.name}</span>
                    {selectMode && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={SPRING_SHEET}
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                          isSelected ? "bg-accent-red border-accent-red text-white" : "border-border text-transparent"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Floating bulk-delete pill — slides up when something is selected */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={SPRING_SHEET}
            className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
            style={{ bottom: "calc(24px + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="pointer-events-auto flex items-center gap-2 px-5 h-11 rounded-full bg-accent-red hover:bg-accent-red/90 text-white text-sm font-semibold shadow-2xl active:scale-95 transition-transform"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              Delete {selectedIds.size} {selectedIds.size === 1 ? "player" : "players"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerEditModal
        isOpen={!!editing}
        player={editing}
        usedColors={players.map((p) => p.color)}
        usedEmojis={players.map((p) => p.emoji).filter(Boolean)}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setEditing(null)}
      />

      <DeletePlayerConfirmModal
        isOpen={showBulkConfirm}
        count={selectedIds.size}
        playerName={selectedIds.size === 1 ? players.find((p) => selectedIds.has(p.id))?.name : undefined}
        onConfirm={handleBulkDelete}
        onClose={() => setShowBulkConfirm(false)}
      />
    </div>
  );
}