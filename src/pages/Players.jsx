import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Star } from "lucide-react";
import PlayerEditModal from "@/components/scorekeeper/PlayerEditModal";
import PlayerEditPanel, { PlayerEditPanelEmpty } from "@/components/scorekeeper/PlayerEditPanel";
import DeletePlayerConfirmModal from "@/components/scorekeeper/DeletePlayerConfirmModal";
import { PlayerTile, SectionLabel, PageTitle, HeaderLink, PAGE_TOP, WIDE_PAGE_TOP } from "@/components/scorekeeper/neo";
import { toNeoColor } from "@/lib/colors";
import { SPRING_SHEET } from "@/lib/motion";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";
import { useWideLayout } from "@/lib/useWideLayout";
import { showToast } from "@/lib/neoToast";

export default function Players({ onBack, onModalChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | player (existing)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [poppedId, setPoppedId] = useState(null); // star that just bounced
  const [discardCount, setDiscardCount] = useState(0); // remounts the inline editor to drop edits
  const wide = useWideLayout();
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

  const handleSave = async ({ id, name, color, emoji, cardStyle }) => {
    let saved;
    if (id) {
      await db.players.update(id, { name, color, emoji, cardStyle });
      saved = { ...players.find((p) => p.id === id), name, color, emoji, cardStyle };
      setPlayers((prev) => prev.map((p) => (p.id === id ? saved : p)));
      showToast("Player updated");
    } else {
      saved = await db.players.create({ name, color, emoji, cardStyle });
      setPlayers((prev) => [saved, ...prev]);
    }
    // The inline tablet editor stays on the player it just saved.
    setEditing(wide ? saved : null);
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
    const isEditingRow = wide && !selectMode && editing?.id === p.id;
    return (
      <div key={p.id} data-row-id={p.id} data-idx={idx} className="pb-3">
        <button
          onClick={() => {
            if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
            if (selectMode) toggleSelect(p.id); else setEditing(p);
          }}
          onPointerDown={(e) => { if (!selectMode) primeIOSKeyboard(); startLongPress(e, p); }}
          onContextMenu={(e) => e.preventDefault()}
          className="neo-press w-[calc(100%-4px)] h-[68px] flex items-center gap-3.5 pl-2.5 pr-2 text-left bg-surface border-3 border-ink rounded-[14px] shadow-neo"
          style={{
            backgroundColor: isSelected ? "rgba(255, 75, 62, 0.22)" : isEditingRow ? toNeoColor(p.color) : "rgb(var(--surface))",
            color: isEditingRow ? "rgb(var(--ink))" : undefined,
          }}
        >
          <PlayerTile icon={p.emoji} color={toNeoColor(p.color)} size={46} radius={10} />
          <span className="flex-1 min-w-0 text-[21px] font-extrabold truncate">{p.name}</span>
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
                <Star size={26} strokeWidth={2.25} fill={p.favorite ? "#FFD23F" : "transparent"} />
              </motion.span>
            </span>
          )}
          {selectMode && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SHEET}
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center"
            >
              <span
                className="w-[30px] h-[30px] flex items-center justify-center border-3 border-ink rounded-lg transition-colors"
                style={{ backgroundColor: isSelected ? "#FF4B3E" : "rgb(var(--surface))", color: "rgb(var(--ink))" }}
              >
                {isSelected && <Check size={18} strokeWidth={3.5} />}
              </span>
            </motion.span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden lg:px-6" style={{ height: "100dvh", paddingTop: wide ? WIDE_PAGE_TOP : PAGE_TOP, paddingBottom: wide ? "max(env(safe-area-inset-bottom), 28px)" : "env(safe-area-inset-bottom)" }}>
      {/* Edit-mode frame — portaled to <body> so the page's overflow-hidden
          can't clip its rounded corners at the screen edges. */}
      {createPortal(
        <AnimatePresence>
          {selectMode && (
            <motion.div
              key="edit-frame"
              aria-hidden="true"
              className="fixed inset-0 z-30 pointer-events-none rounded-[55px]"
              style={{ border: "5px solid rgb(var(--fg))" }}
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.015 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="px-5 flex items-center gap-2 h-12 lg:h-16 flex-shrink-0">
        {selectMode ? (
          <>
            <HeaderLink onClick={exitSelectMode}>Cancel</HeaderLink>
            <PageTitle className="flex-1 text-center text-2xl">{selectedIds.size} selected</PageTitle>
            <HeaderLink onClick={toggleSelectAll}>{allSelected ? "None" : "All"}</HeaderLink>
          </>
        ) : (
          <>
            <PageTitle className="flex-1 text-[32px]">Players</PageTitle>
            {players.length > 0 && <HeaderLink className="px-2.5" onClick={() => setSelectMode(true)}>Select</HeaderLink>}
            <button
              onPointerDown={primeIOSKeyboard}
              onClick={() => setEditing({})}
              aria-label="Add player"
              className="neo-press w-[46px] h-[46px] lg:w-auto lg:h-[52px] lg:px-5 lg:gap-2 lg:ml-4 mr-1 flex items-center justify-center bg-sun text-ink border-3 border-ink rounded-xl shadow-neo lg:text-[17px] font-extrabold"
            >
              <Plus size={22} strokeWidth={3} />
              {wide && "Add player"}
            </button>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex lg:gap-6 lg:mt-5">
      <div className="flex-1 lg:flex-none lg:w-[340px] landscape:lg:w-[400px] relative overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-5 pt-2"
          style={{ paddingBottom: wide ? 24 : "calc(69px + 24px + env(safe-area-inset-bottom))" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <div className="relative flex flex-col items-center text-center">
              <svg width="96" height="96" viewBox="0 0 120 120" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute right-6 -top-1">
                <path d="M18 110 C 30 60, 60 34, 104 16" />
                <path d="M84 12 L 106 15 L 98 36" />
              </svg>
              <div className="relative w-[320px] h-[230px] mt-24">
                {[
                  { left: 40, top: 0, w: 240, rot: -6, bar: 110 },
                  { left: 22, top: 78, w: 260, rot: 3, bar: 140 },
                ].map(({ left, top, w, rot, bar }) => (
                  <div key={top} className="absolute h-16 flex items-center gap-3 px-3 bg-surface border-3 border-ink rounded-[14px] shadow-neo" style={{ left, top, width: w, transform: `rotate(${rot}deg)` }}>
                    <span className="w-10 h-10 border-3 border-dashed border-ink rounded-[10px]" />
                    <span className="h-3 rounded-md bg-hairline" style={{ width: bar }} />
                  </div>
                ))}
                <div className="absolute h-16 flex items-center gap-3 px-3 bg-sun text-ink border-3 border-ink rounded-[14px] shadow-neo" style={{ left: 48, top: 156, width: 240, transform: "rotate(-2deg)" }}>
                  <span className="font-display w-10 h-10 flex items-center justify-center bg-surface border-3 border-ink rounded-[10px] text-[22px]">?</span>
                  <span className="h-3 w-[90px] rounded-md bg-ink" />
                </div>
              </div>
              <h2 className="font-display mt-10 text-[28px] leading-[1.1] uppercase">Add some players</h2>
              <p className="mt-3 text-[17px] font-medium text-subtle">Tap the + above to get started.</p>
              <button
                onPointerDown={primeIOSKeyboard}
                onClick={() => setEditing({})}
                className="neo-press mt-7 h-14 px-7 flex items-center gap-2.5 bg-surface border-3 border-ink rounded-xl shadow-neo-md text-[17px] font-extrabold"
              >
                <Plus size={20} strokeWidth={3} />
                Add first player
              </button>
            </div>
          ) : (
            (() => {
              // Recency order within each group (players is created_date-desc).
              const favs = players.filter((p) => p.favorite);
              const others = players.filter((p) => !p.favorite);
              const hasSplit = favs.length > 0 && others.length > 0;
              // Plain header divs — the rows' manual FLIP glides everything below
              // when a header appears or disappears.
              const header = (key, label, first) => (
                <SectionLabel key={key} className={`${first ? "mt-2" : "mt-3.5"} mb-2.5`}>{label}</SectionLabel>
              );
              const items = [];
              if (hasSplit) items.push(header("hdr-fav", "Favorites", true));
              favs.forEach((p, i) => items.push(renderRow(p, i)));
              if (hasSplit) items.push(header("hdr-all", "All Players", false));
              others.forEach((p, i) => items.push(renderRow(p, favs.length + i)));
              return items;
            })()
          )}
        </div>
      </div>

      {wide && (
        <div className="flex-1 min-w-0 pt-2 pr-5 pb-2">
          {editing ? (
            <PlayerEditPanel
              key={`${editing.id ?? "new"}-${discardCount}`}
              player={editing}
              usedColors={players.map((p) => p.color)}
              usedEmojis={players.map((p) => p.emoji).filter(Boolean)}
              onSave={handleSave}
              onDelete={handleDelete}
              onDiscard={() => (editing.id ? setDiscardCount((n) => n + 1) : setEditing(null))}
            />
          ) : (
            <PlayerEditPanelEmpty onAdd={() => setEditing({})} />
          )}
        </div>
      )}
      </div>

      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={SPRING_SHEET}
            className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
            style={{ bottom: "calc(28px + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="neo-press pointer-events-auto h-14 px-6 flex items-center gap-2.5 bg-danger text-ink border-3 border-ink rounded-xl shadow-neo-md text-[17px] font-extrabold"
            >
              <Trash2 size={20} strokeWidth={2.5} />
              Delete {selectedIds.size} {selectedIds.size === 1 ? "player" : "players"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerEditModal
        isOpen={!!editing && !wide}
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