import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";
import AddPlayerModal from "@/components/scorekeeper/AddPlayerModal";
import History from "./History";

export default function ScoreKeeper() {
  const [players, setPlayers] = useState([]);
  const [winMode, setWinMode] = useState("high");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [view, setView] = useState("setup"); // "setup" | "game" | "history"

  const handleStartGame = useCallback((playerData, mode) => {
    const initialPlayers = playerData.map((p, i) => ({
      id: i + 1,
      name: p.name || p,
      color: p.color || "#2DC5F8",
      scores: [],
    }));
    setPlayers(initialPlayers);
    setWinMode(mode || "high");
    setView("game");
  }, []);

  const handleReset = useCallback(() => {
    setPlayers([]);
    setView("setup");
  }, []);

  const handleEndGame = useCallback(async () => {
    if (players.length === 0) return;
    const hasScores = players.some((p) => p.scores.length > 0);
    if (hasScores) {
      await base44.entities.GameHistory.create({
        played_at: new Date().toISOString(),
        players: players.map((p) => ({
          name: p.name,
          color: p.color,
          total: p.scores.reduce((s, n) => s + n, 0),
          scores: p.scores,
        })),
      });
    }
    setPlayers([]);
    setView("setup");
  }, [players]);

  const handleAddScore = useCallback((playerId, score) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, scores: [...p.scores, score] } : p
      )
    );
  }, []);

  const handleEditScore = useCallback((playerId, scoreIndex, newScore) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const newScores = [...p.scores];
        newScores[scoreIndex] = newScore;
        return { ...p, scores: newScores };
      })
    );
  }, []);

  const handleEditName = useCallback((playerId, newName) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p))
    );
  }, []);

  const handleEditColor = useCallback((playerId, color) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, color } : p))
    );
  }, []);

  const handleAddPlayer = useCallback((name) => {
    setPlayers((prev) => {
      if (prev.length >= 20) return prev;
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
      return [...prev, { id: maxId + 1, name, scores: [] }];
    });
    setShowAddPlayer(false);
  }, []);

  if (view === "history") {
    return <History onBack={() => setView("setup")} />;
  }

  if (view === "setup") {
    return (
      <PlayerSetup
        onStart={handleStartGame}
        onShowHistory={() => setView("history")}
      />
    );
  }

  return (
    <>
      <ScoreBoard
        players={players}
        onAddScore={handleAddScore}
        onEditScore={handleEditScore}
        onEditName={handleEditName}
        onEditColor={handleEditColor}
        onReset={handleReset}
        onEndGame={handleEndGame}
        onAddPlayer={() => setShowAddPlayer(true)}
      />
      <AddPlayerModal
        isOpen={showAddPlayer}
        onAdd={handleAddPlayer}
        onClose={() => setShowAddPlayer(false)}
      />
    </>
  );
}