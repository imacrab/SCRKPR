import { useState, useEffect, useRef, useMemo } from "react";
import { UserPlus, RotateCcw, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { db } from "@/lib/store";
import FluentEmoji from "./FluentEmoji";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";
import PlayerEditModal from "./PlayerEditModal";
import EndGameModal from "./EndGameModal";
import ResetConfirmModal from "./ResetConfirmModal";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import { isLowMode, isCircleMode } from "@/lib/gameModes";
import { SPRING_POP, SPRING_SHEET, SPRING_SNAPPY, TRANSITION_PANEL } from "@/lib/motion";
import logoDark from "@/assets/SCRKPR_dark_mode.png";

export default function ScoreBoard({ players, winMode, bestOf, targetScore, lastAddedPlayerId, onAddScore, onEditScore, onEditName, onEditColor, onEditEmoji, onReset, onAddPlayer, onEndGame }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [streakMap, setStreakMap] = useState({});
  const [gameStartTime] = useState(new Date());
  const [scrollPos, setScrollPos] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sortLocked, setSortLocked] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEndGame, setShowEndGame] = useState(false);
  const [view, setView] = useState("board"); // "board" | "rounds"
  const scrollContainerRef = useRef(null);

  // The Rounds tab only makes sense once rounds exist and not in circle (best-of)
  // modes. Snap back to the board if it stops being available.
  const maxRounds = Math.max(0, ...players.map((p) => p.scores.length));
  const showTabs = !isCircleMode(winMode) && maxRounds > 0;
  useEffect(() => {
    if (view === "rounds" && !showTabs) setView("board");
  }, [view, showTabs]);

  useEffect(() => {
    db.games.list("-played_at", 20).then((games) => {
      // For each current player, count consecutive wins from most recent game
      const map = {};
      players.forEach((player) => {
        let streak = 0;
        for (const game of games) {
          const isLowWin = isLowMode(game.win_mode);
          const sorted = [...game.players].sort((a, b) =>
          isLowWin ? a.total - b.total : b.total - a.total
          );
          const winner = sorted[0];
          if (winner?.name === player.name) {
            streak++;
          } else {
            break;
          }
        }
        if (streak >= 2) map[player.name] = streak;
      });
      setStreakMap(map);
    }).catch((e) => console.error("Failed to load streaks:", e));
  }, []);
  const [editingScore, setEditingScore] = useState(null);

  // For bestof: first to ceil(N/2) wins. For phase10: complete all 10 phases.
  const winsNeeded = bestOf ?
  winMode === "phase10" ? bestOf : Math.ceil(bestOf / 2) :
  null;
  const circleMode = isCircleMode(winMode);

  // Current leader — gets the crown 👑. No crown on ties or before any scores.
  const leaderId = useMemo(() => {
    const isLowWin = isLowMode(winMode);
    const totals = players.map((p) => ({
      id: p.id,
      total: p.scores.reduce((s, n) => s + n, 0),
      played: p.scores.length,
    }));
    if (!totals.some((t) => t.played > 0)) return null;
    const ranked = [...totals].sort((a, b) => (isLowWin ? a.total - b.total : b.total - a.total));
    if (ranked.length > 1 && ranked[0].total === ranked[1].total) return null;
    return ranked[0].id;
  }, [players, winMode]);

  // Sort players by total — direction follows the mode (low-wins → ascending,
  // otherwise descending). Locking preserves the current order (e.g. seating).
  const sortedPlayers = useMemo(() => {
    if (sortLocked) return players;
    const lowWins = isLowMode(winMode);
    return [...players].sort((a, b) => {
      const totalA = a.scores.reduce((s, n) => s + n, 0);
      const totalB = b.scores.reduce((s, n) => s + n, 0);
      return lowWins ? totalA - totalB : totalB - totalA;
    });
  }, [players, winMode, sortLocked]);

  // Track whether we've auto-triggered the end-game modal for the current game.
  // Without this guard, the effect re-fires on every score change after the threshold
  // is crossed, which can race with the user dismissing the modal.
  const autoEndFiredRef = useRef(false);

  // Reset the guard whenever the game is reset (all players have empty scores)
  useEffect(() => {
    const anyScores = players.some((p) => p.scores.length > 0);
    if (!anyScores) autoEndFiredRef.current = false;
  }, [players]);

  // Auto-end when someone reaches winsNeeded in bestof / phase10 mode
  useEffect(() => {
    if (!circleMode || !winsNeeded || autoEndFiredRef.current) return;
    const winner = players.find((p) => p.scores.reduce((s, n) => s + n, 0) >= winsNeeded);
    if (!winner) return;
    autoEndFiredRef.current = true;
    setShowEndGame(true);
  }, [players, circleMode, winsNeeded]);

  // Auto-end when any player reaches the target score (Gin Rummy, Swish, etc.)
  // For round-based modes, wait until all players have logged the same number of scores
  // (i.e. the current round is complete) before ending.
  useEffect(() => {
    if (!targetScore || circleMode || autoEndFiredRef.current) return;
    const reached = players.some((p) => {
      const total = p.scores.reduce((s, n) => s + n, 0);
      return total >= targetScore;
    });
    if (!reached) return;

    // Round complete = every player has the same number of scores logged
    const counts = players.map((p) => p.scores.length);
    const roundComplete = counts.length > 0 && counts.every((c) => c === counts[0]);
    if (!roundComplete) return;

    autoEndFiredRef.current = true;
    setShowEndGame(true);
  }, [players, winMode, targetScore, circleMode]);

  const handleOpenScore = (player) => {
    if (circleMode) {
      // Circle modes (bestof, phase10): just add 1 completion directly
      onAddScore(player.id, 1);
      return;
    }
    setActivePlayer(player);
    setEditingScore(null);
  };

  const handleEditScore = (player, scoreIndex) => {
    if (circleMode) return; // no numeric editing in circle modes
    setActivePlayer(player);
    setEditingScore({ playerId: player.id, scoreIndex });
  };

  const handleSubmit = (value) => {
    if (!activePlayer) return;
    if (editingScore !== null) {
      onEditScore(editingScore.playerId, editingScore.scoreIndex, value);
    } else {
      onAddScore(activePlayer.id, value);
    }
    setActivePlayer(null);
    setEditingScore(null);
  };

  const handleClose = () => {
    setActivePlayer(null);
    setEditingScore(null);
  };

  const handleSavePlayer = ({ name, color, emoji }) => {
    if (!editingPlayer) return;
    onEditName(editingPlayer.id, name);
    onEditColor(editingPlayer.id, color);
    onEditEmoji?.(editingPlayer.id, emoji || "");
    setEditingPlayer(null);
  };



  return (
    <div className="w-screen flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-5 flex-shrink-0" style={{ backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <button onClick={() => setShowEndGame(true)} className="hover:opacity-75 transition-opacity">
          {/* Invisible anchor — see PlayerSetup note; the persistent logo
              hoisted to ScoreKeeper floats over this slot. The button still
              receives the tap (opens End Game) since the floating logo is
              pointer-events:none. */}
          <img src={logoDark} alt="SCRKPR!" data-logo-anchor style={{ maxWidth: 120, height: "auto", opacity: 0 }} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortLocked((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
            style={{ color: sortLocked ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            aria-label={sortLocked ? "Unlock sort order" : "Lock sort order"}>
            
            {sortLocked ? <Lock size={22} strokeWidth={2} /> : <Unlock size={22} strokeWidth={2} />}
          </button>
          {players.length < 20 &&
          <button
            onClick={onAddPlayer}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:text-foreground hover:bg-accent transition-colors text-[hsl(var(--foreground))]"
            aria-label="Add player">
            
              <UserPlus size={22} strokeWidth={2} />
            </button>
          }
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:text-foreground hover:bg-accent transition-colors text-[hsl(var(--foreground))]"
            aria-label="Reset scores">
            
            <RotateCcw size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Scoreboard / Rounds tabs — appear once rounds have been logged */}
      {showTabs && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="relative flex rounded-full bg-secondary border border-border p-1">
            {[
              { id: "board", label: "Scoreboard" },
              { id: "rounds", label: "Rounds" },
            ].map(({ id, label }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="relative flex-1 h-9 rounded-full text-sm font-medium"
                >
                  {active && (
                    <motion.div
                      layoutId="board-tab-pill"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-full bg-card border border-border shadow-sm"
                    />
                  )}
                  <span className={`relative z-10 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rows — one player per row, sorted by total */}
      <div className="flex-1 px-4 pb-4 overflow-hidden w-full relative">
        {/* Bottom fade — players that scroll near the End Game button fade out */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
          style={{
            height: "120px",
            background: "linear-gradient(to top, hsl(var(--background)) 30%, hsl(var(--background) / 0) 100%)"
          }} />
        
        <AnimatePresence mode="wait" initial={false}>
          {view === "rounds" ? (
            <motion.div
              key="rounds"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={TRANSITION_PANEL}
              className="h-full overflow-y-auto relative z-0"
              style={{ WebkitOverflowScrolling: "touch", paddingBottom: "calc(env(safe-area-inset-bottom) + 120px)" }}>
              <ScoreHistoryPanel players={sortedPlayers} />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={TRANSITION_PANEL}
              className="h-full">
              {/* paddingBottom clears the fixed End Game button + its 120px fade. */}
              <div
                ref={scrollContainerRef}
                className="flex flex-col h-full gap-2 w-full overflow-y-auto relative z-0"
                style={{ WebkitOverflowScrolling: "touch", paddingBottom: "calc(env(safe-area-inset-bottom) + 120px)" }}>
                <LayoutGroup>
                  {sortedPlayers.map((player, idx) =>
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 48, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      layout: SPRING_SHEET,
                      y: { ...SPRING_SHEET, delay: idx * 0.07 },
                      scale: { ...SPRING_SHEET, delay: idx * 0.07 },
                      opacity: { duration: 0.25, delay: idx * 0.07 },
                    }}
                    className="w-full flex-shrink-0">

                      <PlayerColumn
                      player={player}
                      isLeader={player.id === leaderId}
                      isHighlighted={player.id === lastAddedPlayerId}
                      streak={streakMap[player.name] || 0}
                      winsNeeded={winsNeeded}
                      isFirst={idx === 0}
                      isLast={idx === sortedPlayers.length - 1}
                      onAddScore={() => handleOpenScore(player)}
                      onEditScore={(i) => handleEditScore(player, i)}
                      onEditPlayer={() => setEditingPlayer(player)} />

                    </motion.div>
                  )}
                </LayoutGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End Game — fixed at bottom of scoreboard, centered */}
        <div
          className="absolute inset-x-0 bottom-0 z-30 flex justify-center"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)", paddingLeft: 48, paddingRight: 48 }}>
          
          <motion.button
            onClick={() => setShowEndGame(true)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.03 }}
            transition={SPRING_POP}
            className="relative rounded-full p-1 overflow-hidden">

            {/* Flowing brand gradient — visible only as the 4px stroke around
                the ink fill (the inner span is inset by the p-1 padding). */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: "linear-gradient(110deg, #2DC5F8 0%, #6366F1 22%, #A855F7 48%, #FF3A3A 74%, #2DC5F8 100%)",
                backgroundSize: "220% 100%",
              }}
              animate={{ backgroundPosition: ["0% 50%", "220% 50%"] }}
              transition={{ duration: 6, ease: "linear", repeat: Infinity }}
            />
            {/* Ink fill — the app background, so the button reads as a glowing
                gradient outline. */}
            <span className="relative flex items-center justify-center gap-2.5 rounded-full bg-background px-7 py-3.5">
              <span className="text-base font-bold text-white tracking-wide">End Game</span>
              {/* Same playful pop the streak/emoji flourishes use across the app */}
              <motion.span
                className="flex"
                animate={{ scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <FluentEmoji emoji="🏁" size={22} />
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>

      <ScoreInputModal
        player={activePlayer}
        editingIndex={editingScore?.scoreIndex ?? null}
        isOpen={!!activePlayer}
        onSubmit={handleSubmit}
        onClose={handleClose} />
      

      <PlayerEditModal
        player={editingPlayer}
        isOpen={!!editingPlayer}
        usedColors={players.map((p) => p.color)}
        usedEmojis={players.map((p) => p.emoji).filter(Boolean)}
        onSave={handleSavePlayer}
        onClose={() => setEditingPlayer(null)} />
      

      <ResetConfirmModal
        isOpen={showResetConfirm}
        onConfirm={onReset}
        onClose={() => setShowResetConfirm(false)} />
      

      <EndGameModal
        isOpen={showEndGame}
        players={players}
        winMode={winMode}
        gameStartTime={gameStartTime}
        onConfirm={() => {setShowEndGame(false);onEndGame();}}
        onCancel={() => setShowEndGame(false)} />
      
    </div>);

}
