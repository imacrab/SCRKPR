import { useState } from "react";
import { RotateCcw, UserPlus } from "lucide-react";
import PlayerColumn from "./PlayerColumn";
import ScoreInputModal from "./ScoreInputModal";
import { Button } from "@/components/ui/button";

export default function ScoreBoard({ players, onAddScore, onEditScore, onEditName, onEditColor, onReset, onAddPlayer }) {
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

  const colWidth = players.length <= 4 ? `${100 / players.length}vw` : "25vw";

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0 bg-card border-b border-border">
        <h1 className="font-sans font-medium text-lg text-foreground">
          Scorkeepr
        </h1>
        <div className="flex items-center gap-2">
          {players.length < 20 && (
            <Button
              onClick={onAddPlayer}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <UserPlus size={12} />
              Add
            </Button>
          )}
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-accent-red gap-1.5"
          >
            <RotateCcw size={12} />
            New Game
          </Button>
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
                onAddScore={() => handleOpenScore(player)}
                onEditScore={(idx) => handleEditScore(player, idx)}
                onEditName={(name) => onEditName(player.id, name)}
                onEditColor={(color) => onEditColor(player.id, color)}
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