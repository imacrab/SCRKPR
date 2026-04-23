import { useState } from "react";
import { RotateCcw, UserPlus } from "lucide-react";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";

export default function ScoreBoard({ players, onAddScore, onEditScore, onEditName, onReset, onAddPlayer }) {
  const [activePlayer, setActivePlayer] = useState(null);
  const [editingScore, setEditingScore] = useState(null);

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

  const colWidth = players.length <= 4 ? `${100 / players.length}%` : "25%";

  return (
    <div className="h-screen app-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <h1 className="font-display text-xl text-gradient font-bold">ScorKeep</h1>
        <div className="flex items-center gap-2">
          {players.length < 20 && (
            <button
              onClick={onAddPlayer}
              className="flex items-center gap-1.5 text-[#c8c8c8] text-xs font-medium py-1.5 px-3 rounded-full transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
              aria-label="Add player"
            >
              <UserPlus size={12} />
              Add Player
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[#c8c8c8] text-xs font-medium py-1.5 px-3 rounded-full transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <RotateCcw size={12} />
            New Game
          </button>
        </div>
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