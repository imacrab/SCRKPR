import { useState, useCallback, useEffect } from "react";
import { db } from "@/lib/store";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import PlayerSetup from "@/components/scorekeeper/PlayerSetup";
import ScoreBoard from "@/components/scorekeeper/ScoreBoard";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import BottomNavigationBar from "@/components/scorekeeper/BottomNavigationBar";
import History from "./History";
import Players from "./Players";
import AccountSettings from "./AccountSettings";
import { TRANSITION_PAGE, SPRING_SHEET } from "@/lib/motion";
import { ACCENT_BLUE } from "@/lib/colors";
import logoDark from "@/assets/scrkpr-logo.svg";

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

  // Persistent app-level SCRKPR logo. It lives OUTSIDE the page AnimatePresence
  // so it never unmounts, and glides/resizes between each page's logo slot —
  // a shared-element transition that mode="wait" otherwise makes impossible
  // (the two pages never coexist for a layoutId tween). Each page renders an
  // invisible [data-logo-anchor] in its real slot; we measure that and transform
  // the floating logo to match. The rendered logo keeps one stable base width
  // and animates via scale, so it does not resize first and then drift into place.
  const LOGO_BASE_WIDTH = 200;
  const [logoBox, setLogoBox] = useState({ x: 0, y: 0, scale: 1, visible: false, ready: false });

  const measureLogo = useCallback(() => {
    if (view !== "/" && view !== "/game") {
      setLogoBox((b) => (b.ready ? { ...b, visible: false } : b));
      return;
    }
    const el = document.querySelector("[data-logo-anchor]");
    if (!el) return; // anchor not mounted yet (mid-transition) — keep last box
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    setLogoBox({ x: r.left, y: r.top, scale: r.width / LOGO_BASE_WIDTH, visible: true, ready: true });
  }, [view]);

  // Hide immediately on pages without a logo anchor. Home/game measure from
  // onAnimationComplete so we read the settled anchor, not the page-enter scale.
  useEffect(() => {
    if (view !== "/" && view !== "/game") {
      setLogoBox((b) => (b.ready ? { ...b, visible: false } : b));
    }
  }, [view]);

  useEffect(() => {
    window.addEventListener("resize", measureLogo);
    return () => window.removeEventListener("resize", measureLogo);
  }, [measureLogo]);

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
      cardStyle: p.cardStyle === "gradient" ? "gradient" : "solid",
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
      try {
        await db.games.create({
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
      } catch (e) {
        // Saving history should never block ending the game.
        console.error("Failed to save game to history:", e);
      }
    }
    clearGameState();
    setPlayers([]);
    setTargetScore(null);
    navigate("/");
  }, [players, navigate, winMode]);

  // Pause: stash the FULL live game (scores, mode, target) under a name so it
  // can be resumed from History → Saved, then clear the board and go home.
  const handlePauseGame = useCallback(async (name) => {
    if (players.length === 0) return;
    try {
      await db.savedGames.create({
        name: (name && name.trim()) || "Saved game",
        saved_at: new Date().toISOString(),
        win_mode: winMode,
        best_of: bestOf,
        target_score: targetScore,
        players,
      });
    } catch (e) {
      // Saving shouldn't strand the user on the board.
      console.error("Failed to save game for later:", e);
    }
    clearGameState();
    setPlayers([]);
    setTargetScore(null);
    navigate("/");
  }, [players, winMode, bestOf, targetScore, navigate]);

  // Resume a saved game: restore it as the active game, remove it from the
  // saved list (it's live again), and jump to the board.
  const handleResumeGame = useCallback(async (saved) => {
    if (!saved || !Array.isArray(saved.players)) return;
    const mode = saved.win_mode || "high";
    const best = saved.best_of ?? null;
    const target = saved.target_score ?? null;
    saveGameState(saved.players, mode, best, target);
    setPlayers(saved.players);
    setWinMode(mode);
    setBestOf(best);
    setTargetScore(target);
    try {
      await db.savedGames.delete(saved.id);
    } catch (e) {
      console.error("Failed to remove resumed game from saved list:", e);
    }
    navigate("/game");
  }, [navigate]);

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

  const handleEditCardStyle = useCallback((playerId, cardStyle) => {
    setPlayers((prev) => {
      const next = prev.map((p) => (p.id === playerId ? { ...p, cardStyle } : p));
      saveGameState(next, _winMode, _bestOf, _targetScore);
      return next;
    });
  }, []);

  const handleAddPlayer = useCallback((name, color, emoji = "", cardStyle = "solid") => {
    setPlayers((prev) => {
      if (prev.length >= 20) return prev;
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
      const newId = maxId + 1;
      const next = [...prev, { id: newId, name, color: color || ACCENT_BLUE, emoji, cardStyle, scores: [] }];
      saveGameState(next, _winMode, _bestOf, _targetScore);
      setLastAddedPlayerId(newId);
      return next;
    });
    setShowAddPlayer(false);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, filter: "blur(12px)", scale: 0.97, zIndex: 1 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1, zIndex: 1, pointerEvents: "auto" },
  };
  const pageTransition = TRANSITION_PAGE;
  const pageClassName = "absolute inset-0 w-screen overflow-hidden";

  // Height reserved for the bottom nav bar (hidden on /game)
  // 56pt tab bar + safe-area inset. Pages reserve this space so content
  // never sits under the bar.
  const navHeight = view === "/game" ? "0px" : "calc(56px + env(safe-area-inset-bottom))";

  return (
    <>
      <div className="relative w-screen overflow-hidden" style={{ height: "100%" }}>
        {view === "/history" && (
          <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" transition={pageTransition} className={pageClassName} style={{ height: "100%", paddingBottom: navHeight }}>
            <History onBack={() => navigate(-1)} onResumeGame={handleResumeGame} onModalChange={setNavHidden} />
          </motion.div>
        )}

        {view === "/players" && (
          <motion.div key="players" variants={pageVariants} initial="initial" animate="animate" transition={pageTransition} className={pageClassName} style={{ height: "100%", paddingBottom: navHeight }}>
            <Players onBack={() => navigate(-1)} onModalChange={setNavHidden} />
          </motion.div>
        )}

        {view === "/account" && (
          <motion.div key="account" variants={pageVariants} initial="initial" animate="animate" transition={pageTransition} className={pageClassName} style={{ height: "100%", paddingBottom: navHeight }}>
            <AccountSettings onBack={() => navigate(-1)} onModalChange={setNavHidden} />
          </motion.div>
        )}

        {view === "/" && (
          <motion.div key="setup" variants={pageVariants} initial="initial" animate="animate" transition={pageTransition} onAnimationComplete={measureLogo} className={pageClassName} style={{ height: "100%", paddingBottom: navHeight }}>
            <PlayerSetup
              onStart={handleStartGame}
              onShowHistory={() => navigate("/history")}
              onShowAccount={() => navigate("/account")}
              onModalChange={setNavHidden}
            />
          </motion.div>
        )}

        {view === "/game" && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" transition={pageTransition} onAnimationComplete={measureLogo} className={pageClassName} style={{ height: "100%" }}>
            <ScoreBoard
              players={players}
              winMode={winMode}
              bestOf={bestOf}
              targetScore={targetScore}
              lastAddedPlayerId={lastAddedPlayerId}
              addPlayerModalOpen={showAddPlayer}
              onAddScore={handleAddScore}
              onEditScore={handleEditScore}
              onEditName={handleEditName}
              onEditColor={handleEditColor}
              onEditEmoji={handleEditEmoji}
              onEditCardStyle={handleEditCardStyle}
              onReset={handleReset}
              onEndGame={handleEndGame}
              onPauseGame={handlePauseGame}
              onAddPlayer={() => setShowAddPlayer(true)}
              onModalChange={setNavHidden}
            />
            <PlayerEditModal
              isOpen={showAddPlayer}
              player={null}
              usedColors={players.map((p) => p.color)}
              usedEmojis={players.map((p) => p.emoji).filter(Boolean)}
              onSave={({ name, color, emoji, cardStyle }) => handleAddPlayer(name, color, emoji, cardStyle)}
              onClose={() => setShowAddPlayer(false)}
            />
          </motion.div>
        )}
      </div>

      {/* Persistent SCRKPR logo — glides between the home + game logo slots.
          z-30 keeps it above page content but below modals (backdrop z-40).
          pointer-events:none so taps fall through to the invisible in-page
          logo button beneath (which still opens End Game on the game screen). */}
      {logoBox.ready && (
        <motion.img
          src={logoDark}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="fixed left-0 top-0 z-30 pointer-events-none select-none"
          style={{ width: LOGO_BASE_WIDTH, height: "auto", transformOrigin: "top left" }}
          initial={{ x: logoBox.x, y: logoBox.y, scale: logoBox.scale, opacity: 0 }}
          animate={{
            x: logoBox.x,
            y: logoBox.y,
            scale: logoBox.scale,
            opacity: logoBox.visible ? 1 : 0,
          }}
          transition={{ x: SPRING_SHEET, y: SPRING_SHEET, scale: SPRING_SHEET, opacity: { duration: 0.2 } }}
        />
      )}

      {/* Gradient fade so scrolling content fades to background 8px above the tab bar.
          Hidden alongside the nav when a modal is open — page-level fixed overlays
          would otherwise paint on top of modals (transformed page wrappers trap
          modal z-index in a lower stacking context). */}
      {view !== "/game" && view !== "/" && !navHidden && (
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