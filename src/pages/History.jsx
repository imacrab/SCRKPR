import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Handshake, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
import BottomSheetModal from "@/components/scorekeeper/BottomSheetModal";

// Guard against malformed/missing dates — never let a bad value crash the page.
const safeFormat = (value, fmt) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};
import HistoryStats from "@/components/scorekeeper/HistoryStats";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";
import StretchTabPill from "@/components/scorekeeper/StretchTabPill";
import HistoryGameDetail from "@/components/scorekeeper/HistoryGameDetail";
import { TRANSITION_PANEL, SPRING_SNAPPY } from "@/lib/motion";

const HISTORY_TABS = [
  { id: "games", label: "Games", emoji: "🎲" },
  { id: "stats", label: "Stats", emoji: "📊" },
];

export default function History({ onBack, onModalChange }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [tab, setTab] = useState("games"); // "games" | "stats"
  const [previousTab, setPreviousTab] = useState("games");
  const [selectedGameId, setSelectedGameId] = useState(null);
  const scrollRef = useRef(null);
  const touchStartY = useRef(null);
  const PULL_THRESHOLD = 64;

  const fetchGames = useCallback(async () => {
    try {
      const data = await db.games.list("-played_at", 50);
      setGames(data);
    } catch (e) {
      console.error("Failed to load game history:", e);
    }
  }, []);

  useEffect(() => {
    fetchGames().finally(() => setLoading(false));
  }, [fetchGames]);

  const handleTouchStart = (e) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && scrollRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      await fetchGames();
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = null;
  };

  const deleteGame = async (id) => {
    const prev = games;
    setGames((g) => g.filter((item) => item.id !== id));
    try {
      await db.games.delete(id);
    } catch {
      setGames(prev);
    }
  };

  const clearAllGames = async () => {
    setClearing(true);
    const prev = games;
    setGames([]);
    try {
      await Promise.all(games.map((g) => db.games.delete(g.id)));
      setShowConfirm(false);
    } catch {
      setGames(prev);
    }
    setClearing(false);
  };

  // Check if content can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [games, loading]);

  // Update parent when modal / detail view opens/closes — hides the bottom
  // nav bar so the detail view feels full-screen.
  useEffect(() => {
    onModalChange?.(showConfirm || selectedGameId !== null);
  }, [showConfirm, selectedGameId, onModalChange]);

  const selectedGame = selectedGameId !== null ? games.find((g) => g.id === selectedGameId) : null;

  const activeTabIndex = HISTORY_TABS.findIndex((item) => item.id === tab);
  const previousTabIndex = HISTORY_TABS.findIndex((item) => item.id === previousTab);
  const handleTabChange = (id) => {
    if (id === tab) return;
    setPreviousTab(tab);
    setTab(id);
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Header */}
      <div className="pt-10 pb-2 px-5 flex items-baseline flex-shrink-0 relative" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center">Past Rounds</h1>
        <div className="absolute right-5 top-10 flex items-center gap-2">
          {refreshing && <RefreshCw size={16} strokeWidth={2} className="text-muted-foreground animate-spin" />}
          {games.length > 0 &&
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs font-medium text-white/70 hover:text-white transition-colors px-2 py-1">
            
              Clear All
            </button>
          }
        </div>
      </div>

      {/* Games / Stats tabs */}
      {!loading && games.length > 0 && (
        <div className="px-5 pt-2 pb-2 flex-shrink-0">
          <div className="relative flex rounded-full bg-secondary border border-border p-1">
            <StretchTabPill
              activeIndex={activeTabIndex}
              previousIndex={previousTabIndex}
              onSettle={() => setPreviousTab(tab)}
            />
            {HISTORY_TABS.map(({ id, label, emoji }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className="relative flex-1 h-9 rounded-full text-sm font-medium"
                >
                  <span className={`relative z-10 inline-flex items-center gap-1.5 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    <FluentEmoji emoji={emoji} size={15} />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pull indicator */}
      {pullDistance > 0 &&
      <div className="flex justify-center py-2 text-muted-foreground" style={{ height: pullDistance }}>
          <RefreshCw size={16} strokeWidth={2} className={pullDistance >= PULL_THRESHOLD ? "text-foreground" : ""} style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
        </div>
      }

      <div className="flex-1 relative overflow-hidden">
        {/* Top fade */}
        {canScroll && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 py-4"
          style={{ paddingBottom: "calc(56px + 16px + 16px + env(safe-area-inset-bottom))" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          
        {loading ?
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div> :
          games.length === 0 ?
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-5">
              <p className="text-white text-2xl [font-family:'Geist',_sans-serif] font-medium">No rounds saved yet</p>
              <p className="text-muted-foreground/60 mt-1 [font-family:'Geist',_sans-serif] font-normal text-base">Finish a game to see it here</p>
            </div>
            <div
              className="fixed inset-x-0 flex justify-center pointer-events-none"
              style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}>
              
              <FluentEmoji emoji="🙀" size={140} style={{ display: "block" }} />
            </div>
          </> :

          <>
            <AnimatePresence mode="wait" initial={false}>
            {tab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={TRANSITION_PANEL}
              >
                <HistoryStats games={games} />
              </motion.div>
            ) : (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={TRANSITION_PANEL}
            >
            <AnimatePresence>
            {games.map((game, gameIdx) => {
                const isLowWin = isLowMode(game.win_mode);
                const modeMeta = getModeMeta(game.win_mode);
                const sorted = [...game.players].sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);
                const winner = sorted[0];
                const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
                const isLatest = gameIdx === 0;
                // Staggered rise on load, 60ms apart (capped). Delay lives on
                // `animate` only so deletions (exit) stay instant.
                const enterDelay = Math.min(gameIdx, 8) * 0.06;

                if (isLatest) {
                  return (
                    <motion.div
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING_SNAPPY, delay: enterDelay } }}
                      exit={{ opacity: 0, height: 0 }}
                      whileTap={{ scale: 0.985 }}
                      className="mb-4 rounded-3xl overflow-hidden relative border cursor-pointer"
                      style={{
                        borderColor: `${winner.color}66`,
                        background: `linear-gradient(155deg, ${winner.color}30 0%, ${winner.color}10 35%, hsl(var(--card)) 70%)`,
                      }}>

                      {/* Oversized winner emoji bleeding off the corner — same flourish as the scoreboard */}
                      {!isTie && winner.emoji && (
                        <div
                          className="absolute pointer-events-none select-none"
                          style={{ right: -18, top: -14, transform: "rotate(16deg)", opacity: 0.22 }}
                          aria-hidden="true">
                          <FluentEmoji emoji={winner.emoji} size={130} />
                        </div>
                      )}

                      <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-10">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Latest Game</p>
                        <p className="text-xs text-muted-foreground">{safeFormat(game.played_at, "MMM d · h:mm a")}</p>
                      </div>

                      {/* Winner hero */}
                      <div className="px-5 pb-3 flex items-center gap-3 relative z-10">
                        <div
                          className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-white/25 flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: isTie ? "hsl(var(--muted))" : winner.color }}>
                          {isTie
                            ? <Handshake size={26} strokeWidth={2} className="text-muted-foreground" />
                            : winner.emoji
                              ? <FluentEmoji emoji={winner.emoji} size={34} />
                              : <FluentEmoji emoji="🏆" size={30} />}
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
                            key={p.name}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="flex items-center gap-3 py-2 px-3 rounded-xl"
                            style={{ backgroundColor: `${p.color}14` }}>
                            <span className="text-xs text-muted-foreground w-5 text-right">
                              {!isTie && i === 0 ? <FluentEmoji emoji="🥇" size={16} />
                                : !isTie && i === 1 ? <FluentEmoji emoji="🥈" size={16} />
                                : !isTie && i === 2 ? <FluentEmoji emoji="🥉" size={16} />
                                : i + 1}
                            </span>
                            {p.emoji
                              ? <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: p.color }}><FluentEmoji emoji={p.emoji} size={16} /></span>
                              : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-[7px]" style={{ backgroundColor: p.color }} />}
                            <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                            <span className="text-sm font-bold" style={{ color: p.color }}>{p.total}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div key={game.id}>
                  {gameIdx === 1 && (
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 pt-1 pb-2">Earlier</p>
                  )}
                  <motion.div
                    onClick={() => setSelectedGameId(game.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { ...SPRING_SNAPPY, delay: enterDelay } }}
                    exit={{ opacity: 0, height: 0 }}
                    whileTap={{ scale: 0.985 }}
                    className="mb-3 rounded-xl border border-border bg-card overflow-hidden cursor-pointer">

                  {/* Game header */}
                  <div className="px-4 py-3 flex items-baseline justify-between border-b border-border">
                    <div className="flex flex-col gap-2">
                      <p className="text-lg text-foreground flex items-center gap-1.5 [font-family:'Geist',_sans-serif] font-semibold">
                        {isTie ?
                          <Handshake size={20} strokeWidth={2} className="text-muted-foreground" /> :
                          <FluentEmoji emoji="🏆" size={24} />
                          }
                        {isTie ? "Tie" : winner.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{safeFormat(game.played_at, "MMM d, yyyy · h:mm a")}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <FluentEmoji emoji={modeMeta.emoji} size={14} />
                          {modeMeta.label}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Player scores */}
                  <div className="px-4 py-3 space-y-1">
                    {sorted.map((p, i) =>
                      <div key={p.name} className="flex items-center gap-3 py-1.5 min-h-touch">
                        <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }} />

                        <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                        <span className="text-sm font-semibold" style={{ color: p.color }}>
                          {p.total}
                        </span>
                      </div>
                      )}
                  </div>
                </motion.div>
                </div>);

              })}
          </AnimatePresence>
          </motion.div>
          )}
          </AnimatePresence>
          </>
          }
        </div>
      </div>

      {/* Game detail — slides in from the right; swipe or arrow to go back */}
      <AnimatePresence>
        {selectedGame && (
          <HistoryGameDetail
            key={selectedGame.id}
            game={selectedGame}
            onBack={() => setSelectedGameId(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirm modal — shared BottomSheetModal shell */}
      <BottomSheetModal
        isOpen={showConfirm}
        onClose={() => !clearing && setShowConfirm(false)}
        icon={<AlertTriangle size={32} strokeWidth={2} />}
        title="Clear All Games?"
        description={`This will permanently delete all ${games.length} game record${games.length !== 1 ? "s" : ""}. This cannot be undone.`}
        footer={
          <div className="flex gap-3">
            <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-11" disabled={clearing}>
              Cancel
            </Button>
            <Button
              onClick={clearAllGames}
              disabled={clearing}
              className="flex-1 h-11 font-semibold bg-accent-red hover:bg-accent-red/90 text-white"
            >
              {clearing ? "Clearing..." : "Yes, Clear All"}
            </Button>
          </div>
        }
      />
    </div>);

}