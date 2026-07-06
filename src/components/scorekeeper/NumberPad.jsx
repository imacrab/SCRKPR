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
    if (key === "-") {
      if (value.length === 0) onChange("-");
      else if (value === "-") onChange("");
      return;
    }
    if (key === "." && value.includes(".")) return;
    if (key === "0" && value === "0") return;
    if (key !== "." && key !== "-" && value === "0") {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  return (
    <div className="w-full space-y-2">
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex gap-2">
          {row.map((key) => (
            <button
              key={key}
              onPointerDown={(e) => { e.preventDefault(); handleKey(key); }}
              className="flex-1 h-12 rounded-full bg-secondary hover:bg-accent text-white font-semibold text-lg transition-colors active:scale-95 select-none border border-border"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      {/* Clear + Backspace */}
      <div className="flex gap-2">
        <button
          onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
          className="flex-1 h-12 rounded-full bg-secondary hover:bg-accent text-white font-medium text-sm transition-colors active:scale-95 select-none border border-border"
        >
          Clear
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); handleKey("⌫"); }}
          className="flex-1 h-12 rounded-full bg-secondary hover:bg-accent text-white flex items-center justify-center transition-colors active:scale-95 select-none border border-border"
          aria-label="Backspace"
        >
          <Delete size={17} />
        </button>
      </div>
    </div>
  );
}
