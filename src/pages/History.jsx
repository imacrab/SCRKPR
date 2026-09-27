import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertTriangle, Trash2, Spade } from "lucide-react";
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
import { PlayerTile, SegmentedControl, SectionLabel, PageTitle, HeaderLink, WinnerCard, ColorChip, PAGE_TOP, WIDE_PAGE_TOP } from "@/components/scorekeeper/neo";
import { toNeoColor } from "@/lib/colors";
import HistoryGameDetail from "@/components/scorekeeper/HistoryGameDetail";
import SavedGamesList from "@/components/scorekeeper/SavedGamesList";
import HistoryGamePanel from "@/components/scorekeeper/HistoryGamePanel";
import { useWideLayout } from "@/lib/useWideLayout";
import { TRANSITION_PANEL, SPRING_ENTER } from "@/lib/motion";

const HISTORY_TABS = [
  { id: "games", label: "Games" },
  { id: "saved", label: "Saved" },
  { id: "stats", label: "Stats" },
];

export default function History({ onBack, onResumeGame, onRematch, onModalChange }) {
  const [games, setGames] = useState([]);
  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [tab, setTab] = useState("games"); // "games" | "saved" | "stats"
  const navigate = useNavigate();
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [savedToDelete, setSavedToDelete] = useState(null); // saved game pending delete confirmation
  const [gameToDelete, setGameToDelete] = useState(null); // finished game pending delete confirmation (tablet detail pane)
  const wide = useWideLayout();
  const scrollRef = useRef(null);
  const touchStartY = useRef(null);
  const didInitTab = useRef(false);
  const PULL_THRESHOLD = 64;

  const fetchGames = useCallback(async () => {
    try {
      const [completed, saved] = await Promise.all([
        db.games.list("-played_at", 50),
        db.savedGames.list("-saved_at", 50),
      ]);
      setGames(completed);
      setSavedGames(saved);
    } catch (e) {
      console.error("Failed to load game history:", e);
    }
  }, []);

  useEffect(() => {
    fetchGames().finally(() => setLoading(false));
  }, [fetchGames]);

  // First load only: if there are saved games but no completed ones, open on
  // the Saved tab so those games aren't hidden behind an empty Games tab.
  useEffect(() => {
    if (loading || didInitTab.current) return;
    didInitTab.current = true;
    if (games.length === 0 && savedGames.length > 0) {
      setTab("saved");
    }
  }, [loading, games.length, savedGames.length]);

  const deleteSavedGame = async (id) => {
    const prev = savedGames;
    setSavedGames((g) => g.filter((item) => item.id !== id));
    try {
      await db.savedGames.delete(id);
    } catch {
      setSavedGames(prev);
    }
  };

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

  // Update parent when modal / detail view opens/closes — hides the bottom
  // nav bar so the detail view feels full-screen.
  useEffect(() => {
    onModalChange?.(showConfirm || selectedGameId !== null || savedToDelete !== null || gameToDelete !== null);
  }, [showConfirm, selectedGameId, savedToDelete, gameToDelete, onModalChange]);

  const selectedGame = selectedGameId !== null ? games.find((g) => g.id === selectedGameId) : null;
  // The tablet detail pane is always showing something — the latest game
  // until another one is picked.
  const paneGame = selectedGame || games[0] || null;

  const rematch = (game) => {
    onRematch?.(game.players, game.win_mode, null, getModeMeta(game.win_mode).targetScore);
  };

  const emptyPanel = (emoji, title, body) => (
    <div className="flex flex-col items-center justify-center text-center px-5" style={{ minHeight: "50vh" }}>
      <PlayerTile color="rgb(var(--surface))" size={104} radius={22} rotate={-6} className="shadow-neo-md">
        <FluentEmoji emoji={emoji} size={72} />
      </PlayerTile>
      <h2 className="font-display mt-8 text-[26px] leading-[1.1] uppercase">{title}</h2>
      <p className="mt-2.5 text-base font-medium text-subtle max-w-[280px]">{body}</p>
    </div>
  );

  const blankState = (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[300px] h-[250px] mt-16">
        <div className="absolute left-[40px] top-[14px] w-[220px] h-[210px] bg-surface border-3 border-ink rounded-2xl shadow-neo-md" style={{ transform: "rotate(6deg)" }} />
        <div className="absolute left-[46px] top-2 w-[220px] h-[210px] p-[18px] flex flex-col gap-3.5 text-left bg-surface border-3 border-ink rounded-2xl shadow-neo-md" style={{ transform: "rotate(-4deg)" }}>
          <div className="font-mono text-[11px] font-bold tracking-[0.12em]">SCORECARD</div>
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-3 rounded-md bg-hairline" />)}
          </div>
          <div className="flex-1" />
          <div className="h-[3px] bg-ink" />
          <div className="font-display text-[30px] leading-none">0</div>
        </div>
        <div className="font-mono absolute left-[180px] top-[157px] px-2.5 py-1.5 bg-danger text-ink border-3 border-ink rounded-lg shadow-neo-sm text-xs font-bold tracking-[0.1em]" style={{ transform: "rotate(-10deg)" }}>
          BLANK!
        </div>
      </div>
      <h2 className="font-display mt-9 text-[26px] leading-[1.1] uppercase">No rounds saved yet</h2>
      <p className="mt-3 text-[17px] font-medium leading-[1.45] text-subtle max-w-[290px]">Finished games and stats will show up here.</p>
      <button
        onClick={() => navigate("/")}
        className="neo-press font-display mt-7 h-[58px] px-[26px] flex items-center gap-2.5 bg-sun text-ink border-3 border-ink rounded-xl shadow-neo-md text-[17px] uppercase"
      >
        <Spade size={20} strokeWidth={2} fill="currentColor" />
        Start a game
      </button>
    </div>
  );

  const modals = (
    <>
        {/* Confirm modal — shared BottomSheetModal shell */}
        <BottomSheetModal
          isOpen={showConfirm}
          onClose={() => !clearing && setShowConfirm(false)}
          icon={<AlertTriangle size={30} strokeWidth={2.75} />}
          eyebrow="Confirm"
          title="Clear all games?"
          description={`This will permanently delete all ${games.length} game record${games.length !== 1 ? "s" : ""}. This cannot be undone.`}
          footer={
            <div className="grid grid-cols-2 gap-3.5">
              <Button onClick={() => setShowConfirm(false)} variant="outline" disabled={clearing}>
                Cancel
              </Button>
              <Button onClick={clearAllGames} disabled={clearing} variant="destructive">
                {clearing ? "Clearing..." : "Yes, clear all"}
              </Button>
            </div>
          }
        />

        {/* Delete-saved-game confirmation */}
        <BottomSheetModal
          isOpen={savedToDelete !== null}
          onClose={() => setSavedToDelete(null)}
          icon={<Trash2 size={30} strokeWidth={2.5} />}
          eyebrow="Confirm"
          title="Delete saved game?"
          description={savedToDelete ? `"${savedToDelete.name}" will be permanently deleted. This cannot be undone.` : ""}
          footer={
            <div className="grid grid-cols-2 gap-3.5">
              <Button onClick={() => setSavedToDelete(null)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (savedToDelete) deleteSavedGame(savedToDelete.id);
                  setSavedToDelete(null);
                }}
                variant="destructive"
              >
                Yes, delete
              </Button>
            </div>
          }
        />

      {/* Delete-finished-game confirmation (tablet detail pane) */}
      <BottomSheetModal
        isOpen={gameToDelete !== null}
        onClose={() => setGameToDelete(null)}
        icon={<Trash2 size={30} strokeWidth={2.5} />}
        eyebrow="Confirm"
        title="Delete this game?"
        description="It'll be removed from your history and stats. This cannot be undone."
        footer={
          <div className="grid grid-cols-2 gap-3.5">
            <Button onClick={() => setGameToDelete(null)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (gameToDelete) deleteGame(gameToDelete.id);
                if (gameToDelete?.id === selectedGameId) setSelectedGameId(null);
                setGameToDelete(null);
              }}
              variant="destructive"
            >
              Yes, delete
            </Button>
          </div>
        }
      />
    </>
  );

  if (wide) {
    const hasAny = games.length > 0 || savedGames.length > 0;
    return (
      <div className="relative bg-background flex flex-col overflow-hidden px-11" style={{ height: "100dvh", paddingTop: WIDE_PAGE_TOP, paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}>
        <div className="h-16 flex items-center gap-3 flex-shrink-0">
          <PageTitle className="flex-1">Past rounds</PageTitle>
          {refreshing && <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />}
          {games.length > 0 && <HeaderLink onClick={() => setShowConfirm(true)}>Clear all</HeaderLink>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : !hasAny ? (
          <div className="flex-1 min-h-0 overflow-y-auto">{blankState}</div>
        ) : (
          <>
            <div className="mt-6 w-[340px] landscape:w-[400px] flex-shrink-0">
              <SegmentedControl className="mr-1" height={48} options={HISTORY_TABS} value={tab} onChange={setTab} />
            </div>

            <div className="flex-1 min-h-0 mt-6">
              {tab === "games" ? (
                games.length === 0 ? emptyPanel("🏆", "No finished games", "Finish a game and it'll show up here.") : (
                  <div className="h-full flex gap-8">
                    <div
                      ref={scrollRef}
                      className="w-[340px] landscape:w-[400px] flex-shrink-0 overflow-y-auto pb-4"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}>
                      <AnimatePresence initial={false}>
                        {games.map((game, gameIdx) => {
                          const isLowWin = isLowMode(game.win_mode);
                          const sorted = [...game.players].sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);
                          const winner = sorted[0];
                          const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
                          const active = paneGame?.id === game.id;
                          return (
                            <motion.button
                              key={game.id}
                              type="button"
                              onClick={() => setSelectedGameId(game.id)}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0, transition: { ...SPRING_ENTER, delay: Math.min(gameIdx, 8) * 0.04 } }}
                              exit={{ opacity: 0, height: 0 }}
                              aria-current={active ? "true" : undefined}
                              className="w-[calc(100%-6px)] mb-3.5 p-3.5 flex items-center gap-3.5 text-left border-3 border-ink rounded-2xl transition-[background-color,box-shadow] duration-150"
                              style={{
                                background: active ? (isTie ? "rgb(var(--putty))" : toNeoColor(winner.color)) : "rgb(var(--surface))",
                                color: active ? "rgb(var(--ink))" : "rgb(var(--fg))",
                                boxShadow: active ? "6px 6px 0 rgb(var(--ink))" : "3px 3px 0 rgb(var(--ink))",
                              }}>
                              <PlayerTile emoji={isTie ? "🤝" : winner.emoji || "🏆"} color={active ? "#FFFFFF" : isTie ? "rgb(var(--surface))" : toNeoColor(winner.color)} size={48} radius={11} />
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-extrabold truncate">{isTie ? "It's a tie" : `${winner.name} won`}</div>
                                <div className="font-mono mt-0.5 text-[11px] font-bold tracking-[0.08em] uppercase opacity-80 truncate">
                                  {safeFormat(game.played_at, "MMM d")} · {getModeMeta(game.win_mode).label}
                                </div>
                              </div>
                              <div className="font-display text-[26px]">{winner.total}</div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    <div className="flex-1 min-w-0 pb-[7px] pr-[7px]">
                      {paneGame && (
                        <HistoryGamePanel
                          key={paneGame.id}
                          game={paneGame}
                          onDelete={() => setGameToDelete(paneGame)}
                          onRematch={() => rematch(paneGame)}
                        />
                      )}
                    </div>
                  </div>
                )
              ) : tab === "saved" ? (
                <div className="h-full overflow-y-auto pb-4">
                  {savedGames.length > 0 ? (
                    <div className="grid grid-cols-2 landscape:grid-cols-3 gap-x-4 items-start">
                      <SavedGamesList
                        savedGames={savedGames}
                        onResume={onResumeGame}
                        onDelete={(id) => setSavedToDelete(savedGames.find((g) => g.id === id) || null)}
                      />
                    </div>
                  ) : emptyPanel("🔖", "No saved games", "Tap the bookmark during a game to save it here.")}
                </div>
              ) : (
                <div className="h-full overflow-y-auto pb-4">
                  <div className="max-w-[760px]">
                    {games.length > 0
                      ? <HistoryStats games={games} />
                      : emptyPanel("📊", "No stats yet", "Finish a game to see your stats here.")}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {modals}
      </div>
    );
  }

  return (
    <div className="relative bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: PAGE_TOP, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="px-5 h-12 flex items-center gap-2 flex-shrink-0">
        <PageTitle className="flex-1">Past rounds</PageTitle>
        {refreshing && <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />}
        {games.length > 0 && <HeaderLink onClick={() => setShowConfirm(true)}>Clear all</HeaderLink>}
      </div>

      {!loading && (games.length > 0 || savedGames.length > 0) && (
        <div className="px-5 mt-4 flex-shrink-0">
          <SegmentedControl className="mr-1" options={HISTORY_TABS} value={tab} onChange={setTab} />
        </div>
      )}

      {pullDistance > 0 &&
      <div className="flex justify-center py-2" style={{ height: pullDistance }}>
          <RefreshCw size={18} strokeWidth={2.5} className={pullDistance >= PULL_THRESHOLD ? "" : "opacity-40"} style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
        </div>
      }

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 pt-5"
          style={{ paddingBottom: "calc(69px + 24px + env(safe-area-inset-bottom))" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

        {loading ?
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div> :
          games.length === 0 && savedGames.length === 0 ?
          blankState :

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
                {games.length > 0
                  ? <HistoryStats games={games} />
                  : emptyPanel("📊", "No stats yet", "Finish a game to see your stats here.")}
              </motion.div>
            ) : tab === "saved" ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={TRANSITION_PANEL}
              >
                {savedGames.length > 0 ? (
                  <SavedGamesList
                    savedGames={savedGames}
                    onResume={onResumeGame}
                    onDelete={(id) => setSavedToDelete(savedGames.find((g) => g.id === id) || null)}
                  />
                ) : emptyPanel("🔖", "No saved games", "Tap the bookmark during a game to save it here.")}
              </motion.div>
            ) : (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={TRANSITION_PANEL}
            >
            {games.length === 0 && emptyPanel("🏆", "No finished games", "Finish a game and it'll show up here.")}
            <AnimatePresence>
            {games.map((game, gameIdx) => {
                const isLowWin = isLowMode(game.win_mode);
                const modeMeta = getModeMeta(game.win_mode);
                const sorted = [...game.players].sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);
                const winner = sorted[0];
                const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
                // Delay lives on `animate` only so deletions (exit) stay instant.
                const enterDelay = Math.min(gameIdx, 8) * 0.06;

                if (gameIdx === 0) {
                  return (
                    <motion.div
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING_ENTER, delay: enterDelay } }}
                      exit={{ opacity: 0, height: 0 }}
                      whileTap={{ scale: 0.985 }}
                      className="cursor-pointer">
                      <WinnerCard
                        label="Latest game"
                        date={safeFormat(game.played_at, "MMM d · h:mm a")}
                        sorted={sorted}
                        isTie={isTie}
                        modeLabel={modeMeta.label}
                      />
                    </motion.div>
                  );
                }

                const others = sorted.slice(1);
                return (
                  <div key={game.id}>
                  {gameIdx === 1 && <SectionLabel className="mt-[26px] mb-2.5">Earlier</SectionLabel>}
                  <motion.div
                    onClick={() => setSelectedGameId(game.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { ...SPRING_ENTER, delay: enterDelay } }}
                    exit={{ opacity: 0, height: 0 }}
                    whileTap={{ scale: 0.985 }}
                    className="mb-3.5 mr-[5px] p-3.5 bg-surface border-3 border-ink rounded-2xl shadow-neo-md cursor-pointer">
                    <div className="flex items-center gap-3">
                      <PlayerTile emoji={isTie ? "🤝" : winner.emoji || "🏆"} color={isTie ? "rgb(var(--surface))" : toNeoColor(winner.color)} size={44} radius={10} />
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-extrabold truncate">{isTie ? "It's a tie" : `${winner.name} won`}</div>
                        <div className="font-mono mt-0.5 text-[11px] font-bold tracking-[0.08em] uppercase text-subtle">
                          {safeFormat(game.played_at, "MMM d")} · {modeMeta.label}
                        </div>
                      </div>
                      <div className="font-display text-[26px]">{winner.total}</div>
                    </div>
                    {others.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {others.map((p, i) => (
                          <span key={`${i}-${p.name}`} className="flex items-center gap-1.5 px-2.5 py-[5px] border-2 border-ink rounded-full text-[13px] font-bold">
                            <ColorChip color={p.color} size={10} radius={3} />
                            {p.name} {p.total}
                          </span>
                        ))}
                      </div>
                    )}
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

      {modals}
    </div>);

}