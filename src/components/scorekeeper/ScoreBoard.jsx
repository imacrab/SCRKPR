import { useState, useEffect, useCallback } from "react";
import { RotateCcw, UserPlus, FlagOff, MoreHorizontal, Maximize, Minimize } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";
import EditPlayerModal from "./EditPlayerModal";
import EndGameModal from "./EndGameModal";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ScoreBoard({ players, winMode, onAddScore, onEditScore, onEditName, onEditColor, onReset, onAddPlayer, onEndGame }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [streakMap, setStreakMap] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    base44.entities.GameHistory.list("-played_at", 20).then((games) => {
      // For each current player, count consecutive wins from most recent game
      const map = {};
      players.forEach((player) => {
        let streak = 0;
        for (const game of games) {
          const isLowWin = game.win_mode === "low";
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

  const handleOpenScore = (player) => {
    setActivePlayer(player);
    setEditingScore(null);
  };

  const handleEditScore = (player, scoreIndex) => {
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

  const handleSavePlayer = ({ name, color }) => {
    if (!editingPlayer) return;
    onEditName(editingPlayer.id, name);
    onEditColor(editingPlayer.id, color);
    setEditingPlayer(null);
  };

  const colWidth = players.length <= 4 ? `${100 / players.length}vw` : "25vw";

  return (
    <div className="w-screen bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0 border-b border-border" style={{ backgroundColor: "hsl(var(--card) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <img src="https://media.base44.com/images/public/69ea763700078809357a164a/bbacfd24a_SCRKPR.png" alt="SCRKPR!" style={{ maxWidth: 120, height: "auto" }} />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <MoreHorizontal size={24} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1.5 bg-card border-border">
            {players.length < 20 && (
              <button
                onClick={onAddPlayer}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
              >
                <UserPlus size={24} className="text-muted-foreground" />
                Add Player
              </button>
            )}
            <button
              onClick={onReset}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw size={24} className="text-muted-foreground" />
              Reset Scores
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => setShowEndGame(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: "#FF3A3A", backgroundColor: "rgba(255,58,58,0.08)" }}
            >
              <FlagOff size={24} />
              End Game
            </button>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-hidden w-full">
        <div
          className="flex h-full w-full overflow-x-auto"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {players.map((player) => (
            <div
              key={player.id}
              style={{ minWidth: colWidth, width: colWidth, scrollSnapAlign: "start", flexShrink: 0 }}
              className="h-full"
            >
              <PlayerColumn
                player={player}
                streak={streakMap[player.name] || 0}
                onAddScore={() => handleOpenScore(player)}
                onEditScore={(idx) => handleEditScore(player, idx)}
                onEditPlayer={() => setEditingPlayer(player)}
              />
            </div>
          ))}
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

      <EndGameModal
        isOpen={showEndGame}
        players={players}
        winMode={winMode}
        onConfirm={() => { setShowEndGame(false); onEndGame(); }}
        onCancel={() => setShowEndGame(false)}
      />
    </div>
  );
}