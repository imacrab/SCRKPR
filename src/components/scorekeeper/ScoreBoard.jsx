import { useState, useEffect, useRef, useMemo } from "react";
import { UserPlus, RotateCcw, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { db } from "@/lib/store";
import SlideToEndGame from "./SlideToEndGame";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";
import PlayerEditModal from "./PlayerEditModal";
import EndGameModal from "./EndGameModal";
import ResetConfirmModal from "./ResetConfirmModal";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import StretchTabPill from "./StretchTabPill";
import { isLowMode, isCircleMode } from "@/lib/gameModes";
import { SPRING_SHEET, TRANSITION_PANEL } from "@/lib/motion";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";
import logoDark from "@/assets/scrkpr-logo.svg";

const SCOREBOARD_TABS = [
  { id: "board", label: "Scoreboard" },
  { id: "rounds", label: "Rounds" },
];

export default function ScoreBoard({ players, winMode, bestOf, targetScore, lastAddedPlayerId, addPlayerModalOpen = false, onAddScore, onEditScore, onEditName, onEditColor, onEditEmoji, onReset, onAddPlayer, onEndGame, onModalChange }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [streakMap, setStreakMap] = useState({});
  const [gameStartTime] = useState(new Date());
  const [scrollPos, setScrollPos] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sortLocked, setSortLocked] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEndGame, setShowEndGame] = useState(false);
  const [endingGame, setEndingGame] = useState(false);
  const [view, setView] = useState("board"); // "board" | "rounds"
  const [previousView, setPreviousView] = useState("board");
  const scrollContainerRef = useRef(null);
  const scoreCloseTimerRef = useRef(null);
  const endGameTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scoreCloseTimerRef.current) clearTimeout(scoreCloseTimerRef.current);
      if (endGameTimerRef.current) clearTimeout(endGameTimerRef.current);
    };
  }, []);

  useEffect(() => {
    onModalChange?.(scoreModalOpen || showResetConfirm || showEndGame || addPlayerModalOpen || !!editingPlayer);
  }, [scoreModalOpen, showResetConfirm, showEndGame, addPlayerModalOpen, editingPlayer, onModalChange]);

  useEffect(() => {
    return () => onModalChange?.(false);
  }, [onModalChange]);

  // The Rounds tab is available in any non-circle (best-of) mode, even before
  // any rounds have been played. Snap back to the board if it stops being
  // available (e.g. mode change).
  const showTabs = !isCircleMode(winMode);
  useEffect(() => {
    if (view === "rounds" && !showTabs) {
      setPreviousView("board");
      setView("board");
    }
  }, [view, showTabs]);

  const activeViewIndex = SCOREBOARD_TABS.findIndex((item) => item.id === view);
  const previousViewIndex = SCOREBOARD_TABS.findIndex((item) => item.id === previousView);
  const handleViewChange = (id) => {
    if (id === view) return;
    setPreviousView(view);
    setView(id);
  };

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

  // A "round" is the lowest score-count across players. A player who has logged
  // the current round is "checked"; the round only advances once everyone has.
  const currentRound = useMemo(
    () => (players.length ? Math.min(...players.map((p) => p.scores.length)) : 0),
    [players]
  );

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

  // Low-score mode only: the player who scored the MOST in the previous
  // completed round gets a 😭 flair — where "previous round" is the last round
  // in which every player has logged a score. Independent of overall standing.
  // No flair on ties for the highest single-round score.
  const worstId = useMemo(() => {
    if (!isLowMode(winMode)) return null;
    const minRounds = players.reduce(
      (m, p) => Math.min(m, p.scores.length),
      Infinity
    );
    if (!Number.isFinite(minRounds) || minRounds < 1) return null;
    const roundIdx = minRounds - 1;
    const roundScores = players.map((p) => ({ id: p.id, s: p.scores[roundIdx] }));
    const ranked = [...roundScores].sort((a, b) => b.s - a.s);
    if (ranked.length > 1 && ranked[0].s === ranked[1].s) return null;
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
    if (scoreCloseTimerRef.current) clearTimeout(scoreCloseTimerRef.current);
    setActivePlayer(player);
    setEditingScore(null);
    setScoreModalOpen(true);
  };

  const handleEditScore = (player, scoreIndex) => {
    if (circleMode) return; // no numeric editing in circle modes
    if (scoreCloseTimerRef.current) clearTimeout(scoreCloseTimerRef.current);
    setActivePlayer(player);
    setEditingScore({ playerId: player.id, scoreIndex });
    setScoreModalOpen(true);
  };

  const closeScoreModal = () => {
    setScoreModalOpen(false);
    if (scoreCloseTimerRef.current) clearTimeout(scoreCloseTimerRef.current);
    scoreCloseTimerRef.current = setTimeout(() => {
      setActivePlayer(null);
      setEditingScore(null);
    }, 420);
  };

  const handleSubmit = (value) => {
    if (!activePlayer) return;
    if (editingScore !== null) {
      // Correcting a specific past entry (tapped the "(+X)") — replace it.
      onEditScore(editingScore.playerId, editingScore.scoreIndex, value);
    } else {
      // Tapping the player: if they've already logged this round, ADD to that
      // round's entry (so +2 then +4 tallies as +6); otherwise log a fresh one.
      const p = players.find((x) => x.id === activePlayer.id) || activePlayer;
      if (!circleMode && p.scores.length > currentRound) {
        onEditScore(activePlayer.id, currentRound, p.scores[currentRound] + value);
      } else {
        onAddScore(activePlayer.id, value);
      }
    }
    closeScoreModal();
  };

  const handleClose = () => {
    closeScoreModal();
  };

  const handleSavePlayer = ({ name, color, emoji }) => {
    if (!editingPlayer) return;
    onEditName(editingPlayer.id, name);
    onEditColor(editingPlayer.id, color);
    onEditEmoji?.(editingPlayer.id, emoji || "");
    setEditingPlayer(null);
  };

  const handleConfirmEndGame = () => {
    if (endingGame) return;
    setEndingGame(true);
    setShowEndGame(false);
    if (endGameTimerRef.current) clearTimeout(endGameTimerRef.current);
    endGameTimerRef.current = setTimeout(() => {
      onEndGame();
    }, 430);
  };

  const slideControlHidden = showEndGame || scoreModalOpen || showResetConfirm || addPlayerModalOpen;



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
            onPointerDown={primeIOSKeyboard}
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
            <StretchTabPill
              activeIndex={activeViewIndex}
              previousIndex={previousViewIndex}
              onSettle={() => setPreviousView(view)}
            />
            {SCOREBOARD_TABS.map(({ id, label }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => handleViewChange(id)}
                  className="relative flex-1 h-9 rounded-full text-sm font-medium"
                >
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
                      isWorst={player.id === worstId}
                      isHighlighted={player.id === lastAddedPlayerId}
                      streak={streakMap[player.name] || 0}
                      winsNeeded={winsNeeded}
                      isFirst={idx === 0}
                      isLast={idx === sortedPlayers.length - 1}
                      scoredThisRound={!circleMode && player.scores.length > currentRound}
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

        {/* End Game — fixed at bottom of scoreboard, slide-to-confirm */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-30 flex justify-center"
          animate={{
            y: slideControlHidden ? 120 : 0,
          }}
          transition={SPRING_SHEET}
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            paddingLeft: 48,
            paddingRight: 48,
            pointerEvents: slideControlHidden ? "none" : "auto",
          }}>

          <SlideToEndGame onComplete={() => setShowEndGame(true)} />
        </motion.div>
      </div>

      <ScoreInputModal
        player={activePlayer}
        editingIndex={editingScore?.scoreIndex ?? null}
        isOpen={scoreModalOpen}
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
        onConfirm={handleConfirmEndGame}
        isConfirming={endingGame}
        onCancel={() => {
          if (endingGame) return;
          setShowEndGame(false);
        }} />
      
    </div>);

}