export const PLAYER_EMOJIS = [
  "😀", "😎", "🤓", "🥳", "😈", "🤡", "👻", "🤖", "👽", "🦄",
  "🐶", "🐱", "🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵", "🐲",
  "🦖", "🦕", "🐙", "🦀", "🐝", "🦋", "🌵", "🌸", "🍀", "🔥",
  "⭐", "⚡", "💎", "🎯", "🎲", "🃏", "♠️", "♥️", "♦️", "♣️",
  "🏆", "👑", "💀", "🚀", "⚔️", "🛡️", "🍕", "🍔", "🍩", "☕",
];

export default function EmojiPicker({ selected, onChange }) {
  return (
    <div className="grid grid-cols-7 gap-2 p-3 justify-items-center max-h-56 overflow-y-auto">
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted-foreground text-xs font-medium transition-transform active:scale-90"
        style={{ outline: !selected ? "2px solid white" : "none", outlineOffset: "2px" }}
        aria-label="No emoji"
      >
        None
      </button>
      {PLAYER_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onChange(emoji); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-transform active:scale-90"
          style={{ outline: selected === emoji ? "2px solid white" : "none", outlineOffset: "2px" }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}