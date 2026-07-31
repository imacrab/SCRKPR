import { motion } from "framer-motion";

/**
 * Simple iOS-style toggle switch. Uncontrolled visuals — parent owns state.
 */
export default function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative w-[52px] h-[32px] rounded-full flex-shrink-0 transition-colors"
      style={{
        backgroundColor: checked ? "#2DC5F8" : "rgba(255,255,255,0.12)",
      }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-[26px] h-[26px] rounded-full bg-white shadow-md"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}