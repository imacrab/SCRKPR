import { useNavigate, useLocation } from "react-router-dom";
import { Spade, Users, History, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { TRANSITION_PAGE, TRANSITION_PANEL } from "@/lib/motion";
import { useIntroReveal } from "@/lib/useIntroReveal";

const TABS = [
  { label: "New Game", icon: Spade,    path: "/" },
  { label: "Players",  icon: Users,    path: "/players" },
  { label: "History",  icon: History,  path: "/history" },
  { label: "Account",  icon: Settings, path: "/account" },
];

export default function BottomNavigationBar({ hidden = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Slide the nav bar down (and fade out) during an active game,
  // slide back up (and fade in) when returning to any other route.
  const { phase: introPhase } = useIntroReveal();
  const isHidden = hidden || pathname === "/game" || introPhase === "hidden";
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.path === pathname));

  return (
    <motion.nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 bg-surface border-t-3 border-ink"
      animate={{
        y: isHidden ? 140 : 0,
        opacity: isHidden ? 0 : 1,
      }}
      transition={introPhase === "play" ? { ...TRANSITION_PAGE, delay: 0.75 } : TRANSITION_PAGE}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        pointerEvents: isHidden ? "none" : "auto",
      }}
    >
      <div className="relative grid grid-cols-4 gap-3 px-[18px] pt-2.5 pb-2" style={{ height: 66 }}>
        <div
          aria-hidden="true"
          className="absolute top-2.5 bottom-2 left-[18px] pointer-events-none"
          style={{
            width: "calc((100% - 36px - 36px) / 4)",
            transform: `translateX(calc(${activeIndex} * (100% + 12px)))`,
            transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="w-full h-full bg-sun text-ink border-3 border-ink rounded-xl shadow-neo-sm" />
        </div>
        {TABS.map(({ label, icon: Icon, path }) => {
          const active = pathname === path;
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.94 }}
              transition={TRANSITION_PANEL}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center justify-center transition-colors ${active ? "text-ink" : "text-fg"}`}
              style={{ minHeight: 44 }}
            >
              <Icon size={26} strokeWidth={2.25} />
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
