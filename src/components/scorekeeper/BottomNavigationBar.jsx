import { useNavigate, useLocation } from "react-router-dom";
import { Gamepad2, History, Settings } from "lucide-react";

const TABS = [
  { label: "New Game", icon: Gamepad2, path: "/" },
  { label: "History",  icon: History,  path: "/history" },
  { label: "Account",  icon: Settings,  path: "/account" },
];

export default function BottomNavigationBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide the nav bar during an active game
  if (pathname === "/game") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 bg-card border-t border-border flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
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
              size={22}
              strokeWidth={active ? 2.2 : 1.6}
              style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            />
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}