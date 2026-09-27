import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { LogoSticker } from "./neo";
import { NAV_TABS } from "./BottomNavigationBar";
import { TRANSITION_PANEL } from "@/lib/motion";
import { useIntroReveal } from "@/lib/useIntroReveal";

// Tablet counterpart to BottomNavigationBar: a full labelled sidebar in
// landscape, collapsing to an icon rail in portrait to leave room for panels.
export default function SideNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { phase: introPhase } = useIntroReveal();

  return (
    <nav
      aria-label="Main"
      className="flex-shrink-0 h-full flex flex-col w-[104px] landscape:w-[264px] px-4 landscape:px-5 bg-surface border-r-3 border-ink"
      style={{
        paddingTop: "max(calc(env(safe-area-inset-top) + 20px), 36px)",
        paddingBottom: "max(calc(env(safe-area-inset-bottom) + 12px), 28px)",
      }}
    >
      {/* Hidden until the intro's flying sticker lands here and hands off. */}
      <span data-logo-anchor className="block portrait:hidden pl-1" style={{ visibility: introPhase === "hidden" ? "hidden" : "visible" }}>
        <LogoSticker size="lg" />
      </span>

      <motion.div
        className="flex-1 flex flex-col"
        animate={{ opacity: introPhase === "hidden" ? 0 : 1, x: introPhase === "hidden" ? -40 : 0 }}
        transition={introPhase === "play" ? { ...TRANSITION_PANEL, delay: 0.75 } : TRANSITION_PANEL}
      >
        <div className="landscape:mt-10 flex flex-col gap-3.5">
          {NAV_TABS.map(({ label, icon: Icon, path }) => {
            const active = pathname === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`neo-press h-[56px] flex items-center justify-center landscape:justify-start gap-3.5 landscape:px-4 border-3 rounded-[14px] text-lg font-extrabold transition-colors duration-150 ${
                  active ? "bg-sun text-ink border-ink shadow-neo" : "border-transparent text-fg active:bg-ink/5"
                }`}
              >
                <Icon size={24} strokeWidth={2.25} />
                <span className="portrait:hidden">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-center landscape:justify-start gap-2 landscape:pl-1 text-subtle">
          <Smartphone size={16} strokeWidth={2.5} />
          <span className="portrait:hidden font-mono text-[11px] font-bold tracking-[0.12em] uppercase">Saved on this device</span>
        </div>
      </motion.div>
    </nav>
  );
}
