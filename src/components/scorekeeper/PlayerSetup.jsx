import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import BestOfModal from "./BestOfModal";
import GameModeModal from "./GameModeModal";
import CustomTargetModal from "./CustomTargetModal";
import PlayerEditModal from "./PlayerEditModal";
import { getModeMeta } from "@/lib/gameModes";

const DEFAULT_SELECTED_NAMES = ["Adrian", "Jayne"];

export default function PlayerSetup({ onStart, onModalChange }) {
  const [allPlayers, setAllPlayers] = useState(null); // null = loading
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [canScrollPlayers, setCanScrollPlayers] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [winMode, setWinMode] = useState("low");
  const [showBestOf, setShowBestOf] = useState(false);
  const [showGameMode, setShowGameMode] = useState(false);
  const [showCustomTarget, setShowCustomTarget] = useState(false);
  const scrollRef = useRef(null);

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(null);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0) pullStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (pullStartY.current === null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) setPullY(Math.min(delta, PULL_THRESHOLD * 1.5));
  };
  const handleTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD) window.location.reload();
    setPullY(0);
    pullStartY.current = null;
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    base44.entities.Player.list("-created_date", 100).then((data) => {
      setAllPlayers(data);
      // Default-select Adrian & Jayne if present
      const defaults = new Set(
        data
          .filter((p) => DEFAULT_SELECTED_NAMES.includes(p.name))
          .map((p) => p.id)
      );
      setSelectedIds(defaults);
    }).catch(() => setAllPlayers([]));
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScrollPlayers(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [allPlayers]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddPlayer = async ({ name, color, emoji }) => {
    const created = await base44.entities.Player.create({ name, color, emoji });
    setAllPlayers((prev) => [created, ...(prev || [])]);
    setSelectedIds((prev) => new Set([...prev, created.id]));
    setShowAddPlayer(false);
    onModalChange?.(false);
  };

  const setShowAddPlayerWithNav = (val) => {
    setShowAddPlayer(val);
    onModalChange?.(val);
  };

  const selectedPlayers = (allPlayers || []).filter((p) => selectedIds.has(p.id));
  const canStart = selectedPlayers.length >= 2;

  const handleStart = () => {
    if (!canStart) return;
    if (winMode === "bestof") {
      setShowBestOf(true);
      onModalChange?.(true);
    } else if (winMode === "custom") {
      setShowCustomTarget(true);
      onModalChange?.(true);
    } else {
      const meta = getModeMeta(winMode);
      onStart(selectedPlayers, winMode, null, meta.targetScore);
    }
  };

  const handleBestOfConfirm = (bestOf) => {
    setShowBestOf(false);
    onModalChange?.(false);
    onStart(selectedPlayers, "bestof", bestOf);
  };

  const handleCustomConfirm = (direction, target) => {
    setShowCustomTarget(false);
    onModalChange?.(false);
    onStart(selectedPlayers, direction === "low" ? "low" : "high", null, target);
  };

  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);

  return (
    <div
      className="bg-background flex flex-col overflow-hidden"
      style={{ height: "100%", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pullY > 0 ? `${pullY * 0.5}px` : 0, opacity: pullProgress }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 border-t-foreground transition-transform"
          style={{ transform: `rotate(${pullProgress * 360}deg)`, opacity: pullProgress >= 1 ? 1 : 0.5 }}
        />
      </div>

      {/* Header */}
      <div className="pt-10 pb-5 px-6" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <img src={isDarkMode ? "https://media.base44.com/images/public/69ea763700078809357a164a/87badac38_SCRKPR_dark_mode.png" : "https://media.base44.com/images/public/69ea763700078809357a164a/6de7dc994_SCRKPR_light_mode.png"} alt="SCRKPR!" className="mx-auto" style={{ maxWidth: 200, height: "auto" }} />
      </div>

      {/* Player list — pick who's playing */}
      <div className="flex-1 relative overflow-hidden">
        {canScrollPlayers && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {canScrollPlayers && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 pt-2 pb-4 space-y-2"
        >
          {allPlayers === null ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {allPlayers.length === 0 && (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  No players yet. Tap below to add one.
                </div>
              )}

              <AnimatePresence>
                {allPlayers.map((player) => {
                  const selected = selectedIds.has(player.id);
                  return (
                    <motion.button
                      key={player.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -16, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => toggleSelected(player.id)}
                      className="w-full rounded-lg border bg-card overflow-hidden flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{ borderColor: selected ? player.color : "hsl(var(--border))" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center text-sm leading-none"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.emoji}
                      </div>
                      <span className="flex-1 text-foreground text-base">{player.name}</span>
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: selected ? player.color : "transparent",
                          border: selected ? "none" : "2px solid hsl(var(--border))",
                        }}
                      >
                        {selected && <Check size={16} strokeWidth={3} className="text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              <button
                onClick={() => setShowAddPlayerWithNav(true)}
                className="w-full mt-1 h-11 rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors border border-dashed border-border hover:border-accent-blue/50"
              >
                <Plus size={24} strokeWidth={2} />
                Add Player
              </button>
            </>
          )}
        </div>
      </div>

      {/* Win mode */}
      <div className="px-5 pt-2 pb-2">
        <button
          onClick={() => { setShowGameMode(true); onModalChange?.(true); }}
          className="w-full flex items-center justify-between gap-3 px-4 h-11 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Game mode</span>
          <span className="flex items-center gap-1.5">
            {(() => {
              const { Icon, label } = getModeMeta(winMode);
              return (
                <>
                  <Icon size={16} strokeWidth={2} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </>
              );
            })()}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 pt-0 flex flex-col gap-3" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full text-base font-semibold bg-white hover:bg-white/90"
          style={{ height: "52px", color: "#111", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
        >
          <Play size={24} strokeWidth={2} className="mr-2" />
          Start Game
        </Button>
      </div>

      <PlayerEditModal
        isOpen={showAddPlayer}
        player={null}
        usedColors={(allPlayers || []).map((p) => p.color)}
        onSave={handleAddPlayer}
        onClose={() => setShowAddPlayerWithNav(false)}
      />

      <BestOfModal
        isOpen={showBestOf}
        onConfirm={handleBestOfConfirm}
        onClose={() => { setShowBestOf(false); onModalChange?.(false); }}
      />

      <GameModeModal
        isOpen={showGameMode}
        winMode={winMode}
        onSelect={setWinMode}
        onClose={() => { setShowGameMode(false); onModalChange?.(false); }}
      />

      <CustomTargetModal
        isOpen={showCustomTarget}
        onConfirm={handleCustomConfirm}
        onClose={() => { setShowCustomTarget(false); onModalChange?.(false); }}
      />
    </div>
  );
}