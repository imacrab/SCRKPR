import { Delete } from "lucide-react";

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["-", "0", "."],
];

export default function NumberPad({ value, onChange }) {
  const handleKey = (key) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    // Prevent double minus or minus not at start
    if (key === "-") {
      if (value.length === 0) {
        onChange("-");
      } else if (value === "-") {
        onChange("");
      }
      return;
    }
    // Prevent double decimal
    if (key === "." && value.includes(".")) return;
    // Prevent leading zeros (except "0.")
    if (key === "0" && value === "0") return;
    if (key !== "." && key !== "-" && value === "0") {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  return (
    <div className="w-full mt-2">
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex gap-2 mb-2">
          {row.map((key) => (
            <button
              key={key}
              onPointerDown={(e) => { e.preventDefault(); handleKey(key); }}
              className="flex-1 h-12 rounded-xl font-semibold text-lg text-white transition-all active:scale-95 select-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      {/* Bottom row: clear + backspace */}
      <div className="flex gap-2">
        <button
          onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
          className="flex-1 h-12 rounded-xl font-semibold text-sm text-[#c8c8c8] transition-all active:scale-95 select-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          Clear
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); handleKey("⌫"); }}
          className="flex-1 h-12 rounded-xl font-semibold text-[#c8c8c8] flex items-center justify-center transition-all active:scale-95 select-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
          aria-label="Backspace"
        >
          <Delete size={18} />
        </button>
      </div>
    </div>
  );
}