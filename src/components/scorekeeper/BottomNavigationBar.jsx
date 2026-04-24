import { useNavigate, useLocation } from "react-router-dom";
import { Dices, History, Settings } from "lucide-react";

const TABS = [
  { label: "New Game", icon: Dices, path: "/" },
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
      className="fixed inset-x-0 bottom-0 z-30 flex"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)", paddingLeft: "16px", paddingRight: "16px" }}
    >
    <div className="flex flex-1 bg-card border border-border rounded-full overflow-hidden">
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
    </div>
  );
}