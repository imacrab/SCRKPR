import { useNavigate, useLocation } from "react-router-dom";
import { Spade, Users, History, Settings } from "lucide-react";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-30 flex"
      animate={{
        y: isHidden ? 140 : 0,
        opacity: isHidden ? 0 : 1,
        filter: isHidden ? "blur(8px)" : "blur(0px)",
      }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)", paddingLeft: "32px", paddingRight: "32px", pointerEvents: isHidden ? "none" : "auto" }}
    >
    <div
      className="relative flex flex-1 rounded-full overflow-hidden"
      style={{
        backgroundColor: "rgba(28, 28, 32, 0.55)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow:
          "0 10px 30px -8px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      {/* Glossy top highlight */}
      <div />
      {TABS.map(({ label, icon: Icon, path }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors"
            style={{ minHeight: 56 }}
          >
            <Icon
              size={24}
              strokeWidth={2}
              style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            />
          </button>
        );
      })}
    </div>
    </motion.div>
  );
}