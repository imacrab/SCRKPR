import { useState, useEffect, useRef, useMemo } from "react";
import { RotateCcw, Flag, Bookmark } from "lucide-react";
import { LogoSticker, SectionLabel, SegmentedControl, PAGE_TOP, WIDE_PAGE_TOP } from "./neo";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { db } from "@/lib/store";
import PlayerColumn from "./PlayerColumn";
import ScoreCard from "./ScoreCard";
import ScoreInputModal from "./ScoreInputModal";
import PlayerEditModal from "./PlayerEditModal";
import EndGameModal from "./EndGameModal";
import ResetConfirmModal from "./ResetConfirmModal";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import PauseGameModal from "./PauseGameModal";
import { isLowMode, isCircleMode, getModeMeta } from "@/lib/gameModes";
import { SPRING_SHEET, TRANSITION_PANEL } from "@/lib/motion";
import { useWideLayout } from "@/lib/useWideLayout";

// Columns for the tablet card grid; the rounds panel takes a slice of the
// width, so boards without it can fit one more column.
function boardColumns(count, hasSidePanel) {
  if (hasSidePanel) return count <= 4 ? 2 : count <= 9 ? 3 : 4;
  return count <= 2 ? 2 : count <= 6 ? 3 : 4;
}

const iconButtonClass = "neo-press w-11 h-11 flex items-center justify-center bg-surface border-3 border-ink rounded-[11px] shadow-neo-sm";

const SCOREBOARD_TABS = [
  { id: "board", label: "Scoreboard" },
  { id: "rounds", label: "Rounds" },
];

export default function ScoreBoard({ players, winMode, bestOf, targetScore, lastAddedPlayerId, addPlayerModalOpen = false, onAddScore, onEditScore, onEditName, onEditColor, onEditEmoji, onEditCardStyle, onReset, onEndGame, onPauseGame, onModalChange }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [streakMap, setStreakMap] = useState({});
  const [gameStartTime] = useState(new Date());
  const [scrollPos, setScrollPos] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEndGame, setShowEndGame] = useState(false);
  const [endingGame, setEndingGame] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [view, setView] = useState("board"); // "board" | "rounds"
  const wide = useWideLayout();
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
    onModalChange?.(scoreModalOpen || showResetConfirm || showEndGame || showPauseModal || addPlayerModalOpen || !!editingPlayer);
  }, [scoreModalOpen, showResetConfirm, showEndGame, showPauseModal, addPlayerModalOpen, editingPlayer, onModalChange]);

  useEffect(() => {
    return () => onModalChange?.(false);
  }, [onModalChange]);

  // The Rounds tab is available in any non-circle (best-of) mode, even before
  // any rounds have been played. Snap back to the board if it stops being
  // available (e.g. mode change).
  const showTabs = !isCircleMode(winMode);
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

  // Swish only: the player who scored the MOST in the previous completed round
  // gets a 😭 flair — where "previous round" is the last round in which every
  // player has logged a score. Independent of overall standing. Other low modes
  // (Gin Rummy, Phase 10) intentionally don't get this flair.
  //
  // Tiebreaker: if 2+ players tie for the worst score of that round, walk BACK
  // through prior rounds — whoever had the higher score among the tied set in
  // the earliest earlier round that separates them keeps the flair. If every
  // prior round is also tied (or there are no prior rounds), no flair.
  const worstId = useMemo(() => {
    if (winMode !== "swish") return null;
    const minRounds = players.reduce(
      (m, p) => Math.min(m, p.scores.length),
      Infinity
    );
    if (!Number.isFinite(minRounds) || minRounds < 1) return null;
    const roundIdx = minRounds - 1;
    const roundScores = players.map((p) => ({ id: p.id, s: p.scores[roundIdx] }));
    const maxScore = Math.max(...roundScores.map((r) => r.s));
    let tied = roundScores.filter((r) => r.s === maxScore);
    if (tied.length === 1) return tied[0].id;

    // Walk back through prior rounds, narrowing the tied set each time
    // whichever tied players scored highest survives.
    for (let r = roundIdx - 1; r >= 0; r--) {
      const tiedIds = new Set(tied.map((t) => t.id));
      const prev = players
        .filter((p) => tiedIds.has(p.id))
        .map((p) => ({ id: p.id, s: p.scores[r] }));
      const prevMax = Math.max(...prev.map((x) => x.s));
      const survivors = prev.filter((x) => x.s === prevMax);
      if (survivors.length === 1) return survivors[0].id;
      tied = survivors;
    }
    return null;
  }, [players, winMode]);

  // Sort players by total — direction follows the mode (low-wins → ascending,
  // otherwise descending).
  const sortedPlayers = useMemo(() => {
    const lowWins = isLowMode(winMode);
    return [...players].sort((a, b) => {
      const totalA = a.scores.reduce((s, n) => s + n, 0);
      const totalB = b.scores.reduce((s, n) => s + n, 0);
      return lowWins ? totalA - totalB : totalB - totalA;
    });
  }, [players, winMode]);

  const lowWins = isLowMode(winMode);
  const totalOf = (p) => p.scores.reduce((s, n) => s + n, 0);
  const bestTotal = sortedPlayers.length ? totalOf(sortedPlayers[0]) : 0;
  const roundNumber = Math.max(1, ...players.map((p) => p.scores.length));
  const modeMeta = getModeMeta(winMode);
  const rulesLabel = circleMode
    ? `First to ${winsNeeded} wins`
    : [
        winMode !== "low" && winMode !== "high" ? modeMeta.label : null,
        lowWins ? "Low score wins" : "High score wins",
        targetScore ? `Ends at ${targetScore}` : null,
      ].filter(Boolean).join(" · ");

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

  // If the player has already logged this round, ADD to that round's entry
  // (so +2 then +4 tallies as +6); otherwise log a fresh one.
  const applyScore = (player, value) => {
    const p = players.find((x) => x.id === player.id) || player;
    if (!circleMode && p.scores.length > currentRound) {
      onEditScore(p.id, currentRound, p.scores[currentRound] + value);
    } else {
      onAddScore(p.id, value);
    }
  };

  const handleSubmit = (value) => {
    if (!activePlayer) return;
    if (editingScore !== null) {
      // Correcting a specific past entry (tapped the "(+X)") — replace it.
      onEditScore(editingScore.playerId, editingScore.scoreIndex, value);
    } else {
      applyScore(activePlayer, value);
    }
    closeScoreModal();
  };

  const handleClose = () => {
    closeScoreModal();
  };

  const handleSavePlayer = ({ name, color, emoji, cardStyle }) => {
    if (!editingPlayer) return;
    onEditName(editingPlayer.id, name);
    onEditColor(editingPlayer.id, color);
    onEditEmoji?.(editingPlayer.id, emoji || "");
    onEditCardStyle?.(editingPlayer.id, cardStyle || "solid");
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

  // Default name offered in the pause sheet — mode + short date, e.g.
  // "Skip-Bo · Aug 3". The user can overwrite it.
  const defaultPauseName = `${getModeMeta(winMode).label} · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;



  const modals = (
    <>
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


        <PauseGameModal
          isOpen={showPauseModal}
          defaultName={defaultPauseName}
          onSave={(name) => onPauseGame?.(name)}
          onClose={() => setShowPauseModal(false)} />
    </>
  );

  const cardProps = (player) => ({
    player,
    isLeader: player.id === leaderId,
    isWorst: player.id === worstId,
    isHighlighted: player.id === lastAddedPlayerId,
    streak: streakMap[player.name] || 0,
    winsNeeded,
    behind: lowWins ? totalOf(player) - bestTotal : bestTotal - totalOf(player),
    scoredThisRound: !circleMode && player.scores.length > currentRound,
    onAddScore: () => handleOpenScore(player),
    onEditScore: (i) => handleEditScore(player, i),
    onEditPlayer: () => setEditingPlayer(player),
  });

  if (wide) {
    const columns = boardColumns(sortedPlayers.length, showTabs);
    const rows = Math.max(1, Math.ceil(sortedPlayers.length / columns));
    const statusLabel = circleMode ? `Best of ${bestOf} · ${rulesLabel}` : `Round ${roundNumber} · ${rulesLabel}`;

    return (
      <div className="w-full flex flex-col overflow-hidden bg-background px-10" style={{ height: "100dvh", paddingTop: WIDE_PAGE_TOP, paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}>
        <div className="flex items-center gap-4 h-16 flex-shrink-0">
          <button onClick={() => setShowEndGame(true)} aria-label="End game">
            <LogoSticker size="lg" />
          </button>
          <span className="font-mono flex-1 min-w-0 ml-2 text-[13px] font-bold tracking-[0.1em] uppercase truncate">
            {statusLabel}
          </span>
          <button onClick={() => setShowPauseModal(true)} className={`${iconButtonClass} !w-[52px] !h-[52px]`} aria-label="Save game">
            <Bookmark size={22} strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowResetConfirm(true)} className={`${iconButtonClass} !w-[52px] !h-[52px]`} aria-label="Reset scores">
            <RotateCcw size={22} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setShowEndGame(true)}
            className="neo-press font-display ml-2 mr-1.5 h-[60px] px-7 flex items-center gap-2.5 bg-sun text-ink border-3 border-ink rounded-[14px] shadow-neo-lg text-xl uppercase">
            <Flag size={22} strokeWidth={2.75} />
            End game
          </button>
        </div>

        <div className="flex-1 min-h-0 flex gap-8 mt-6">
          <div className="flex-1 min-w-0 overflow-y-auto pt-4" style={{ WebkitOverflowScrolling: "touch" }}>
            <div
              className="grid gap-x-3 gap-y-4 h-full"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(250px, 1fr))`,
              }}>
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
                  className="min-h-0 pr-[9px] pb-[9px]">
                    <ScoreCard {...cardProps(player)} onQuickScore={(step) => applyScore(player, step)} />
                  </motion.div>
                )}
              </LayoutGroup>
            </div>
          </div>

          {showTabs && (
            <section
              aria-label="Rounds"
              className="w-[360px] landscape:w-[420px] flex-shrink-0 mt-4 mb-[7px] mr-[7px] flex flex-col bg-surface border-3 border-ink rounded-[20px] shadow-neo-lg overflow-hidden">
              <div className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b-3 border-ink">
                <SectionLabel className="!text-fg">Rounds</SectionLabel>
                <span className="font-mono flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-subtle">
                  <span className="w-4 h-3.5 bg-sun border-2 border-ink rounded" />
                  {lowWins ? "Round low" : "Round best"}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ScoreHistoryPanel players={sortedPlayers} winMode={winMode} bare />
              </div>
            </section>
          )}
        </div>

        {modals}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col overflow-hidden bg-background" style={{ height: "100dvh", paddingTop: PAGE_TOP, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-2.5 h-[46px] px-5 flex-shrink-0">
        <button onClick={() => setShowEndGame(true)} aria-label="End game">
          <LogoSticker />
        </button>
        <span className="font-mono flex-1 ml-1.5 text-xs font-bold tracking-[0.1em] uppercase">
          {circleMode ? `Best of ${bestOf}` : `Round ${roundNumber}`}
        </span>
        <button onClick={() => setShowPauseModal(true)} className={iconButtonClass} aria-label="Save game">
          <Bookmark size={20} strokeWidth={2.5} />
        </button>
        <button onClick={() => setShowResetConfirm(true)} className={`${iconButtonClass} mr-[3px]`} aria-label="Reset scores">
          <RotateCcw size={20} strokeWidth={2.5} />
        </button>
      </div>

      {showTabs && (
        <div className="px-5 mt-4 flex-shrink-0">
          <SegmentedControl className="mr-1" options={SCOREBOARD_TABS} value={view} onChange={setView} />
        </div>
      )}

      <SectionLabel className="px-5 mt-4 flex-shrink-0 flex items-center gap-2 truncate">
        {view === "rounds" && <span className="w-4 h-3.5 flex-shrink-0 bg-sun text-ink border-2 border-ink rounded" />}
        {view === "rounds" ? (lowWins ? "Lowest score that round" : "Top score that round") : rulesLabel}
      </SectionLabel>

      <div className="flex-1 px-5 overflow-hidden w-full relative">
        <AnimatePresence mode="wait" initial={false}>
          {view === "rounds" ? (
            <motion.div
              key="rounds"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={TRANSITION_PANEL}
              className="h-full overflow-y-auto relative z-0 pt-4 pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}>
              <ScoreHistoryPanel players={sortedPlayers} winMode={winMode} />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={TRANSITION_PANEL}
              className="h-full">
              <div
                ref={scrollContainerRef}
                className="flex flex-col h-full gap-[18px] w-full overflow-y-auto relative z-0 pt-5 pb-4"
                style={{ WebkitOverflowScrolling: "touch" }}>
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
                      <PlayerColumn {...cardProps(player)} />
                    </motion.div>
                  )}
                </LayoutGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pt-2 pb-6 flex-shrink-0">
        <button
          onClick={() => setShowEndGame(true)}
          className="neo-press font-display w-[calc(100%-6px)] h-16 flex items-center justify-center gap-2.5 bg-sun text-ink border-3 border-ink rounded-[14px] shadow-neo-lg text-xl uppercase">
          <Flag size={22} strokeWidth={2.75} />
          End game
        </button>
      </div>

      {modals}
    </div>);

}