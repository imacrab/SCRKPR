import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play, Save, TrendingUp, TrendingDown, Pencil, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SaveGroupModal from "./SaveGroupModal";
import EditGroupModal from "./EditGroupModal";

export const PLAYER_COLORS = [
  "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#FF3A3A", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#64748B", "#A78BFA", "#FB7185", "#34D399",
];

function ColorPicker({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {PLAYER_COLORS.map((color) => (
        <button
          key={color}
          onPointerDown={(e) => { e.preventDefault(); onChange(color); }}
          className="w-6 h-6 rounded-full transition-transform active:scale-90"
          style={{ backgroundColor: color, outline: selected === color ? "2px solid white" : "none", outlineOffset: "2px" }}
        />
      ))}
    </div>
  );
}

export default function PlayerSetup({ onStart, onModalChange }) {
  const [players, setPlayers] = useState([
    { name: "", color: PLAYER_COLORS[0] },
    { name: "", color: PLAYER_COLORS[1] },
  ]);
  const [expandedColor, setExpandedColor] = useState(null);
  const [groups, setGroups] = useState(null); // null = loading, [] = no groups
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [lastTappedGroupId, setLastTappedGroupId] = useState(null);
  const [canScrollPlayers, setCanScrollPlayers] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const lastTapTimeRef = useRef({});

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setShowSaveGroupWithNav = (val) => {
    setShowSaveGroup(val);
    onModalChange?.(val);
  };

  const setEditingGroupWithNav = (val) => {
    setEditingGroup(val);
    onModalChange?.(!!val);
  };
  const [activeGroup, setActiveGroup] = useState(null); // the loaded group, if any
  const [winMode, setWinMode] = useState("low"); // "high" | "low"
  const scrollRef = useRef(null);
  const inputRefs = useRef([]);

  const handleKeyDown = (e, i) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputRefs.current[i + 1];
      if (next) {
        next.focus();
        next.select();
      }
    }
  };

  const sortGroups = (data) => {
    const pinned = data.filter((g) => g.pinned);
    const rest = data.filter((g) => !g.pinned);
    return [...pinned, ...rest];
  };

  useEffect(() => {
    base44.entities.PlayerGroup.list("-created_date", 20).then((data) => {
    setGroups(sortGroups(data));
    }).catch(() => setGroups([]));
  }, []);

  // Check if players list can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScrollPlayers(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [players]);

  const addPlayer = () => {
    if (players.length < 20) {
      setPlayers([...players, { name: "", color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] }]);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  };

  const removePlayer = (i) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, idx) => idx !== i));
      if (expandedColor === i) setExpandedColor(null);
    }
  };

  const updateName = (i, val) => {
    const updated = [...players];
    updated[i] = { ...updated[i], name: val };
    setPlayers(updated);
  };

  const updateColor = (i, color) => {
    const updated = [...players];
    updated[i] = { ...updated[i], color };
    setPlayers(updated);
    setExpandedColor(null);
  };

  const handleSaveGroup = async (groupName, pinned) => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < 2) return;
    const group = await base44.entities.PlayerGroup.create({ name: groupName, pinned: !!pinned, players: valid });
    setGroups((prev) => sortGroups([group, ...prev]));
    setShowSaveGroupWithNav(false);
  };

  const handleEditGroup = async (newName, pinned) => {
    if (!editingGroup) return;
    const updated = { ...editingGroup, name: newName, pinned };
    await base44.entities.PlayerGroup.update(editingGroup.id, { name: newName, pinned });
    setGroups((prev) => sortGroups(prev.map((g) => g.id === editingGroup.id ? updated : g)));
    setEditingGroup(null);
  };

  const deleteGroup = async (id) => {
    await base44.entities.PlayerGroup.delete(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeGroup?.id === id) setActiveGroup(null);
  };

  const loadGroup = (group) => {
    setPlayers(group.players.map((p) => ({ name: p.name, color: p.color })));
    setExpandedColor(null);
    setActiveGroup(group);
  };

  const handleGroupNameClick = (group) => {
    const now = Date.now();
    const lastTapTime = lastTapTimeRef.current[group.id] || 0;
    
    if (group.id === lastTappedGroupId && now - lastTapTime < 300) {
      // Double tap detected
      setEditingGroupWithNav(group);
      setLastTappedGroupId(null);
      lastTapTimeRef.current[group.id] = 0;
    } else {
      // Single tap
      loadGroup(group);
      setLastTappedGroupId(group.id);
      lastTapTimeRef.current[group.id] = now;
    }
  };

  const handleUpdateGroup = async () => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < 2 || !activeGroup) return;
    const updated = await base44.entities.PlayerGroup.update(activeGroup.id, { players: valid });
    setGroups((prev) => prev.map((g) => g.id === activeGroup.id ? { ...g, players: valid } : g));
    setActiveGroup({ ...activeGroup, players: valid });
  };

  const canStart = players.filter((p) => p.name.trim()).length >= 2;
  const hasValidPlayers = players.filter((p) => p.name.trim()).length >= 2;

  const handleStart = () => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length >= 2) onStart(valid, winMode);
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || (source.index === destination.index && source.droppableId === destination.droppableId)) {
      return;
    }
    const newPlayers = Array.from(players);
    const [moved] = newPlayers.splice(source.index, 1);
    newPlayers.splice(destination.index, 0, moved);
    setPlayers(newPlayers);
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden" style={{ height: "100%", paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <div className="pt-10 pb-5 px-6" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <img src={isDarkMode ? "https://media.base44.com/images/public/69ea763700078809357a164a/87badac38_SCRKPR_dark_mode.png" : "https://media.base44.com/images/public/69ea763700078809357a164a/6de7dc994_SCRKPR_light_mode.png"} alt="SCRKPR!" className="mx-auto" style={{ maxWidth: 200, height: "auto" }} />
      </div>

      {/* Saved Groups */}
      {groups && groups.length > 0 && (
        <div className="mb-0">
          <div className="flex gap-2 overflow-x-auto pb-1 px-5">
            {groups.map((g) => (
              <div key={g.id} className="flex-shrink-0 flex items-center rounded-lg bg-card border overflow-hidden"
                style={{ borderColor: "hsl(var(--border))" }}>
                <button onClick={() => handleGroupNameClick(g)} className="flex items-center gap-1.5 px-3 py-2">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{g.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="flex-1 relative overflow-hidden">
        {/* Top fade */}
        {canScrollPlayers && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {/* Bottom fade */}
        {canScrollPlayers && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="players">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="h-full overflow-y-auto px-5 pt-2 pb-4 space-y-2"
              style={{ ...provided.droppableProps.style }}
            >
              {players.map((player, i) => (
                <Draggable key={`player-${i}`} draggableId={`player-${i}`} index={i}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -16, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg border border-border bg-card overflow-hidden"
                      style={{
                        opacity: snapshot.isDragging ? 0.5 : 1,
                        boxShadow: snapshot.isDragging ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
                        ...provided.draggableProps.style,
                      }}
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div {...provided.dragHandleProps} className="flex items-center justify-center w-5 h-5 flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripVertical size={18} />
                        </div>
                        <button
                          onPointerDown={(e) => { e.preventDefault(); setExpandedColor(expandedColor === i ? null : i); }}
                          className="w-7 h-7 rounded-full flex-shrink-0 transition-transform active:scale-90 border-2 border-white/20"
                          style={{ backgroundColor: player.color }}
                        />
                        <Input
                          ref={(el) => (inputRefs.current[i] = el)}
                          value={player.name}
                          onChange={(e) => updateName(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i)}
                          placeholder={`Player ${i + 1}`}
                          maxLength={20}
                          className="flex-1 bg-transparent border-none shadow-none h-9 px-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                        {players.length > 2 && (
                          <button onClick={() => removePlayer(i)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-accent-red transition-colors">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {expandedColor === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-border px-3 pb-3"
                          >
                            <ColorPicker selected={player.color} onChange={(c) => updateColor(i, c)} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {players.length < 20 && (
                <button
                  onClick={addPlayer}
                  className="w-full mt-1 h-11 rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors border border-dashed border-border hover:border-accent-blue/50"
                >
                  <Plus size={24} />
                  Add Player
                </button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </div>

      {/* Win mode */}
      <div className="px-5 pt-2 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Winner has</p>
        <div className="flex gap-2">
          {[
            { value: "low",  label: "Low Score",  Icon: TrendingDown },
            { value: "high", label: "High Score", Icon: TrendingUp },
          ].map((opt) => {
            const active = winMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setWinMode(opt.value)}
                className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: active ? "#1e7fd9" : "hsl(var(--border))",
                  backgroundColor: active ? "#e3f2fd" : "transparent",
                }}
              >
                <opt.Icon
                  size={24}
                  strokeWidth={1.5}
                  style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                />
                <span className="text-sm font-medium" style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pt-0 flex flex-col gap-3" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        {hasValidPlayers && (
          <div className="flex gap-2">
            {activeGroup && (
              <Button
                onClick={handleUpdateGroup}
                variant="outline"
                className="flex-1 h-10 text-sm text-muted-foreground"
              >
                <Save size={24} className="mr-1.5" />
                Update Group
              </Button>
            )}
            <Button
              onClick={() => setShowSaveGroupWithNav(true)}
              variant="outline"
              className="flex-1 h-10 text-sm text-muted-foreground"
            >
              <Save size={24} className="mr-1.5" />
              Save as Group
            </Button>
          </div>
        )}
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full text-base font-semibold bg-white hover:bg-white/90"
          style={{ height: "52px", color: "#111", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
        >
          <Play size={24} className="mr-2" />
          Start Game
        </Button>
      </div>

      <SaveGroupModal
        isOpen={showSaveGroup}
        onSave={handleSaveGroup}
        onClose={() => setShowSaveGroupWithNav(false)}
      />

      <EditGroupModal
        isOpen={!!editingGroup}
        group={editingGroup}
        onSave={handleEditGroup}
        onDelete={deleteGroup}
        onClose={() => setEditingGroupWithNav(null)}
      />
    </div>
  );
}