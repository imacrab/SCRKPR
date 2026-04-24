import { useNavigate, useLocation } from "react-router-dom";
import { Dices, History, Settings } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  { label: "New Game", icon: Dices, path: "/" },
  { label: "History",  icon: History,  path: "/history" },
  { label: "Account",  icon: Settings,  path: "/account" },
];

export default function BottomNavigationBar({ hidden = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide the nav bar during an active game
  if (pathname === "/game") return null;

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-30 flex"
      animate={{ y: hidden ? 120 : 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)", paddingLeft: "8px", paddingRight: "8px" }}
    >
    <div className="flex flex-1 border border-border rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--card) / 0.8)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
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
              strokeWidth={active ? 2.2 : 1.6}
              style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            />
          </button>
        );
      })}
    </div>
    </motion.div>
  );
}