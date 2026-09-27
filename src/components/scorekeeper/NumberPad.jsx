import { Delete } from "lucide-react";

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "±", "0", "⌫"];

const keyClass = "neo-press font-display h-14 flex items-center justify-center border-3 border-ink rounded-xl shadow-neo-sm text-2xl select-none";

export default function NumberPad({ value, onChange }) {
  const handleKey = (key) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "±") {
      if (value === "") onChange("-");
      else if (value === "-") onChange("");
      else onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
      return;
    }
    if (key === "0" && (value === "0" || value === "-0")) return;
    if (value === "0") {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 pr-1">
      {KEYS.map((key) => {
        const utility = key === "±" || key === "⌫";
        return (
          <button
            key={key}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); handleKey(key); }}
            aria-label={key === "⌫" ? "Delete last digit" : key === "±" ? "Switch between add and subtract" : undefined}
            className={`${keyClass} ${utility ? "bg-putty" : "bg-surface"}`}
          >
            {key === "⌫" ? <Delete size={26} strokeWidth={2.5} /> : key}
          </button>
        );
      })}
    </div>
  );
}
