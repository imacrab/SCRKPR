import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Plus, Check, GripVertical, Star } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/store";
import BestOfModal from "./BestOfModal";
import GameModeModal from "./GameModeModal";
import PlayerEditModal from "./PlayerEditModal";
import FluentEmoji from "./FluentEmoji";
import { getModeMeta } from "@/lib/gameModes";
import { readableTextColor } from "@/lib/contrast";
import { DUR_MEDIUM } from "@/lib/motion";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";
import logoDark from "@/assets/scrkpr-logo.svg";

export default function PlayerSetup({ onStart, onModalChange }) {
  const [allPlayers, setAllPlayers] = useState(null); // null = loading
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [canScrollPlayers, setCanScrollPlayers] = useState(false);
  const [scrolledFromTop, setScrolledFromTop] = useState(false);
  const [winMode, setWinMode] = useState("swish");
  const [targetScore, setTargetScore] = useState(500); // Swish locks to 500; high/low can override
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

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScrollPlayers(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [allPlayers]);

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

  const handleAddPlayer = async ({ name, color, emoji }) => {
    const created = await db.players.create({ name, color, emoji });
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

  return (
    <div
      className="bg-background flex flex-col overflow-hidden"
      style={{ height: "100%", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pullY > 0 ? `${pullY * 0.5}px` : 0, opacity: pullProgress }}>
        
        <div
          className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 border-t-foreground transition-transform"
          style={{ transform: `rotate(${pullProgress * 360}deg)`, opacity: pullProgress >= 1 ? 1 : 0.5 }} />
        
      </div>

      {/* Header */}
      <div className="pt-7 pb-4 px-6" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        {/* Invisible anchor — the visible logo is the persistent one hoisted to
            ScoreKeeper, which measures this slot and floats over it (opacity:0
            here keeps the layout space + position). */}
        <img src={logoDark} alt="SCRKPR!" data-logo-anchor className="mx-auto" style={{ maxWidth: 150, height: "auto", opacity: 0 }} />
      </div>

      {/* Player list — pick who's playing */}
      <div className="flex-1 relative overflow-hidden">
        {/* Top fade — mirrors the bottom fade so the list dissolves under the
            logo instead of meeting it at a hard edge. Fades in only once the
            user has scrolled off the top, so first-load is a clean edge. */}
        <div
          className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none transition-opacity duration-200"
          style={{ opacity: scrolledFromTop ? 1 : 0 }}
        />
        {canScrollPlayers && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
          onScroll={(e) => setScrolledFromTop(e.currentTarget.scrollTop > 4)}
          className="h-full overflow-y-auto px-5 pt-2 pb-4 space-y-2">
          
          {allPlayers === null ?
          <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div> :

          <>
              {allPlayers.length === 0 &&
            <div className="text-center py-10 text-sm text-muted-foreground">
                  No players yet. Tap below to add one.
                </div>
            }

              {(() => {
              const selectedList = allPlayers.filter((p) => selectedIds.has(p.id));
              const unselectedList = allPlayers.filter((p) => !selectedIds.has(p.id));

              const hexToRgba = (hex, alpha) => {
                const h = (hex || "#000000").replace("#", "");
                const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
                const r = parseInt(full.slice(0, 2), 16);
                const g = parseInt(full.slice(2, 4), 16);
                const b = parseInt(full.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };

              const renderRow = (player, { dragProvided, snapshot, selected, draggable, index = 0 }) => {
                const baseStyle = dragProvided?.draggableProps?.style || {};
                const isDragging = snapshot?.isDragging;
                const isDropAnimating = snapshot?.isDropAnimating;

                // On a selected (color-filled) row, pick text that contrasts
                // with the player's color; otherwise use the theme foreground.
                const rowText = selected ? readableTextColor(player.color) : "hsl(var(--foreground))";
                const rowTextMuted = selected
                  ? (readableTextColor(player.color) === "#111111" ? "rgba(17,17,17,0.55)" : "rgba(255,255,255,0.65)")
                  : "hsl(var(--muted-foreground))";

                // Derive tilt from the dnd transform's Y offset so the card leans into its drag direction
                let tiltDeg = 0;
                if (isDragging && baseStyle.transform) {
                  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(baseStyle.transform);
                  if (m) {
                    const dy = parseFloat(m[2]);
                    tiltDeg = Math.max(-5, Math.min(5, dy / 14));
                  }
                }

                const isTapped = tappedId === player.id;
                // Lifted ("cinch"): squeezed vertically + slight tilt, like
                // pinching the card off the table. NB isDragging stays true
                // through dnd's drop animation, so gate on !isDropAnimating to
                // release the cinch as it lands.
                const isLifted = isDragging && !isDropAnimating;
                const cinch = isLifted
                  ? `scale(1.03, 0.85) rotate(${tiltDeg}deg)`
                  : isTapped
                  ? "scale(0.92, 0.92) rotate(0deg)"
                  : "scale(1, 1) rotate(0deg)";

                // THREE layers, each owning ONE transform concern so they never
                // fight (fighting dnd's transform was the source of the drop
                // "snap"):
                //   1. wrapper  — manual entrance + FLIP-on-toggle (data-row-id)
                //   2. dnd node — pure @hello-pangea drag/drop transform (no overrides)
                //   3. card     — the cinch/tap squish + all the visuals
                return (
                <div data-row-id={player.id} data-idx={index}>
                <div
                ref={dragProvided?.innerRef}
                {...dragProvided?.draggableProps || {}}
                {...dragProvided?.dragHandleProps || {}}>
                <div
                onClick={() => toggleSelected(player.id)}
                className="w-full rounded-lg border overflow-hidden flex items-center gap-2 px-2 py-2.5 text-left cursor-pointer"
                style={{
                  backgroundColor: selected ? hexToRgba(player.color, 1) : "hsl(var(--card))",
                  borderColor: selected ? "transparent" : "hsl(var(--border))",
                  boxShadow: isLifted ? "0 20px 35px -8px rgba(0,0,0,0.45)" : "none",
                  transform: cinch,
                  transformOrigin: "center center",
                  transition: isDragging
                    ? "transform 130ms ease-out, box-shadow 150ms ease-out"
                    : "transform 260ms cubic-bezier(0.34, 1.6, 0.4, 1), background-color 200ms ease-out, border-color 200ms ease-out, box-shadow 220ms ease-out",
                }}>

                    {draggable ?
                <div className="flex-shrink-0 touch-none flex items-center justify-center w-6 h-7" style={{ color: rowText }}>
                        <GripVertical size={18} strokeWidth={2} />
                      </div> :

                <div className="flex-shrink-0 w-6 h-7" />
                }
                    <div
                  className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center leading-none overflow-hidden"
                  style={{ backgroundColor: player.color }}>
                  
                      {player.emoji && <FluentEmoji emoji={player.emoji} size={18} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }} />}
                    </div>
                    <span className="flex-1 text-base [font-family:'Geist',_sans-serif] font-semibold" style={{ color: rowText }}>{player.name}</span>
                    <button
                  type="button"
                  onClick={(e) => toggleFavorite(player.id, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={player.favorite ? "Remove from favorites" : "Add to favorites"}
                  className="flex-shrink-0 w-11 h-11 -mr-2 flex items-center justify-center">
                      <motion.span
                    animate={poppedId === player.id ? { scale: [1, player.favorite ? 1.4 : 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ display: "inline-flex" }}>
                        <Star
                      size={18}
                      strokeWidth={2}
                      style={{
                        fill: player.favorite ? "#FFC93C" : "transparent",
                        color: player.favorite ? "#FFC93C" : rowTextMuted,
                      }} />
                      </motion.span>
                    </button>
                    <div
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: selected ? rowText : "transparent",
                    border: selected ? "none" : `2px solid ${rowTextMuted}`
                  }}>

                      {selected && <Check size={16} strokeWidth={3} style={{ color: player.color }} />}
                    </div>
                  </div>
                </div>
                </div>
                );
              };


              // One list: selected (re-orderable) first, then unselected
              // (drag-disabled). Toggling moves a card between the two segments
              // without remounting it, so its FLIP glide is clean.
              const displayList = [...selectedList, ...unselectedList];
              return (
                <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <Droppable droppableId="players">
                    {(dropProvided) =>
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className="space-y-2">

                        {displayList.map((player, index) => {
                      const selected = selectedIds.has(player.id);
                      return (
                        <Draggable key={player.id} draggableId={player.id} index={index} isDragDisabled={!selected}>
                                {(dragProvided, snapshot) =>
                          renderRow(player, { dragProvided, snapshot, selected, draggable: selected, index })
                          }
                              </Draggable>);

                    })}
                        {dropProvided.placeholder}
                      </div>
                  }
                  </Droppable>
                </DragDropContext>);

            })()}

              <motion.button
              onPointerDown={primeIOSKeyboard}
              onClick={() => setShowAddPlayerWithNav(true)}
              // Fades in only after the card stagger has played out: the last
              // card's entrance delay + its spring settle. Guarded by
              // entranceDone so it doesn't refade on selection toggles.
              initial={entranceDone ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(allPlayers.length - 1, 8) * 0.07 + 0.45, duration: DUR_MEDIUM }}
              className="w-full mt-1 h-11 rounded-full flex items-center justify-center gap-2 text-white text-sm font-medium transition-colors border border-dashed border-border hover:border-accent-blue/50">

                <Plus size={24} strokeWidth={2} />
                Add Player
              </motion.button>
            </>
          }
        </div>
      </div>

      {/* Win mode */}
      <div className="px-5 pt-2 relative z-30" style={{ paddingBottom: "12px" }}>
        <button
          onClick={() => {setShowGameMode(true);onModalChange?.(true);}}
          className="w-full flex items-center justify-between gap-3 px-4 rounded-full border border-border bg-card hover:bg-accent transition-colors"
          style={{ height: "52px" }}>
          
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Game mode</span>
          <span className="flex items-center gap-1.5">
            {(() => {
              const { emoji, label } = getModeMeta(winMode);
              return (
                <>
                  <FluentEmoji emoji={emoji} size={18} />
                  <span className="text-sm font-medium text-foreground">
                    {label}{targetScore ? ` · to ${targetScore}` : ""}
                  </span>
                </>);

            })()}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 pt-0 flex flex-col gap-3 relative z-30" style={{ paddingBottom: "12px" }}>
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full text-base font-semibold bg-white hover:bg-white/90"
          style={{ height: "52px", color: "#111", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
          
          <FluentEmoji emoji="♠️" size={24} className="mr-2" />
          Start Game
        </Button>
      </div>

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
      

    </div>);

}