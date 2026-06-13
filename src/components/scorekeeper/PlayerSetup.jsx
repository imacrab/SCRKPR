import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Plus, Check, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import BestOfModal from "./BestOfModal";
import GameModeModal from "./GameModeModal";
import PlayerEditModal from "./PlayerEditModal";
import FluentEmoji from "./FluentEmoji";
import { getModeMeta } from "@/lib/gameModes";
import { SPRING_SHEET, DUR_MEDIUM } from "@/lib/motion";
import logoDark from "@/assets/SCRKPR_dark_mode.png";

const DEFAULT_SELECTED_NAMES = ["Adrian", "Jayne"];

export default function PlayerSetup({ onStart, onModalChange }) {
  const [allPlayers, setAllPlayers] = useState(null); // null = loading
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [canScrollPlayers, setCanScrollPlayers] = useState(false);
  const [winMode, setWinMode] = useState("ginrummy");
  const [showBestOf, setShowBestOf] = useState(false);
  const [showGameMode, setShowGameMode] = useState(false);
  const [tappedId, setTappedId] = useState(null);
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
  const justDroppedId = useRef(null); // dnd animates the dropped card itself

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const els = container.querySelectorAll("[data-row-id]");

    // During a drag, dnd owns the transforms — just keep positions fresh.
    if (isDraggingRef.current) {
      els.forEach((el) => {
        const id = el.dataset.rowId;
        if (!flippingIds.current.has(id)) rowTops.current.set(id, el.getBoundingClientRect().top);
      });
      return;
    }

    els.forEach((el) => {
      const id = el.dataset.rowId;
      if (flippingIds.current.has(id)) return; // already animating
      const cur = el.getBoundingClientRect().top;
      const prev = rowTops.current.get(id);
      rowTops.current.set(id, cur);
      if (prev == null) return; // first appearance — entrance handles it
      const delta = prev - cur;
      if (Math.abs(delta) < 1) return;
      if (id === justDroppedId.current) return; // dnd's drop animation owns it

      // Invert to the old position with no transition, then play to 0.
      flippingIds.current.add(id);
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // force reflow so the invert takes
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "translateY(0)";
        const done = () => {
          el.removeEventListener("transitionend", done);
          el.style.transition = "";
          el.style.transform = "";
          flippingIds.current.delete(id);
          rowTops.current.set(id, el.getBoundingClientRect().top);
        };
        el.addEventListener("transitionend", done);
      });
    });
    justDroppedId.current = null;
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
    base44.entities.Player.list("-created_date", 100).then((data) => {
      // Pin Adrian & Jayne to the top of the list
      const pinned = DEFAULT_SELECTED_NAMES.
      map((n) => data.find((p) => p.name === n)).
      filter(Boolean);
      const pinnedIds = new Set(pinned.map((p) => p.id));
      const rest = data.filter((p) => !pinnedIds.has(p.id));
      const ordered = [...pinned, ...rest];

      setAllPlayers(ordered);
      setSelectedIds(new Set(pinned.map((p) => p.id)));
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
    if (!result.destination || result.source.index === result.destination.index) return;
    // dnd plays its own drop animation for the dragged card — let the FLIP pass
    // skip it (otherwise both animate it). Siblings still FLIP to their slots.
    justDroppedId.current = result.draggableId;
    setAllPlayers((prev) => {
      const selectedSeq = prev.filter((p) => selectedIds.has(p.id));
      const unselectedSeq = prev.filter((p) => !selectedIds.has(p.id));
      const [moved] = selectedSeq.splice(result.source.index, 1);
      selectedSeq.splice(result.destination.index, 0, moved);
      return [...selectedSeq, ...unselectedSeq];
    });
    // Once dnd's drop animation settles, record the dropped card's true
    // resting position so the next reorder measures its delta correctly.
    setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-row-id="${result.draggableId}"]`);
      if (el && !flippingIds.current.has(result.draggableId)) {
        rowTops.current.set(result.draggableId, el.getBoundingClientRect().top);
      }
    }, 450);
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

  const handleAddPlayer = async ({ name, color, emoji }) => {
    const created = await base44.entities.Player.create({ name, color, emoji });
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
      const meta = getModeMeta(winMode);
      onStart(selectedPlayers, winMode, null, meta.targetScore);
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
      <div className="pt-10 pb-5 px-6" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        {/* Invisible anchor — the visible logo is the persistent one hoisted to
            ScoreKeeper, which measures this slot and floats over it (opacity:0
            here keeps the layout space + position). */}
        <img src={logoDark} alt="SCRKPR!" data-logo-anchor className="mx-auto" style={{ maxWidth: 200, height: "auto", opacity: 0 }} />
      </div>

      {/* Player list — pick who's playing */}
      <div className="flex-1 relative overflow-hidden">
        {canScrollPlayers && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
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
                // Entrance: same rise + settle as the scoreboard, 70ms apart
                // (capped so long lists don't keep staggering off-screen).
                const entranceDelay = Math.min(index, 8) * 0.07;

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
                // NB: while dnd's drop animation runs, isDragging stays true AND
                // isDropAnimating is true — so "lifted" styling must check both,
                // otherwise the lift scale/tilt/shadow stick through the drop.
                const isLifted = isDragging && !isDropAnimating;
                // The transform must keep the SAME function list (scale + rotate)
                // in every state. Mismatched lists (e.g. dropping rotate when
                // idle) force the browser into matrix-fallback interpolation,
                // which pops visibly at the drag-release boundary.
                // Lifted = the "cinch": squeezed vertically, slightly wider,
                // like pinching the card off the table.
                const rowScale = isLifted ? "scale(1.03, 0.85)" : isTapped ? "scale(0.92, 0.92)" : "scale(1, 1)";
                const composedTransform = `${baseStyle.transform || ""} ${rowScale} rotate(${isLifted ? tiltDeg : 0}deg)`.trim();

                return (
                // Plain FLIP wrapper — its transform is driven manually by the
                // useLayoutEffect above (never by framer), so it can glide to a
                // new slot on reorder without fighting framer's transform mgmt.
                <div data-row-id={player.id} style={{ willChange: "transform" }}>
                <motion.div
                // Two entrance modes, both keyed off mount (framer `initial`
                // only fires on mount):
                //  - first load (entranceDone false): big staggered rise.
                //  - after load: a toggled card moves between the selected and
                //    unselected lists, which remounts it here — so it pops/rises
                //    in quickly instead of teleporting.
                // We deliberately avoid framer `layout`/`layoutId`: shared-layout
                // animations deadlock the parent page's AnimatePresence
                // (mode="wait") exit and break navigation to the scoreboard.
                initial={entranceDone ? { opacity: 0, y: 16, scale: 0.94 } : { opacity: 0, y: 48, scale: 0.95 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  transition: entranceDone
                    ? SPRING_SHEET
                    : {
                        y: { ...SPRING_SHEET, delay: entranceDelay },
                        scale: { ...SPRING_SHEET, delay: entranceDelay },
                        opacity: { duration: DUR_MEDIUM, delay: entranceDelay },
                      },
                }}>
                <div
                ref={dragProvided?.innerRef}
                {...dragProvided?.draggableProps || {}}
                {...dragProvided?.dragHandleProps || {}}
                onClick={() => toggleSelected(player.id)}
                className="w-full rounded-lg border overflow-hidden flex items-center gap-2 px-2 py-2.5 text-left transition-[background-color,border-color] duration-200 ease-out cursor-pointer"
                style={{
                  backgroundColor: selected ? hexToRgba(player.color, 0.7) : "hsl(var(--card))",
                  borderColor: selected ? "transparent" : "hsl(var(--border))",
                  boxShadow: isLifted ? "0 20px 35px -8px rgba(0,0,0,0.45)" : "none",
                  ...baseStyle,
                  transform: composedTransform,
                  transformOrigin: "center center",
                  // Order matters: isDropAnimating must be checked BEFORE
                  // isDragging (dnd keeps isDragging true through the drop).
                  // Whenever dnd is steering a card's transform (drop animation
                  // or siblings shifting out of the way), defer to dnd's own
                  // gentle ease-out. The bouncy overshoot curve only applies to
                  // the tap squish.
                  transition: isDropAnimating
                    ? `${baseStyle.transition || "transform 250ms cubic-bezier(0.2, 0, 0, 1)"}, background-color 200ms ease-out, border-color 200ms ease-out, box-shadow 180ms ease-out`
                    : isDragging
                    ? "transform 60ms linear, box-shadow 150ms ease-out"
                    : baseStyle.transition
                    ? `${baseStyle.transition}, background-color 200ms ease-out, border-color 200ms ease-out, box-shadow 180ms ease-out`
                    : "transform 320ms cubic-bezier(0.34, 1.7, 0.4, 1), background-color 200ms ease-out, border-color 200ms ease-out, box-shadow 180ms ease-out"
                }}>
                
                    {draggable ?
                <div className="flex-shrink-0 touch-none flex items-center justify-center w-6 h-7 text-[hsl(var(--foreground))]">
                        <GripVertical size={18} strokeWidth={2} />
                      </div> :

                <div className="flex-shrink-0 w-6 h-7" />
                }
                    <div
                  className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center leading-none overflow-hidden"
                  style={{ backgroundColor: player.color }}>
                  
                      {player.emoji && <FluentEmoji emoji={player.emoji} size={18} />}
                    </div>
                    <span className="flex-1 text-foreground text-base [font-family:'Geist',_sans-serif] font-semibold">{player.name}</span>
                    <div
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: selected ? "#FFFFFF" : "transparent",
                    border: selected ? "none" : "2px solid hsl(var(--border))"
                  }}>
                  
                      {selected && <Check size={16} strokeWidth={3} style={{ color: player.color }} />}
                    </div>
                  </div>
                </motion.div>
                </div>
                );
              };


              return (
                <>
                    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <Droppable droppableId="selected-players">
                        {(dropProvided) =>
                      <div
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className="space-y-2">
                        
                            {selectedList.map((player, index) =>
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                                {(dragProvided, snapshot) =>
                          renderRow(player, { dragProvided, snapshot, selected: true, draggable: true, index })
                          }
                              </Draggable>
                        )}
                            {dropProvided.placeholder}
                          </div>
                      }
                      </Droppable>
                    </DragDropContext>

                    {unselectedList.length > 0 &&
                  <div className="space-y-2 mt-2">
                        {unselectedList.map((player, i) =>
                    <div key={player.id}>
                            {renderRow(player, { selected: false, draggable: false, index: selectedList.length + i })}
                          </div>
                    )}
                      </div>
                  }
                  </>);

            })()}

              <motion.button
              onClick={() => setShowAddPlayerWithNav(true)}
              // Fades in only after the card stagger has played out: the last
              // card's entrance delay + its spring settle. Guarded by
              // entranceDone so it doesn't refade on selection toggles.
              initial={entranceDone ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(allPlayers.length - 1, 8) * 0.07 + 0.45, duration: DUR_MEDIUM }}
              className="w-full mt-1 h-11 rounded-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors border border-dashed border-border hover:border-accent-blue/50">

                <Plus size={24} strokeWidth={2} />
                Add Player
              </motion.button>
            </>
          }
        </div>
      </div>

      {/* Win mode */}
      <div className="px-5 pt-2 pb-2 relative z-30">
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
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </>);

            })()}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 pt-0 flex flex-col gap-3 relative z-30" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
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
        onSelect={setWinMode}
        onClose={() => {setShowGameMode(false);onModalChange?.(false);}} />
      

    </div>);

}