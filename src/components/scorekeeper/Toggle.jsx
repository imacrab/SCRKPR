import { motion } from "framer-motion";

export default function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="flex-shrink-0 w-[60px] h-11 flex items-center justify-center"
    >
      <span
        className="relative w-14 h-8 rounded-full border-3 border-ink transition-colors"
        style={{ backgroundColor: checked ? "#1FD66F" : "#E6E0D2" }}
      >
        <motion.span
          className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-surface border-3 border-ink"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}
