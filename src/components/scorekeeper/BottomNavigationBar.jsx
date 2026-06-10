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
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom))", paddingLeft: "24px", paddingRight: "24px", pointerEvents: isHidden ? "none" : "auto" }}
    >
    <div className="flex flex-1 border border-border rounded-tl-2xl rounded-tr-2xl rounded-bl-sm rounded-br-sm overflow-hidden" style={{ backgroundColor: "hsl(var(--card) / 0.8)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
      {TABS.map(({ label, icon: Icon, path }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            style={{ minHeight: 56 }}
          >
            <Icon
              size={30}
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