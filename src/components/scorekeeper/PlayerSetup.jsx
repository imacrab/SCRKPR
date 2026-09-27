import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Plus, Check, Star, Spade, ChevronRight } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { db } from "@/lib/store";
import BestOfModal from "./BestOfModal";
import GameModeModal from "./GameModeModal";
import PlayerEditModal from "./PlayerEditModal";
import { getModeMeta } from "@/lib/gameModes";
import { toNeoColor } from "@/lib/colors";
import { LogoSticker, SectionLabel, PlayerTile, PageTitle, PAGE_TOP, WIDE_PAGE_TOP, WIDE_PANEL } from "./neo";
import { DUR_MEDIUM } from "@/lib/motion";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";
import { useGameModeToggles } from "@/lib/useGameModeToggles";
import { useIntroReveal } from "@/lib/useIntroReveal";
import { useWideLayout } from "@/lib/useWideLayout";
import NeoIcon from "./NeoIcon";

function lineupLabel(players) {
  const names = players.map((p) => p.name);
  if (names.length <= 2) return names.join(" & ");
  if (names.length === 3) return `${names[0]}, ${names[1]} & ${names[2]}`;
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
}

// Order matches the picker; used to pick a sensible default when the
// currently-selected mode is disabled in settings.
const DEFAULT_MODE_ORDER = ["swish", "ginrummy", "hotdice", "phase10", "skipbo", "low", "high", "bestof"];
const OPTIONAL_MODE_IDS = new Set(["swish", "ginrummy", "hotdice", "phase10", "skipbo"]);
const isModeVisible = (mode, toggles) =>
  !OPTIONAL_MODE_IDS.has(mode) || toggles[mode] !== false;
const firstVisibleMode = (toggles) =>
  DEFAULT_MODE_ORDER.find((m) => isModeVisible(m, toggles)) || "high";

export default function PlayerSetup({ onStart, onModalChange }) {
  const [allPlayers, setAllPlayers] = useState(null); // null = loading
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [scrolledFromTop, setScrolledFromTop] = useState(false);
  const { toggles: modeToggles } = useGameModeToggles();
  const { phase: introPhase, reveal } = useIntroReveal();
  const wide = useWideLayout();
  // Initial default assumes all modes visible; the effect below corrects it
  // on mount using the real toggles from settings.
  const [winMode, setWinMode] = useState(() => firstVisibleMode({}));
  const [targetScore, setTargetScore] = useState(500); // Swish locks to 500; high/low can override

  // If the currently-selected mode gets disabled from Settings, fall back to
  // the first visible one so the pill on the home screen never shows a mode
  // the user just turned off.
  useEffect(() => {
    if (!isModeVisible(winMode, modeToggles)) {
      const next = firstVisibleMode(modeToggles);
      setWinMode(next);
      setTargetScore(next === "swish" ? 500 : next === "ginrummy" ? 100 : next === "hotdice" ? 10000 : next === "skipbo" ? 500 : null);
    }
  }, [modeToggles, winMode]);
  const [showBestOf, setShowBestOf] = useState(false);
  const [showGameMode, setShowGameMode] = useState(false);
  const [tappedId, setTappedId] = useState(null);
  const [poppedId, setPoppedId] = useState(null); // star that just bounced
  const tapTimerRef = useRef(null);
  const scrollRef = useRef(null);

  // --- FLIP reordering -----------------------------------------------------
  // Smoothly animates rows to new positions whenever the list reorders — when
  // a player is toggled (the card flies between the selected/unselected lists)
  // and on drag-drop (sibling cards glide to their new slots instead of
  // snapping). We use manual FLIP on a plain wrapper rather than framer's
  // `layout`, because framer shared-layout deadlocks the page-transition
  // AnimatePresence (mode="wait"). Positions are keyed by player id in viewport
  // coordinates so a card can be tracked even across the two separate lists.
  const rowTops = useRef(new Map()); // id -> last settled viewport top
  const flippingIds = useRef(new Set()); // ids mid-FLIP (don't re-measure)
  const isDraggingRef = useRef(false); // true while a dnd drag is in flight
  const dropCooldownRef = useRef(false); // true through dnd's post-drop settle

  // Single-list reorder model: all players live in ONE Droppable, selected on
  // top (re-orderable) then unselected (drag-disabled). dnd owns drag reorders
  // natively (no FLIP fights its drop). FLIP runs ONLY for selection toggles —
  // where the card stays mounted and just changes slot — so it glides cleanly.
  const refreshRowTops = () => {
    const c = scrollRef.current;
    if (!c) return;
    c.querySelectorAll("[data-row-id]").forEach((el) => {
      const id = el.dataset.rowId;
      if (!flippingIds.current.has(id)) rowTops.current.set(id, el.getBoundingClientRect().top);
    });
  };

  // Entrance + FLIP, both done with manual DOM transforms (no framer) so the
  // invert is applied synchronously before paint — no one-frame flash — and
  // nothing fights dnd. Rows are plain divs; their inner card owns the
  // drag/cinch transforms, this outer div owns entrance + reorder glide.
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const animateTo = (el, transition, transform, opacity) => {
    requestAnimationFrame(() => {
      el.style.transition = transition;
      el.style.transform = transform;
      if (opacity != null) el.style.opacity = opacity;
      const done = (e) => {
        if (e.propertyName !== "transform") return;
        el.removeEventListener("transitionend", done);
        el.style.transition = "";
        el.style.transform = "";
        el.style.opacity = "";
        flippingIds.current.delete(el.dataset.rowId);
        rowTops.current.set(el.dataset.rowId, el.getBoundingClientRect().top);
      };
      el.addEventListener("transitionend", done);
    });
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const els = container.querySelectorAll("[data-row-id]");

    // While dnd is dragging OR settling its drop, dnd owns all transforms.
    if (isDraggingRef.current || dropCooldownRef.current) {
      refreshRowTops();
      return;
    }

    els.forEach((el) => {
      const id = el.dataset.rowId;
      if (flippingIds.current.has(id)) return; // already animating — leave it
      const cur = el.getBoundingClientRect().top;
      const prev = rowTops.current.get(id);
      rowTops.current.set(id, cur);

      if (prev == null) {
        // First appearance — entrance. Staggered rise on first load; quick
        // pop for a player added later.
        const firstLoad = !entranceDone;
        const dy = firstLoad ? 48 : 16;
        const delay = firstLoad ? Math.min(Number(el.dataset.idx || 0), 8) * 0.07 : 0;
        flippingIds.current.add(id);
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px) scale(0.95)`;
        el.style.opacity = "0";
        el.getBoundingClientRect(); // commit the invert before painting
        animateTo(el, `transform 0.5s ${EASE} ${delay}s, opacity 0.3s ease ${delay}s`, "translateY(0) scale(1)", "1");
        return;
      }

      const delta = prev - cur;
      if (Math.abs(delta) < 1) return;
      // FLIP: invert to old slot synchronously, then play to 0.
      flippingIds.current.add(id);
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // commit the invert before painting
      animateTo(el, `transform 0.45s ${EASE}`, "translateY(0)", null);
    });
  });

  // Staggered entrance plays once when the list first loads. Toggling a
  // player's selection remounts its row (it moves between the selected and
  // unselected lists), so without this guard the entrance would replay on
  // every tap.
  const [entranceDone, setEntranceDone] = useState(false);

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(null);
  const PULL_THRESHOLD = 80;

  const anyModalOpen = showAddPlayer || showBestOf || showGameMode;

  const handleTouchStart = (e) => {
    if (anyModalOpen) return;
    const el = e.currentTarget;
    if (el.scrollTop === 0) pullStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (anyModalOpen || pullStartY.current === null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) setPullY(Math.min(delta, PULL_THRESHOLD * 1.5));
  };
  const handleTouchEnd = () => {
    if (anyModalOpen) {pullStartY.current = null;setPullY(0);return;}
    if (pullY >= PULL_THRESHOLD) window.location.reload();
    setPullY(0);
    pullStartY.current = null;
  };

  useEffect(() => () => {
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
  }, []);

  // Flip after the first render with data — rows mounted in that render keep
  // their entrance animation; rows mounted later (selection toggles) skip it.
  useEffect(() => {
    if (allPlayers !== null) setEntranceDone(true);
  }, [allPlayers]);

  useEffect(() => {
    db.players.list("-created_date", 100).then((data) => {
      // Regulars (favorites) pin to the top of the list and start pre-selected,
      // so a typical game is ready in one tap.
      const favs = data.filter((p) => p.favorite);
      const rest = data.filter((p) => !p.favorite);
      setAllPlayers([...favs, ...rest]);
      setSelectedIds(new Set(favs.map((p) => p.id)));
    }).catch(() => setAllPlayers([]));
  }, []);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (result) => {
    isDraggingRef.current = false;
    // dnd plays its own drop animation; keep FLIP out until it fully settles,
    // then re-record resting positions so the next toggle measures correctly.
    dropCooldownRef.current = true;
    setTimeout(() => {
      dropCooldownRef.current = false;
      refreshRowTops();
    }, 450);

    if (!result.destination) return;
    // Indices are in the single list (selected first), so they map directly to
    // the selected segment. Clamp into that segment — a selected card can only
    // be re-ordered among the selected, never dropped into the unselected zone.
    const selectedSeq = allPlayers.filter((p) => selectedIds.has(p.id));
    const from = result.source.index;
    const to = Math.min(result.destination.index, selectedSeq.length - 1);
    if (from === to) return;
    const [moved] = selectedSeq.splice(from, 1);
    selectedSeq.splice(to, 0, moved);
    setAllPlayers((prev) => [...selectedSeq, ...prev.filter((p) => !selectedIds.has(p.id))]);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleSelected = (id) => {
    // Trigger bouncy tap feedback — release quickly so the spring-back doesn't feel sticky
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    setTappedId(id);
    tapTimerRef.current = setTimeout(() => setTappedId(null), 90);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };

  // Star/unstar a regular. Persisted immediately; we don't re-pin mid-session
  // (the selected/unselected ordering governs the list during setup) — the
  // favorite ordering + pre-select takes effect next time the screen loads.
  const toggleFavorite = async (id, e) => {
    e?.stopPropagation();
    const current = (allPlayers || []).find((p) => p.id === id);
    const nextVal = !current?.favorite;
    if (navigator.vibrate) navigator.vibrate(8);
    setPoppedId(id);
    setTimeout(() => setPoppedId((cur) => (cur === id ? null : cur)), 500);
    setAllPlayers((prev) => (prev || []).map((p) => (p.id === id ? { ...p, favorite: nextVal } : p)));
    try {
      await db.players.update(id, { favorite: nextVal });
    } catch (err) {
      console.error("Failed to update favorite:", err);
    }
  };

  const handleAddPlayer = async ({ name, color, emoji, cardStyle }) => {
    const created = await db.players.create({ name, color, emoji, cardStyle });
    setAllPlayers((prev) => [...(prev || []), created]);
    setSelectedIds((prev) => new Set([...prev, created.id]));
    setShowAddPlayer(false);
    onModalChange?.(false);
  };

  const setShowAddPlayerWithNav = (val) => {
    setShowAddPlayer(val);
    onModalChange?.(val);
  };

  const selectedPlayers = (allPlayers || []).filter((p) => selectedIds.has(p.id));
  const canStart = selectedPlayers.length >= 2;

  const handleStart = () => {
    if (!canStart) return;
    if (winMode === "bestof") {
      setShowBestOf(true);
      onModalChange?.(true);
    } else {
      onStart(selectedPlayers, winMode, null, targetScore);
    }
  };

  const handleBestOfConfirm = (bestOf) => {
    setShowBestOf(false);
    onModalChange?.(false);
    onStart(selectedPlayers, "bestof", bestOf);
  };

  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);
  const hasPlayers = (allPlayers || []).length > 0;
  const modeMeta = getModeMeta(winMode);

  const renderRow = (player, { dragProvided, snapshot, selected, index = 0 }) => {
    const baseStyle = dragProvided?.draggableProps?.style || {};
    const isDragging = snapshot?.isDragging;
    const isDropAnimating = snapshot?.isDropAnimating;
    const color = toNeoColor(player.color);

    // Tilt follows the dnd transform's Y offset so the card leans into its drag.
    let tiltDeg = 0;
    if (isDragging && baseStyle.transform) {
      const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(baseStyle.transform);
      if (m) tiltDeg = Math.max(-5, Math.min(5, parseFloat(m[2]) / 14));
    }

    // isDragging stays true through dnd's drop animation, so gate the lift on
    // !isDropAnimating to release it as the card lands.
    const isLifted = isDragging && !isDropAnimating;
    const isTapped = tappedId === player.id;
    const cinch = isLifted
      ? `scale(1.02) rotate(${tiltDeg}deg)`
      : isTapped
      ? "translate(2px, 2px)"
      : "none";

    // Three layers, each owning one transform so they never fight:
    // wrapper (entrance + FLIP), dnd node (drag), card (lift/press visuals).
    return (
      <div data-row-id={player.id} data-idx={index}>
        <motion.div {...reveal(2 + Math.min(index, 8))}>
        <div
          ref={dragProvided?.innerRef}
          {...dragProvided?.draggableProps || {}}
          {...dragProvided?.dragHandleProps || {}}
          className="pb-2.5"
        >
          <div
            onClick={() => toggleSelected(player.id)}
            className="relative mr-1 h-[60px] flex items-center gap-3 pl-2 pr-1.5 border-3 border-ink rounded-xl cursor-pointer"
            style={{
              backgroundColor: selected ? color : "rgb(var(--surface))",
              color: selected ? "rgb(var(--ink))" : "rgb(var(--fg))",
              boxShadow: isLifted ? "7px 7px 0 rgb(var(--ink))" : selected && !isTapped ? "4px 4px 0 rgb(var(--ink))" : isTapped ? "1px 1px 0 rgb(var(--ink))" : "none",
              transform: cinch,
              transition: isDragging
                ? "transform 130ms ease-out, box-shadow 150ms ease-out"
                : "transform 120ms ease-out, background-color 160ms ease-out, box-shadow 160ms ease-out",
            }}
          >
            <PlayerTile icon={player.emoji} color={selected ? "#FFFFFF" : color} size={40} radius={9} />
            <span className="flex-1 min-w-0 text-xl font-extrabold truncate">{player.name}</span>
            <button
              type="button"
              onClick={(e) => toggleFavorite(player.id, e)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={player.favorite ? "Remove from favorites" : "Add to favorites"}
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
            >
              <motion.span
                animate={poppedId === player.id ? { scale: [1, player.favorite ? 1.4 : 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ display: "inline-flex" }}
              >
                <Star size={24} strokeWidth={2.25} fill={player.favorite ? "#FFD23F" : "transparent"} />
              </motion.span>
            </button>
            <span className="flex-shrink-0 w-11 h-11 flex items-center justify-center" aria-hidden="true">
              <span
                className="w-[30px] h-[30px] flex items-center justify-center border-3 border-ink rounded-lg transition-colors"
                style={{ backgroundColor: selected ? "rgb(var(--ink))" : "rgb(var(--surface))" }}
              >
                {selected && <Check size={18} strokeWidth={3.5} color="#FFFFFF" />}
              </span>
            </span>
          </div>
        </div>
        </motion.div>
      </div>
    );
  };

  const modals = (
    <>
        <PlayerEditModal
          isOpen={showAddPlayer}
          player={null}
          usedColors={(allPlayers || []).map((p) => p.color)}
          usedEmojis={(allPlayers || []).map((p) => p.emoji).filter(Boolean)}
          onSave={handleAddPlayer}
          onClose={() => setShowAddPlayerWithNav(false)} />
      

        <BestOfModal
          isOpen={showBestOf}
          onConfirm={handleBestOfConfirm}
          onClose={() => {setShowBestOf(false);onModalChange?.(false);}} />
      

        <GameModeModal
          isOpen={showGameMode}
          winMode={winMode}
          targetScore={targetScore}
          onSelect={(mode, target) => { setWinMode(mode); setTargetScore(target); }}
          onClose={() => {setShowGameMode(false);onModalChange?.(false);}} />
    </>
  );

  if (wide) {
    // The first-run intro owns the entrance while it plays; otherwise cards
    // stagger in on first load and pop in when added later.
    const cardEntrance = (index) => {
      const intro = reveal(2 + Math.min(index, 8));
      if (intro.initial) return intro;
      return {
        initial: entranceDone ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 32, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: entranceDone ? 0 : Math.min(index, 8) * 0.05 },
      };
    };
    const startButton = (
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="neo-press font-display w-[calc(100%-6px)] h-[68px] flex items-center justify-center gap-3 bg-sun text-ink border-3 border-ink rounded-[14px] shadow-neo-lg text-[22px] uppercase disabled:bg-putty disabled:text-faint disabled:border-dashed disabled:border-faint disabled:shadow-none">
        <Spade size={24} strokeWidth={2} fill="currentColor" />
        Start game
      </button>
    );

    return (
      <div className="bg-background flex flex-col overflow-hidden px-11" style={{ height: "100%", paddingTop: WIDE_PAGE_TOP, paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}>
        <div className="h-16 flex items-center justify-between gap-4 flex-shrink-0">
          <PageTitle>New game</PageTitle>
          <button
            onPointerDown={primeIOSKeyboard}
            onClick={() => setShowAddPlayerWithNav(true)}
            className="neo-press mr-1 h-[52px] px-5 flex items-center gap-2 bg-surface border-3 border-ink rounded-xl shadow-neo text-[17px] font-extrabold">
            <Plus size={20} strokeWidth={3} />
            Add player
          </button>
        </div>

        <div className="flex-1 min-h-0 flex gap-8 mt-6">
          <div className="flex-1 min-w-0 overflow-y-auto pb-4">
            <SectionLabel>
              {hasPlayers ? `Who's playing · ${selectedPlayers.length} of ${allPlayers.length}` : "Who's playing"}
            </SectionLabel>

            {allPlayers === null ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 landscape:grid-cols-3 gap-x-4 gap-y-5">
                {allPlayers.map((player, index) => {
                  const selected = selectedIds.has(player.id);
                  const color = toNeoColor(player.color);
                  return (
                    <motion.div
                      key={player.id}
                      {...cardEntrance(index)}
                      className="pr-[5px] pb-[5px]">
                      <div
                        role="checkbox"
                        aria-checked={selected}
                        aria-label={player.name}
                        onClick={() => toggleSelected(player.id)}
                        className="h-[136px] flex flex-col justify-between p-4 border-3 border-ink rounded-2xl cursor-pointer transition-[background-color,box-shadow,transform] duration-150"
                        style={{
                          backgroundColor: selected ? color : "rgb(var(--surface))",
                          color: selected ? "rgb(var(--ink))" : "rgb(var(--fg))",
                          boxShadow: selected && tappedId !== player.id ? "5px 5px 0 rgb(var(--ink))" : "none",
                          transform: tappedId === player.id ? "translate(2px, 2px)" : "none",
                        }}>
                        <div className="flex items-start justify-between">
                          <PlayerTile icon={player.emoji} color={selected ? "#FFFFFF" : color} size={52} radius={12} />
                          <span
                            aria-hidden="true"
                            className="w-8 h-8 flex items-center justify-center border-3 border-ink rounded-lg transition-colors"
                            style={{ backgroundColor: selected ? "rgb(var(--ink))" : "rgb(var(--surface))" }}>
                            {selected && <Check size={18} strokeWidth={3.5} color="#FFFFFF" />}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 min-w-0 text-[22px] font-extrabold truncate">{player.name}</span>
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(player.id, e)}
                            aria-label={player.favorite ? "Remove from favorites" : "Add to favorites"}
                            className="-mr-2 -mb-2 flex-shrink-0 w-11 h-11 flex items-center justify-center">
                            <motion.span
                              animate={poppedId === player.id ? { scale: [1, player.favorite ? 1.4 : 1.18, 1] } : { scale: 1 }}
                              transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                              style={{ display: "inline-flex" }}>
                              <Star size={24} strokeWidth={2.25} fill={player.favorite ? "#FFD23F" : "transparent"} />
                            </motion.span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <motion.div {...reveal(2 + Math.min(allPlayers.length, 9))} className="pr-[5px] pb-[5px]">
                  <button
                    onPointerDown={primeIOSKeyboard}
                    onClick={() => setShowAddPlayerWithNav(true)}
                    className="w-full h-[136px] flex flex-col items-center justify-center gap-2 border-3 border-dashed border-ink rounded-2xl text-[17px] font-extrabold active:bg-ink/5">
                    <Plus size={26} strokeWidth={3} />
                    Add player
                  </button>
                </motion.div>
              </div>
            )}

            {allPlayers !== null && !hasPlayers && (
              <motion.div {...reveal(3)} className="mt-10 text-center">
                <h2 className="font-display text-[28px] leading-[1.1] uppercase">Let's add some players</h2>
                <p className="mt-2.5 text-base font-medium text-subtle">You need at least two to start.</p>
              </motion.div>
            )}
          </div>

          <motion.aside {...reveal(1)} className="w-[340px] flex-shrink-0 self-start mt-7 mr-1.5">
            <div className={`p-6 ${WIDE_PANEL}`}>
              <SectionLabel className="mb-2.5">Game mode</SectionLabel>
              <button
                onClick={() => {setShowGameMode(true);onModalChange?.(true);}}
                className="neo-press w-[calc(100%-3px)] h-16 flex items-center gap-3 pl-2.5 pr-3 bg-surface border-3 border-ink rounded-xl shadow-neo-sm">
                <PlayerTile icon={modeMeta.icon} color="#FFD23F" size={40} radius={10} border={2.5} />
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-[17px] font-extrabold truncate">{modeMeta.label}</span>
                  <span className="block text-[13px] font-semibold text-subtle">
                    {winMode === "bestof" ? "Pick rounds on start" : `${modeMeta.direction === "low" ? "Fewest" : "Most"} points wins${targetScore ? ` · to ${targetScore}` : ""}`}
                  </span>
                </span>
                <ChevronRight size={20} strokeWidth={3} />
              </button>

              <SectionLabel className="mt-6 mb-2.5">Lineup</SectionLabel>
              {selectedPlayers.length > 0 ? (
                <div className="flex items-center gap-3.5 min-h-[52px]">
                  <div className="flex flex-shrink-0">
                    {selectedPlayers.slice(0, 4).map((p, i) => (
                      <span key={p.id} className={i > 0 ? "-ml-3" : ""} style={{ zIndex: 10 - i }}>
                        <PlayerTile icon={p.emoji} color={toNeoColor(p.color)} size={46} radius={11} rotate={i % 2 ? 4 : -4} />
                      </span>
                    ))}
                  </div>
                  <span className="min-w-0 text-[17px] font-extrabold leading-tight">{lineupLabel(selectedPlayers)}</span>
                </div>
              ) : (
                <div className="min-h-[52px] flex items-center gap-3 text-subtle">
                  <NeoIcon name="pointer" size={28} />
                  <span className="text-[15px] font-semibold">Tap players to add them.</span>
                </div>
              )}

              <div className="mt-7">{startButton}</div>
              {!canStart && hasPlayers && (
                <p className="font-mono mt-3 text-center text-[11px] font-bold tracking-[0.1em] uppercase text-subtle">Pick at least two</p>
              )}
            </div>
          </motion.aside>
        </div>

        {modals}
      </div>
    );
  }

  return (
    <div
      className="bg-background flex flex-col overflow-hidden"
      style={{ height: "100%", paddingTop: PAGE_TOP }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>

      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pullY > 0 ? `${pullY * 0.5}px` : 0, opacity: pullProgress }}>
        <div
          className="w-6 h-6 rounded-full border-3 border-ink/20 border-t-ink transition-transform"
          style={{ transform: `rotate(${pullProgress * 360}deg)`, opacity: pullProgress >= 1 ? 1 : 0.5 }} />
      </div>

      <div className="px-5 flex items-center justify-between h-11 flex-shrink-0">
        {/* Hidden until the intro's flying sticker lands here and hands off. */}
        <span data-logo-anchor style={{ visibility: introPhase === "hidden" ? "hidden" : "visible" }}>
          <LogoSticker size="lg" />
        </span>
        {allPlayers !== null && (
          <motion.span {...reveal(0)} className="inline-flex">
          <span className="font-mono text-xs font-bold tracking-[0.08em] px-2.5 py-1.5 border-2.5 border-ink rounded-full bg-surface">
            {hasPlayers ? `${selectedPlayers.length} OF ${allPlayers.length} IN` : "0 PLAYERS"}
          </span>
          </motion.span>
        )}
      </div>

      <motion.div {...reveal(1)} className="px-5 mt-[22px] mb-2.5 flex-shrink-0">
        <SectionLabel>Who's playing</SectionLabel>
      </motion.div>

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={(e) => setScrolledFromTop(e.currentTarget.scrollTop > 4)}
          className={`h-full overflow-y-auto px-5 pb-3 ${scrolledFromTop ? "border-t-[2.5px] border-ink" : ""}`}
          style={{ paddingTop: scrolledFromTop ? 8 : 0 }}>

          {allPlayers === null ?
          <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
            </div> :

          <>
              {!hasPlayers &&
            <motion.div {...reveal(2)} className="flex flex-col">
                  <h2 className="font-display text-[26px] leading-[1.1] uppercase text-center">Let's add some players</h2>
                  <p className="mt-2.5 text-base font-medium text-center text-subtle">You need at least two to start.</p>
                  <button
                    onPointerDown={primeIOSKeyboard}
                    onClick={() => setShowAddPlayerWithNav(true)}
                    className="neo-press mx-auto mt-5 h-14 px-7 flex items-center gap-2.5 bg-sun text-ink border-3 border-ink rounded-xl shadow-neo-md text-[17px] font-extrabold">
                    <Plus size={20} strokeWidth={3} />
                    Add player
                  </button>
                </motion.div>
            }

              {hasPlayers && (() => {
              // One list: selected (re-orderable) first, then unselected
              // (drag-disabled). Toggling moves a card between the two segments
              // without remounting it, so its FLIP glide is clean.
              const displayList = [
                ...allPlayers.filter((p) => selectedIds.has(p.id)),
                ...allPlayers.filter((p) => !selectedIds.has(p.id)),
              ];
              return (
                <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <Droppable droppableId="players">
                    {(dropProvided) =>
                  <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                        {displayList.map((player, index) => {
                      const selected = selectedIds.has(player.id);
                      return (
                        <Draggable key={player.id} draggableId={player.id} index={index} isDragDisabled={!selected}>
                                {(dragProvided, snapshot) =>
                          renderRow(player, { dragProvided, snapshot, selected, index })
                          }
                              </Draggable>);
                    })}
                        {dropProvided.placeholder}
                      </div>
                  }
                  </Droppable>
                </DragDropContext>);
            })()}

              {hasPlayers && <motion.div {...reveal(2 + Math.min((allPlayers || []).length, 9))}><motion.button
              onPointerDown={primeIOSKeyboard}
              onClick={() => setShowAddPlayerWithNav(true)}
              // Fades in only after the card stagger has played out.
              initial={entranceDone ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(allPlayers.length - 1, 8) * 0.07 + 0.45, duration: DUR_MEDIUM }}
              className="w-[calc(100%-4px)] h-[54px] flex items-center justify-center gap-2 border-3 border-dashed border-ink rounded-xl text-[17px] font-extrabold active:bg-ink/5">
                <Plus size={20} strokeWidth={3} />
                Add player
              </motion.button></motion.div>}
            </>
          }
        </div>
      </div>

      <motion.div {...reveal(3 + Math.min((allPlayers || []).length, 9))} className="px-5 pt-4 flex-shrink-0 relative z-30">
        <SectionLabel className="mb-2">Game mode</SectionLabel>
        <button
          onClick={() => {setShowGameMode(true);onModalChange?.(true);}}
          className="neo-press w-[calc(100%-4px)] h-12 flex items-center gap-2.5 pl-2 pr-3 bg-surface border-3 border-ink rounded-xl shadow-neo-sm">
          <PlayerTile icon={modeMeta.icon} color="#FFD23F" size={32} radius={8} border={2.5} />
          <span className="flex-1 text-left text-base font-extrabold">{modeMeta.label}</span>
          <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-subtle">CHANGE</span>
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </motion.div>

      {/* Both visible gaps land at 18px once each button's hard shadow (3px /
          6px) is subtracted. */}
      <motion.div {...reveal(4 + Math.min((allPlayers || []).length, 9))} className="px-5 pt-[21px] pb-6 flex-shrink-0 relative z-30">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="neo-press font-display w-[calc(100%-6px)] h-16 flex items-center justify-center gap-3 bg-sun text-ink border-3 border-ink rounded-[14px] shadow-neo-lg text-[21px] uppercase disabled:bg-putty disabled:text-faint disabled:border-dashed disabled:border-faint disabled:shadow-none">
          <Spade size={24} strokeWidth={2} fill="currentColor" />
          Start game
        </button>
      </motion.div>

      {modals}
      

    </div>);

}