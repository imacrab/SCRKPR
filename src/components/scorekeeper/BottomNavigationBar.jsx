import { useNavigate, useLocation } from "react-router-dom";
import { Spade, Users, History, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { TRANSITION_PAGE, TRANSITION_PANEL } from "@/lib/motion";

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
  const isHidden = hidden || pathname === "/game";
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.path === pathname));

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-30 flex"
      animate={{
        y: isHidden ? 140 : 0,
        opacity: isHidden ? 0 : 1,
        filter: isHidden ? "blur(8px)" : "blur(0px)",
      }}
      transition={TRANSITION_PAGE}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)", paddingLeft: "32px", paddingRight: "32px", pointerEvents: isHidden ? "none" : "auto", backgroundColor: "hsl(var(--background))" }}
    >
    <div className="relative flex flex-1">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 flex items-center justify-center"
        style={{
          width: `${100 / TABS.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="rounded-full bg-accent" style={{ width: 56, height: 40 }} />
      </div>
      {TABS.map(({ label, icon: Icon, path }) => {
        const active = pathname === path;
        return (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.96 }}
            transition={TRANSITION_PANEL}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors"
            style={{ minHeight: 56 }}
          >
            <motion.span
              animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
              transition={TRANSITION_PANEL}
              className="relative z-10 flex"
            >
              <Icon
                size={24}
                strokeWidth={2}
                style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              />
            </motion.span>
          </motion.button>
        );
      })}
    </div>
    </motion.div>
  );
}
