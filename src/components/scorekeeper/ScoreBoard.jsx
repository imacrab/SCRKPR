import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MoreHorizontal, Shuffle } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { base44 } from "@/api/base44Client";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";
import EditPlayerModal from "./EditPlayerModal";
import EndGameModal from "./EndGameModal";
import GameMenuModal from "./GameMenuModal";
import { isLowMode, isCircleMode } from "@/lib/gameModes";

export default function ScoreBoard({ players, winMode, bestOf, targetScore, lastAddedPlayerId, onAddScore, onEditScore, onEditName, onEditColor, onEditEmoji, onReset, onAddPlayer, onEndGame }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [streakMap, setStreakMap] = useState({});
  const [gameStartTime] = useState(new Date());
  const [scrollPos, setScrollPos] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);


  useEffect(() => {
    base44.entities.GameHistory.list("-played_at", 20).then((games) => {
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
    });
  }, []);
  const [editingScore, setEditingScore] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEndGame, setShowEndGame] = useState(false);

  // For bestof: first to ceil(N/2) wins. For phase10: complete all 10 phases.
  const winsNeeded = bestOf
    ? (winMode === "phase10" ? bestOf : Math.ceil(bestOf / 2))
    : null;
  const circleMode = isCircleMode(winMode);

  // Sort players by total score — direction toggled by user
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const totalA = a.scores.reduce((s, n) => s + n, 0);
      const totalB = b.scores.reduce((s, n) => s + n, 0);
      return sortDesc ? totalB - totalA : totalA - totalB;
    });
  }, [players, sortDesc]);

  // Auto-end when someone reaches winsNeeded in bestof / phase10 mode
  useEffect(() => {
    if (!circleMode || !winsNeeded) return;
    const winner = players.find((p) => p.scores.reduce((s, n) => s + n, 0) >= winsNeeded);
    if (winner) {
      setTimeout(() => setShowEndGame(true), 400);
    }
  }, [players, circleMode, winsNeeded]);

  // Auto-end when any player reaches the target score (Gin Rummy, Swish, etc.)
  // For round-based modes, wait until all players have logged the same number of scores
  // (i.e. the current round is complete) before ending.
  useEffect(() => {
    if (!targetScore || circleMode) return;
    const reached = players.some((p) => {
      const total = p.scores.reduce((s, n) => s + n, 0);
      return total >= targetScore;
    });
    if (!reached) return;

    // Round complete = every player has the same number of scores logged
    const counts = players.map((p) => p.scores.length);
    const roundComplete = counts.every((c) => c === counts[0]);
    if (!roundComplete) return;

    setTimeout(() => setShowEndGame(true), 400);
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
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0" style={{backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <button onClick={() => setShowEndGame(true)} className="hover:opacity-75 transition-opacity">
          <img src={isDarkMode ? "https://media.base44.com/images/public/69ea763700078809357a164a/87badac38_SCRKPR_dark_mode.png" : "https://media.base44.com/images/public/69ea763700078809357a164a/6de7dc994_SCRKPR_light_mode.png"} alt="SCRKPR!" style={{ maxWidth: 120, height: "auto" }} />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={sortDesc ? "Sort lowest to highest" : "Sort highest to lowest"}
          >
            <Shuffle size={22} strokeWidth={2} />
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <MoreHorizontal size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Rows — one player per row, sorted by total */}
      <div className="flex-1 px-2 pb-2 overflow-hidden w-full relative">
        <div
          ref={scrollContainerRef}
          className="flex flex-col h-full gap-2 w-full overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <LayoutGroup>
            {sortedPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                layout
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="w-full flex-shrink-0"
              >
                <PlayerColumn
                  player={player}
                  isHighlighted={player.id === lastAddedPlayerId}
                  streak={streakMap[player.name] || 0}
                  winsNeeded={winsNeeded}
                  isFirst={idx === 0}
                  isLast={idx === sortedPlayers.length - 1}
                  onAddScore={() => handleOpenScore(player)}
                  onQuickScore={(delta) => onAddScore(player.id, delta)}
                  onEditScore={(i) => handleEditScore(player, i)}
                  onEditPlayer={() => setEditingPlayer(player)}
                />
              </motion.div>
            ))}
          </LayoutGroup>
        </div>
      </div>

      <ScoreInputModal
        player={activePlayer}
        editingIndex={editingScore?.scoreIndex ?? null}
        isOpen={!!activePlayer}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />

      <EditPlayerModal
        player={editingPlayer}
        isOpen={!!editingPlayer}
        onSave={handleSavePlayer}
        onClose={() => setEditingPlayer(null)}
      />

      <GameMenuModal
        isOpen={menuOpen}
        canAddPlayer={players.length < 20}
        onAddPlayer={onAddPlayer}
        onResetScores={onReset}
        onEndGame={() => setShowEndGame(true)}
        onClose={() => setMenuOpen(false)}
      />

      <EndGameModal
        isOpen={showEndGame}
        players={players}
        winMode={winMode}
        gameStartTime={gameStartTime}
        onConfirm={() => { setShowEndGame(false); onEndGame(); }}
        onCancel={() => setShowEndGame(false)}
      />
    </div>
  );
}