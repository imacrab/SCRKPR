import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";
import AddPlayerModal from "@/components/scorekeeper/AddPlayerModal";
import BottomNavigationBar from "@/components/scorekeeper/BottomNavigationBar";
import History from "./History";
import AccountSettings from "./AccountSettings";

// Game state is kept in module scope and localStorage so it survives route transitions and page refreshes
let _players = [];
let _winMode = "high";
let _bestOf = null; // only set when winMode === "bestof"

const STORAGE_KEY = "scorekeeper_game_state";

function saveGameState(players, winMode, bestOf = null) {
  _players = players;
  _winMode = winMode;
  _bestOf = bestOf;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, winMode, bestOf }));
}

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { players, winMode, bestOf } = JSON.parse(saved);
      _players = players;
      _winMode = winMode;
      _bestOf = bestOf || null;
      return true;
    }
  } catch (e) {
    console.error("Failed to load game state:", e);
  }
  return false;
}

function clearGameState() {
  _players = [];
  _winMode = "high";
  _bestOf = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function getGameState() { return { players: _players, winMode: _winMode, bestOf: _bestOf }; }
export function setGameState(players, winMode, bestOf) { saveGameState(players, winMode, bestOf); }

export default function ScoreKeeper() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname; // "/", "/game", "/history", "/account"

  // Load saved game state on mount
  const [initialized, setInitialized] = useState(false);
  const [players, setPlayers] = useState(_players);
  const [winMode, setWinMode] = useState(_winMode);
  const [bestOf, setBestOf] = useState(_bestOf);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [lastAddedPlayerId, setLastAddedPlayerId] = useState(null);

  // On mount, load game state from localStorage and redirect to game if one exists
  useEffect(() => {
    if (!initialized) {
      const hasGame = loadGameState();
      setPlayers(_players);
      setWinMode(_winMode);
      setBestOf(_bestOf);
      setInitialized(true);
      
      // If game was restored and we're on home, go to game screen
      if (hasGame && _players.length > 0 && view === "/") {
        navigate("/game", { replace: true });
      }
    }
  }, [initialized, navigate, view]);

  const handleStartGame = useCallback((playerData, mode, bestOfCount = null) => {
    const initialPlayers = playerData.map((p, i) => ({
      id: i + 1,
      name: p.name || p,
      color: p.color || "#2DC5F8",
      emoji: p.emoji || "",
      scores: [],
    }));
    saveGameState(initialPlayers, mode || "high", bestOfCount);
    setPlayers(initialPlayers);
    setWinMode(mode || "high");
    setBestOf(bestOfCount);
    navigate("/game");
  }, [navigate]);

  const handleReset = useCallback(() => {
    setPlayers((prev) => {
      const reset = prev.map((p) => ({ ...p, scores: [] }));
      saveGameState(reset, _winMode, _bestOf);
      return reset;
    });
  }, []);

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
          emoji: p.emoji || "",
          total: p.scores.reduce((s, n) => s + n, 0),
          scores: p.scores,
        })),
      });
    }
    clearGameState();
    setPlayers([]);
    navigate("/");
  }, [players, navigate, winMode]);

  const handleAddScore = useCallback((playerId, score) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === playerId ? { ...p, scores: [...p.scores, score] } : p
      );
      saveGameState(next, _winMode, _bestOf);
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
      saveGameState(next, _winMode);
      return next;
    });
  }, []);

  const handleEditName = useCallback((playerId, newName) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p));
      saveGameState(next, _winMode);
      return next;
    });
  }, []);

  const handleEditColor = useCallback((playerId, color) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, color } : p));
      saveGameState(next, _winMode);
      return next;
    });
  }, []);

  const handleEditEmoji = useCallback((playerId, emoji) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, emoji } : p));
      saveGameState(next, _winMode);
      return next;
    });
  }, []);

  const handleAddPlayer = useCallback((name, color, emoji = "") => {
    setPlayers((prev) => {
      if (prev.length >= 20) return prev;
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
      const newId = maxId + 1;
      const next = [...prev, { id: newId, name, color: color || "#2DC5F8", emoji, scores: [] }];
      saveGameState(next, _winMode);
      setLastAddedPlayerId(newId);
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
          <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="w-screen overflow-hidden" style={{ height: "100dvh", paddingBottom: navHeight }}>
            <History onBack={() => navigate(-1)} onModalChange={setNavHidden} />
          </motion.div>
        )}

        {view === "/account" && (
          <motion.div key="account" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="w-screen overflow-hidden" style={{ height: "100dvh", paddingBottom: navHeight }}>
            <AccountSettings onBack={() => navigate(-1)} onModalChange={setNavHidden} />
          </motion.div>
        )}

        {view === "/" && (
          <motion.div key="setup" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="w-screen overflow-hidden" style={{ height: "100dvh", paddingBottom: navHeight }}>
            <PlayerSetup
              onStart={handleStartGame}
              onShowHistory={() => navigate("/history")}
              onShowAccount={() => navigate("/account")}
              onModalChange={setNavHidden}
            />
          </motion.div>
        )}

        {view === "/game" && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="w-screen overflow-hidden" style={{ height: "100dvh" }}>
            <ScoreBoard
              players={players}
              winMode={winMode}
              bestOf={bestOf}
              lastAddedPlayerId={lastAddedPlayerId}
              onAddScore={handleAddScore}
              onEditScore={handleEditScore}
              onEditName={handleEditName}
              onEditColor={handleEditColor}
              onEditEmoji={handleEditEmoji}
              onReset={handleReset}
              onEndGame={handleEndGame}
              onAddPlayer={() => setShowAddPlayer(true)}
            />
            <AddPlayerModal
              isOpen={showAddPlayer}
              usedColors={players.map((p) => p.color)}
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