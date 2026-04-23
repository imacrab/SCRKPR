import { useState, useCallback } from "react";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";

export default function ScoreKeeper() {
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = useCallback((playerNames) => {
    const initialPlayers = playerNames.map((name, i) => ({
      id: i + 1,
      name,
      scores: [],
    }));
    setPlayers(initialPlayers);
    setGameStarted(true);
  }, []);

  const handleReset = useCallback(() => {
    setPlayers([]);
    setGameStarted(false);
  }, []);

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

  if (!gameStarted) {
    return <PlayerSetup onStart={handleStartGame} />;
  }

  return (
    <ScoreBoard
      players={players}
      onAddScore={handleAddScore}
      onEditScore={handleEditScore}
      onEditName={handleEditName}
      onReset={handleReset}
    />
  );
}