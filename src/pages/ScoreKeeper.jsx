import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
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

  const pageVariants = {
    initial: { opacity: 0, filter: "blur(12px)", scale: 0.97 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit:    { opacity: 0, filter: "blur(12px)", scale: 1.02 },
  };
  const pageTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

  return (
    <AnimatePresence mode="wait">
      {view === "history" && (
        <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden">
          <History onBack={() => setView("setup")} />
        </motion.div>
      )}

      {view === "setup" && (
        <motion.div key="setup" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden">
          <PlayerSetup onStart={handleStartGame} onShowHistory={() => setView("history")} />
        </motion.div>
      )}

      {view === "game" && (
        <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}