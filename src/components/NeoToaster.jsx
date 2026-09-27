import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { SUCCESS } from "@/lib/colors";
import { SPRING_ENTER, TRANSITION_SLIDE_OUT } from "@/lib/motion";
import { useCurrentToast } from "@/lib/neoToast";

export default function NeoToaster() {
  const toast = useCurrentToast();
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-[100] flex justify-center px-4 pointer-events-none"
      style={{ top: "max(16px, env(safe-area-inset-top))" }}
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: "-160%" }}
            animate={{ y: 0, transition: SPRING_ENTER }}
            exit={{ y: "-160%", transition: TRANSITION_SLIDE_OUT }}
            className="absolute flex items-center gap-2.5 h-12 pl-3.5 pr-5 text-ink border-3 border-ink rounded-xl shadow-neo font-extrabold text-[15px]"
            style={{ background: SUCCESS }}
          >
            <Check size={20} strokeWidth={3} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
