import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";

export default function ScoreBoard({ players, onAddScore, onEditScore, onEditName, onReset }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [editingScore, setEditingScore] = useState(null); // { playerId, scoreIndex }

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

  // Min 4 columns visible, scroll if more
  const colMinWidth = 25; // percent — 4 cols = 100%
  const colWidth = players.length <= 4 ? `${100 / players.length}%` : `${colMinWidth}%`;

  return (
    <div className="h-screen gradient-surface flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0">
        <h1 className="font-display text-xl text-gradient font-bold">ScoreKeeper</h1>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium py-1.5 px-3 rounded-full bg-white/60 border border-border/50 hover:bg-white transition-all"
        >
          <RotateCcw size={12} />
          New Game
        </button>
      </div>

      {/* Columns container */}
      <div className="flex-1 overflow-hidden flex">
        <div
          className="flex h-full overflow-x-auto"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {players.map((player) => (
            <div
              key={player.id}
              style={{ minWidth: colWidth, width: colWidth, scrollSnapAlign: "start" }}
              className="h-full flex-shrink-0"
            >
              <PlayerColumn
                player={player}
                onAddScore={() => handleOpenScore(player)}
                onEditScore={(idx) => handleEditScore(player, idx)}
                onEditName={(name) => onEditName(player.id, name)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Score input modal */}
      <ScoreInputModal
        player={activePlayer}
        editingIndex={editingScore?.scoreIndex ?? null}
        isOpen={!!activePlayer}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </div>
  );
}