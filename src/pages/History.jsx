import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Handshake, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
import HistoryStats from "@/components/scorekeeper/HistoryStats";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";

export default function History({ onBack, onModalChange }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const scrollRef = useRef(null);
  const touchStartY = useRef(null);
  const PULL_THRESHOLD = 64;

  const fetchGames = useCallback(async () => {
    const data = await base44.entities.GameHistory.list("-played_at", 50);
    setGames(data);
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
      await base44.entities.GameHistory.delete(id);
    } catch {
      setGames(prev);
    }
  };

  const clearAllGames = async () => {
    setClearing(true);
    const prev = games;
    setGames([]);
    try {
      await Promise.all(games.map((g) => base44.entities.GameHistory.delete(g.id)));
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

  // Update parent when modal opens/closes
  useEffect(() => {
    onModalChange?.(showConfirm);
  }, [showConfirm, onModalChange]);

  return (
    <div className="bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Header */}
      <div className="pt-10 pb-2 px-5 flex items-center gap-2 flex-shrink-0" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 className="font-sans font-medium text-lg text-foreground flex-1">Past Rounds</h1>
        {refreshing && <RefreshCw size={16} strokeWidth={2} className="text-muted-foreground animate-spin" />}
        {games.length > 0 &&
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs font-medium text-muted-foreground hover:text-accent-red transition-colors px-2 py-1">
          
            Clear All
          </button>
        }
      </div>

      {/* Pull indicator */}
      {pullDistance > 0 &&
      <div className="flex justify-center py-2 text-muted-foreground" style={{ height: pullDistance }}>
          <RefreshCw size={16} strokeWidth={2} className={pullDistance >= PULL_THRESHOLD ? "text-foreground" : ""} style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
        </div>
      }

      <div className="flex-1 relative overflow-hidden">
        {/* Top fade */}
        {canScroll && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {/* Bottom fade */}
        {canScroll && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FluentEmoji emoji="😨" size={200} />
            <p className="text-muted-foreground text-2xl [font-family:'Geist',_sans-serif] font-medium mt-3">No rounds saved yet.</p>
            <p className="text-muted-foreground/60 mt-1 [font-family:'Geist',_sans-serif] font-normal text-base">Finish a game to see it here.</p>
          </div> :

          <>
            <HistoryStats games={games} />
            <AnimatePresence>
            {games.map((game) => {
                const isLowWin = isLowMode(game.win_mode);
                const modeMeta = getModeMeta(game.win_mode);
                const sorted = [...game.players].sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);
                const winner = sorted[0];
                const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 rounded-xl border border-border bg-card overflow-hidden">
                    
                  {/* Game header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{format(new Date(game.played_at), "MMM d, yyyy · h:mm a")}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <FluentEmoji emoji={modeMeta.emoji} size={14} />
                          {modeMeta.label}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        {isTie ?
                          <Handshake size={20} strokeWidth={2} className="text-muted-foreground" /> :
                          <FluentEmoji emoji="🏆" size={20} />
                          }
                        {isTie ? "Tie" : winner.name}
                      </p>
                    </div>
                    <button
                        onClick={() => deleteGame(game.id)}
                        className="text-muted-foreground hover:text-accent-red transition-colors p-1">
                        
                      <FluentEmoji emoji="🗑️" size={20} />
                    </button>
                  </div>

                  {/* Player scores */}
                  <div className="px-4 py-3 space-y-1">
                    {sorted.map((p, i) =>
                      <div key={p.name} className="flex items-center gap-3 py-1.5 min-h-[44px]">
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
                </motion.div>);

              })}
          </AnimatePresence>
          </>
          }
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => !clearing && setShowConfirm(false)} />
          
            <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 z-50 bg-card border border-border rounded-[44px] shadow-2xl"
            style={{ bottom: "8px", left: "8px", right: "8px", paddingBottom: "env(safe-area-inset-bottom)" }}>
            
              <div className="px-5 pt-5 pb-16">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex flex-col items-center text-center mb-6">
                  <AlertTriangle size={32} strokeWidth={2} className="mb-3" style={{ color: "#FF3A3A" }} />
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">Clear All Games?</h2>
                  <p className="text-sm text-muted-foreground">This will permanently delete all {games.length} game record{games.length !== 1 ? 's' : ''}.<br />This cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-11" disabled={clearing}>
                    Cancel
                  </Button>
                  <Button
                  onClick={clearAllGames}
                  disabled={clearing}
                  className="flex-1 h-11 font-semibold"
                  style={{ backgroundColor: "#FF3A3A", color: "white" }}>
                  
                    {clearing ? "Clearing..." : "Yes, Clear All"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </div>);

}