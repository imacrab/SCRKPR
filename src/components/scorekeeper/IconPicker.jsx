import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PLAYER_ICON_LIBRARY } from "@/lib/playerIcons";
import NeoIcon from "./NeoIcon";

function matchesQuery(keywords, q) {
  if (!q) return true;
  const haystack = keywords.toLowerCase();
  const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

export default function IconPicker({ selected, onChange, stickyClassName = "top-0" }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return PLAYER_ICON_LIBRARY;
    return PLAYER_ICON_LIBRARY.filter(([id, , kws]) => matchesQuery(`${id} ${kws}`, query));
  }, [query]);

  return (
    <div className="flex flex-col">
      <div className={`sticky z-[5] bg-paper pb-2 pr-1 ${stickyClassName}`}>
        <div className="relative">
          <Search
            size={18}
            strokeWidth={2.5}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons"
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface border-3 border-ink font-bold text-fg placeholder:text-faint placeholder:font-semibold focus:outline-none focus:shadow-neo-sm"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 pt-1 pb-3 pr-1">
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
          className="font-mono aspect-square flex items-center justify-center border-2.5 border-ink rounded-[10px] text-[10px] font-bold uppercase transition-[transform,box-shadow] duration-100"
          style={{ background: !selected ? "#FFD23F" : "rgb(var(--surface))", color: !selected ? "rgb(var(--ink))" : undefined, boxShadow: !selected ? "3px 3px 0 rgb(var(--ink))" : "none", transform: !selected ? "translate(-2px, -2px)" : "none" }}
          aria-label="No icon"
        >
          None
        </button>
        {filtered.map(([id]) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={id.replace(/-/g, " ")}
              aria-pressed={active}
              onPointerDown={(e) => { e.preventDefault(); onChange(id); }}
              className={`aspect-square flex items-center justify-center border-2.5 border-ink rounded-[10px] transition-[transform,box-shadow] duration-100 ${active ? "text-ink" : "text-fg"}`}
              style={{ background: active ? "#FFD23F" : "rgb(var(--surface))", boxShadow: active ? "3px 3px 0 rgb(var(--ink))" : "none", transform: active ? "translate(-2px, -2px)" : "none" }}
            >
              <motion.span
                animate={active ? { scale: [1, 1.35, 1], rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="flex"
              >
                <NeoIcon name={id} size={30} />
              </motion.span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-6 py-6 text-center text-sm font-semibold text-subtle">
            No icons match "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
