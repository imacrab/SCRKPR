import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";
import AddPlayerModal from "@/components/scorekeeper/AddPlayerModal";
import BottomNavigationBar from "@/components/scorekeeper/BottomNavigationBar";
import History from "./History";
import AccountSettings from "./AccountSettings";

// Game state is kept in module scope so it survives route transitions
let _players = [];
let _winMode = "high";

export function getGameState() { return { players: _players, winMode: _winMode }; }
export function setGameState(players, winMode) { _players = players; _winMode = winMode; }

export default function ScoreKeeper() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname; // "/", "/game", "/history", "/account"

  const [players, setPlayers] = useState(_players);
  const [winMode, setWinMode] = useState(_winMode);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  const handleStartGame = useCallback((playerData, mode) => {
    const initialPlayers = playerData.map((p, i) => ({
      id: i + 1,
      name: p.name || p,
      color: p.color || "#2DC5F8",
      scores: [],
    }));
    _players = initialPlayers;
    _winMode = mode || "high";
    setPlayers(initialPlayers);
    setWinMode(mode || "high");
    navigate("/game");
  }, [navigate]);

  const handleReset = useCallback(() => {
    _players = [];
    setPlayers([]);
    navigate("/");
  }, [navigate]);

  const handleEndGame = useCallback(async () => {
    if (players.length === 0) return;
    const hasScores = players.some((p) => p.scores.length > 0);
    if (hasScores) {
      await base44.entities.GameHistory.create({
        played_at: new Date().toISOString(),
        win_mode: winMode,
        players: players.map((p) => ({
          name: p.name,
          color: p.color,
          total: p.scores.reduce((s, n) => s + n, 0),
          scores: p.scores,
        })),
      });
    }
    _players = [];
    setPlayers([]);
    navigate("/");
  }, [players, navigate]);

  const handleAddScore = useCallback((playerId, score) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === playerId ? { ...p, scores: [...p.scores, score] } : p
      );
      _players = next;
      return next;
    });
  }, []);

  const handleEditScore = useCallback((playerId, scoreIndex, newScore) => {
    setPlayers((prev) => {
      const next = prev.map((p) => {
        if (p.id !== playerId) return p;
        const newScores = [...p.scores];
        newScores[scoreIndex] = newScore;
        return { ...p, scores: newScores };
      });
      _players = next;
      return next;
    });
  }, []);

  const handleEditName = useCallback((playerId, newName) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p));
      _players = next;
      return next;
    });
  }, []);

  const handleEditColor = useCallback((playerId, color) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, color } : p));
      _players = next;
      return next;
    });
  }, []);

  const handleAddPlayer = useCallback((name) => {
    setPlayers((prev) => {
      if (prev.length >= 20) return prev;
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
      const next = [...prev, { id: maxId + 1, name, scores: [] }];
      _players = next;
      return next;
    });
    setShowAddPlayer(false);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, filter: "blur(12px)", scale: 0.97 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit:    { opacity: 0, filter: "blur(12px)", scale: 1.02 },
  };
  const pageTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

  // Height reserved for the bottom nav bar (hidden on /game)
  const navHeight = view === "/game" ? "0px" : "calc(56px + env(safe-area-inset-bottom))";

  return (
    <>
      <AnimatePresence mode="wait">
        {view === "/history" && (
          <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden" style={{ paddingBottom: navHeight }}>
            <History onBack={() => navigate(-1)} />
          </motion.div>
        )}

        {view === "/account" && (
          <motion.div key="account" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden" style={{ paddingBottom: navHeight }}>
            <AccountSettings onBack={() => navigate(-1)} />
          </motion.div>
        )}

        {view === "/" && (
          <motion.div key="setup" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden" style={{ paddingBottom: navHeight }}>
            <PlayerSetup
              onStart={handleStartGame}
              onShowHistory={() => navigate("/history")}
              onShowAccount={() => navigate("/account")}
              onModalChange={setNavHidden}
            />
          </motion.div>
        )}

        {view === "/game" && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-screen w-screen overflow-hidden">
            <ScoreBoard
              players={players}
              winMode={winMode}
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

      <BottomNavigationBar hidden={navHidden} />
    </>
  );
}