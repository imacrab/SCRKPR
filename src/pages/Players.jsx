import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Check, Trash2, Star } from "lucide-react";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import DeletePlayerConfirmModal from "@/components/scorekeeper/DeletePlayerConfirmModal";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";
import { SPRING_SHEET } from "@/lib/motion";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";

export default function Players({ onBack, onModalChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | player (existing)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [poppedId, setPoppedId] = useState(null); // star that just bounced
  const scrollRef = useRef(null);
  // Fully manual entrance + FLIP for the player list — NO framer on the rows or
  // section headers. Framer re-writes transform/layout on render and fought the
  // FLIP (the snap/teleport when re-sorting or removing all favorites). Rows and
  // headers are plain divs; this owns their entrance rise and the reorder glide.
  const rowTops = useRef(new Map());
  const flippingIds = useRef(new Set());
  const enteredRef = useRef(false); // first-load stagger done
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

  const fetchPlayers = async () => {
    try {
      const data = await db.players.list("-created_date", 100);
      setPlayers(data);
    } catch (e) {
      console.error("Failed to load players:", e);
    }
  };

  useEffect(() => {
    fetchPlayers().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Hide the tab bar (and its gradient) for modals AND select mode —
    // the bulk-delete pill takes the nav's place while selecting.
    onModalChange?.(!!editing || showBulkConfirm || selectMode);
  }, [editing, showBulkConfirm, selectMode, onModalChange]);

  // Long-press a card (0.5s) to jump straight into select mode with it selected
  const longPressFiredRef = useRef(false);
  const startLongPress = (e, player) => {
    if (selectMode) return;
    const timer = setTimeout(() => {
      longPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      setSelectMode(true);
      setSelectedIds(new Set([player.id]));
    }, 500);
    const cancel = () => clearTimeout(timer);
    e.currentTarget.addEventListener("pointerup", cancel, { once: true });
    e.currentTarget.addEventListener("pointerleave", cancel, { once: true });
    e.currentTarget.addEventListener("pointercancel", cancel, { once: true });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const allSelected = players.length > 0 && selectedIds.size === players.length;
  const toggleSelectAll = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setSelectedIds(allSelected ? new Set() : new Set(players.map((p) => p.id)));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    setShowBulkConfirm(false);
    exitSelectMode();
    setPlayers((prev) => prev.filter((p) => !ids.includes(p.id)));
    await Promise.allSettled(ids.map((id) => db.players.delete(id)));
  };

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [players, loading]);

  // Runs after every render. A row appearing for the first time rises + fades
  // in (staggered on first load, quick pop later); a row whose position changed
  // — a favorite re-sorting, or a section header appearing/disappearing pushing
  // rows up/down — inverts→plays a translateY glide. All on plain divs, so
  // nothing re-writes the transform mid-flight. Rows already animating are left
  // alone (guards against the star-bounce re-render corrupting an in-flight glide).
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.querySelectorAll("[data-row-id]").forEach((el) => {
      const id = el.dataset.rowId;
      if (flippingIds.current.has(id)) return; // already animating — leave it
      const cur = el.getBoundingClientRect().top;
      const prev = rowTops.current.get(id);
      rowTops.current.set(id, cur);
      if (prev == null) {
        // First appearance — entrance.
        const firstLoad = !enteredRef.current;
        const idx = Number(el.dataset.idx || 0);
        const dy = firstLoad ? 48 : 16;
        const delay = firstLoad ? Math.min(idx, 8) * 0.07 : 0;
        flippingIds.current.add(id);
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px) scale(0.96)`;
        el.style.opacity = "0";
        el.getBoundingClientRect(); // commit before paint
        animateTo(el, `transform 0.5s ${EASE} ${delay}s, opacity 0.3s ease ${delay}s`, "translateY(0) scale(1)", "1");
      } else {
        const delta = prev - cur;
        if (Math.abs(delta) > 1) {
          flippingIds.current.add(id);
          el.style.transition = "none";
          el.style.transform = `translateY(${delta}px)`;
          el.getBoundingClientRect(); // commit the invert before paint
          animateTo(el, `transform 0.45s ${EASE}`, "translateY(0)", null);
        }
      }
    });
    if (container.querySelector("[data-row-id]")) enteredRef.current = true;
  });

  const toggleFavorite = async (id) => {
    const current = players.find((p) => p.id === id);
    const nextVal = !current?.favorite;
    if (navigator.vibrate) navigator.vibrate(8);
    setPoppedId(id);
    setTimeout(() => setPoppedId((cur) => (cur === id ? null : cur)), 500);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: nextVal } : p)));
    try {
      await db.players.update(id, { favorite: nextVal });
    } catch (e) {
      console.error("Failed to update favorite:", e);
    }
  };

  const handleSave = async ({ id, name, color, emoji }) => {
    if (id) {
      await db.players.update(id, { name, color, emoji });
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, color, emoji } : p)));
    } else {
      const created = await db.players.create({ name, color, emoji });
      setPlayers((prev) => [created, ...prev]);
    }
    setEditing(null);
  };

  const handleDelete = async (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
    await db.players.delete(id);
  };

  // One row, fully manual: plain outer div ([data-row-id]) owns the entrance +
  // FLIP transform (driven by the effect above); plain inner button owns tap.
  // The only framer left is the isolated star/check pop — it scales an icon and
  // never affects layout, so it can't fight the FLIP.
  const renderRow = (p, idx) => {
    const isSelected = selectedIds.has(p.id);
    return (
      <div key={p.id} data-row-id={p.id} data-idx={idx} className="mb-2">
        <button
          onClick={() => {
            if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
            if (selectMode) toggleSelect(p.id); else setEditing(p);
          }}
          onPointerDown={(e) => { if (!selectMode) primeIOSKeyboard(); startLongPress(e, p); }}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full rounded-lg border bg-card overflow-hidden flex items-center gap-3 pl-3 pr-1 py-2.5 text-left transition-colors active:scale-[0.99] ${
            isSelected ? "border-accent-red bg-accent-red/5" : "border-border"
          }`}
        >
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center leading-none overflow-hidden"
            style={{ backgroundColor: p.color }}
          >
            {p.emoji && <FluentEmoji emoji={p.emoji} size={22} />}
          </div>
          <span className="flex-1 text-foreground text-base">{p.name}</span>
          {!selectMode && (
            <span
              role="button"
              tabIndex={0}
              aria-label={p.favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
            >
              <motion.span
                animate={poppedId === p.id ? { scale: [1, p.favorite ? 1.4 : 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ display: "inline-flex" }}
              >
                <Star
                  size={18}
                  strokeWidth={2}
                  style={{
                    fill: p.favorite ? "#FFC93C" : "transparent",
                    color: p.favorite ? "#FFC93C" : "hsl(var(--muted-foreground))",
                  }}
                />
              </motion.span>
            </span>
          )}
          {selectMode && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SHEET}
              className={`w-6 h-6 mr-2 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                isSelected ? "bg-accent-red border-accent-red text-white" : "border-border text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </motion.span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Edit-mode frame — a 4px brand border around the whole screen that
          fades in while selecting, signalling a distinct "edit mode". Portaled
          to <body> so the outer overflow-hidden container can't clip its
          rounded corners into squares at the screen edges. */}
      {createPortal(
        <AnimatePresence>
          {selectMode && (
            <motion.div
              key="edit-frame"
              aria-hidden="true"
              className="fixed inset-0 z-30 pointer-events-none rounded-[55px]"
              style={{ border: "4px solid #2DC5F8", boxShadow: "inset 0 0 26px -8px rgba(45,197,248,0.6)" }}
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.015 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="pt-10 pb-2 px-5 flex items-baseline flex-shrink-0 relative" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <div className="flex-1 flex items-baseline">
          {players.length > 0 && (
            <button
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
        </div>
        <h1 className="font-sans font-medium text-lg text-foreground text-center">Players</h1>
        <div className="flex-1 flex items-baseline justify-end">
          {!selectMode && (
            <button
              onPointerDown={primeIOSKeyboard}
              onClick={() => setEditing({})}
              className="text-sm font-medium text-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
              style={{ transform: "translateY(3px)" }}
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          )}
          {selectMode && players.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm font-medium text-accent-blue hover:opacity-80 transition-opacity px-2 py-1"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {canScroll && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {canScroll && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 py-4"
          style={{ paddingBottom: "calc(56px + 16px + 16px + env(safe-area-inset-bottom))" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center" style={{ gap: 20 }}>
              <FluentEmoji emoji="🕵️" size={140} style={{ display: "block" }} />
              <p className="text-white text-2xl [font-family:'Geist',_sans-serif] font-medium">No players added yet</p>
            </div>
          ) : (
            (() => {
              // Recency order within each group (players is created_date-desc).
              const favs = players.filter((p) => p.favorite);
              const others = players.filter((p) => !p.favorite);
              // Headers only when there's an actual split (both groups present).
              const hasSplit = favs.length > 0 && others.length > 0;
              // Plain header divs — they mount/unmount instantly. The rows'
              // manual FLIP glides everything below when a header appears or
              // disappears, so there's no snap and nothing for framer to fight.
              const header = (key, label) => (
                <div
                  key={key}
                  className="px-1 pt-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest"
                >
                  {label}
                </div>
              );
              const items = [];
              if (hasSplit) items.push(header("hdr-fav", "Favorites"));
              favs.forEach((p, i) => items.push(renderRow(p, i)));
              if (hasSplit) items.push(header("hdr-all", "All Players"));
              others.forEach((p, i) => items.push(renderRow(p, favs.length + i)));
              return items;
            })()
          )}
        </div>
      </div>

      {/* Floating bulk-delete pill — slides up when something is selected */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={SPRING_SHEET}
            className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
            style={{ bottom: "calc(24px + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="pointer-events-auto flex items-center gap-2 px-5 h-11 rounded-full bg-accent-red hover:bg-accent-red/90 text-white text-sm font-semibold shadow-2xl active:scale-95 transition-transform"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              Delete {selectedIds.size} {selectedIds.size === 1 ? "player" : "players"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerEditModal
        isOpen={!!editing}
        player={editing}
        usedColors={players.map((p) => p.color)}
        usedEmojis={players.map((p) => p.emoji).filter(Boolean)}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setEditing(null)}
      />

      <DeletePlayerConfirmModal
        isOpen={showBulkConfirm}
        count={selectedIds.size}
        playerName={selectedIds.size === 1 ? players.find((p) => selectedIds.has(p.id))?.name : undefined}
        onConfirm={handleBulkDelete}
        onClose={() => setShowBulkConfirm(false)}
      />
    </div>
  );
}