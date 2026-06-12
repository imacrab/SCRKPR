import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import BottomNavigationBar from "@/components/scorekeeper/BottomNavigationBar";
import History from "./History";
import Players from "./Players";
import AccountSettings from "./AccountSettings";
import { TRANSITION_PAGE } from "@/lib/motion";
import { ACCENT_BLUE } from "@/lib/colors";

// Game state persists across route transitions and page refreshes via module scope + localStorage
let _players = [];
let _winMode = "high";
let _bestOf = null; // only set when winMode === "bestof"
let _targetScore = null; // when set, reaching it auto-ends the game

const STORAGE_KEY = "scorekeeper_game_state";

function saveGameState(players, winMode, bestOf = null, targetScore = null) {
  _players = players;
  _winMode = winMode;
  _bestOf = bestOf;
  _targetScore = targetScore;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, winMode, bestOf, targetScore }));
}

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { players, winMode, bestOf, targetScore } = JSON.parse(saved);
      _players = players;
      _winMode = winMode;
      _bestOf = bestOf || null;
      _targetScore = targetScore || null;
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
  _targetScore = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function getGameState() { return { players: _players, winMode: _winMode, bestOf: _bestOf, targetScore: _targetScore }; }
export function setGameState(players, winMode, bestOf, targetScore) { saveGameState(players, winMode, bestOf, targetScore); }

export default function ScoreKeeper() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname; // "/", "/game", "/history", "/account"

  // Load saved game state on mount
  const [initialized, setInitialized] = useState(false);
  const [players, setPlayers] = useState(_players);
  const [winMode, setWinMode] = useState(_winMode);
  const [bestOf, setBestOf] = useState(_bestOf);
  const [targetScore, setTargetScore] = useState(_targetScore);
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
      setTargetScore(_targetScore);
      setInitialized(true);
      
      // If game was restored and we're on home, go to game screen
      if (hasGame && _players.length > 0 && view === "/") {
        navigate("/game", { replace: true });
      }
    }
  }, [initialized, navigate, view]);

  const handleStartGame = useCallback((playerData, mode, bestOfCount = null, target = null) => {
    const initialPlayers = playerData.map((p, i) => ({
      id: i + 1,
      name: p.name || p,
      color: p.color || ACCENT_BLUE,
      emoji: p.emoji || "",
      scores: [],
    }));
    saveGameState(initialPlayers, mode || "high", bestOfCount, target);
    setPlayers(initialPlayers);
    setWinMode(mode || "high");
    setBestOf(bestOfCount);
    setTargetScore(target);
    navigate("/game");
  }, [navigate]);

  const handleReset = useCallback(() => {
    setPlayers((prev) => {
      const reset = prev.map((p) => ({ ...p, scores: [] }));
      saveGameState(reset, _winMode, _bestOf, _targetScore);
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
    setTargetScore(null);
    navigate("/");
  }, [players, navigate, winMode]);

  const handleAddScore = useCallback((playerId, score) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === playerId ? { ...p, scores: [...p.scores, score] } : p
      );
      saveGameState(next, _winMode, _bestOf, _targetScore);
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
      saveGameState(next, _winMode, _bestOf, _targetScore);
      return next;
    });
  }, []);

  const handleEditName = useCallback((playerId, newName) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p));
      saveGameState(next, _winMode, _bestOf, _targetScore);
      return next;
    });
  }, []);

  const handleEditColor = useCallback((playerId, color) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, color } : p));
      saveGameState(next, _winMode, _bestOf, _targetScore);
      return next;
    });
  }, []);

  const handleEditEmoji = useCallback((playerId, emoji) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, emoji } : p));
      saveGameState(next, _winMode, _bestOf, _targetScore);
      return next;
    });
  }, []);

  const handleAddPlayer = useCallback((name, color, emoji = "") => {
    setPlayers((prev) => {
      if (prev.length >= 20) return prev;
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
      const newId = maxId + 1;
      const next = [...prev, { id: newId, name, color: color || ACCENT_BLUE, emoji, scores: [] }];
      saveGameState(next, _winMode, _bestOf, _targetScore);
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
  const pageTransition = TRANSITION_PAGE;

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

        {view === "/players" && (
          <motion.div key="players" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="w-screen overflow-hidden" style={{ height: "100dvh", paddingBottom: navHeight }}>
            <Players onBack={() => navigate(-1)} onModalChange={setNavHidden} />
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
              targetScore={targetScore}
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
            <PlayerEditModal
              isOpen={showAddPlayer}
              player={null}
              usedColors={players.map((p) => p.color)}
              onSave={({ name, color, emoji }) => handleAddPlayer(name, color, emoji)}
              onClose={() => setShowAddPlayer(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient fade so scrolling content fades to background 8px above the tab bar */}
      {view !== "/game" && view !== "/" && (
        <div
          className="fixed inset-x-0 z-20 pointer-events-none"
          style={{
            bottom: "calc(56px + env(safe-area-inset-bottom) + 8px)",
            height: "64px",
            background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0) 100%)",
          }}
        />
      )}

      <BottomNavigationBar hidden={navHidden} />
    </>
  );
}
