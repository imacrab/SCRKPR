import { useState, useEffect } from "react";
import { AlertTriangle, LogOut, Monitor, Moon, Smartphone, Sparkles, Sun, Trash2 } from "lucide-react";
import { useThemePreference } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { db, SYNC_ENABLED } from "@/lib/store";
import { resetOnboarding } from "@/lib/onboarding";
import { base44 } from "@/api/base44Client";
import BottomSheetModal from "@/components/scorekeeper/BottomSheetModal";
import Toggle from "@/components/scorekeeper/Toggle";
import { PlayerTile, SectionLabel, PageTitle, SegmentedControl, PAGE_TOP } from "@/components/scorekeeper/neo";

const THEME_OPTIONS = [
  { id: "system", label: "Auto", icon: <Monitor size={18} strokeWidth={2.5} /> },
  { id: "light", label: "Light", icon: <Sun size={18} strokeWidth={2.5} /> },
  { id: "dark", label: "Dark", icon: <Moon size={18} strokeWidth={2.5} /> },
];

const MODE_COLORS = { swish: "#FF8A1F", ginrummy: "#FF4FA0", hotdice: "rgb(var(--surface))", phase10: "#9B6BFF", skipbo: "#1FBFFF" };
const cardClass = "mr-[5px] bg-surface border-3 border-ink rounded-2xl shadow-neo-md overflow-hidden divide-y-[2.5px] divide-ink";
import { useGameModeToggles, OPTIONAL_MODES } from "@/lib/useGameModeToggles";

export default function AccountSettings({ onBack, onModalChange }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { toggles, setMode } = useGameModeToggles();
  const [themePref, setThemePref] = useThemePreference();

  // Local-first: players + game history live on this device. "Clear" wipes the
  // local store. Sign Out is only meaningful once cloud sync (and therefore an
  // account) is enabled, so it stays hidden behind SYNC_ENABLED for now.
  const handleClearData = async () => {
    setClearing(true);
    try {
      await db.clearAll();
      setShowConfirm(false);
    } catch (e) {
      console.error("Failed to clear data:", e);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    onModalChange?.(showConfirm);
  }, [showConfirm, onModalChange]);

  const systemRow = (tileColor, icon, title, body, action) => (
    <div className="flex items-center gap-3 px-3 py-3.5">
      <PlayerTile color={tileColor} size={34} radius={9} border={2.5}>{icon}</PlayerTile>
      <div className="flex-1 min-w-0">
        <p className="text-base font-extrabold">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.35] font-medium text-subtle">{body}</p>
      </div>
      {action}
    </div>
  );

  return (
    <div
      className="bg-background flex flex-col overflow-hidden"
      style={{ height: "100dvh", paddingTop: PAGE_TOP, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="px-5 h-12 flex items-center flex-shrink-0">
        <PageTitle>Settings</PageTitle>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5" style={{ paddingBottom: "calc(69px + 24px + env(safe-area-inset-bottom))" }}>
        <SectionLabel className="mb-2.5">Appearance</SectionLabel>
        <SegmentedControl className="mr-[5px] shadow-neo-md" height={48} options={THEME_OPTIONS} value={themePref} onChange={setThemePref} />

        <SectionLabel className="mt-[26px] mb-2.5">Game Modes</SectionLabel>
        <div className={cardClass}>
          {OPTIONAL_MODES.map((mode) => (
            <div key={mode.id} className="h-14 flex items-center gap-3 pl-3 pr-2.5">
              <PlayerTile emoji={mode.emoji} color={MODE_COLORS[mode.id]} size={34} radius={9} border={2.5} />
              <p className="flex-1 text-[17px] font-bold">{mode.label}</p>
              <Toggle
                checked={toggles[mode.id] !== false}
                onChange={(next) => setMode(mode.id, next)}
                ariaLabel={`Toggle ${mode.label}`}
              />
            </div>
          ))}
        </div>

        <SectionLabel className="mt-[26px] mb-2.5">System</SectionLabel>
        <div className={cardClass}>
          {systemRow("#1FD66F", <Smartphone size={18} strokeWidth={2.5} />, "Saved on this device", "Players and games stay here. No account needed.")}
          {systemRow(
            "#FFD23F",
            <Sparkles size={18} strokeWidth={2.5} />,
            "Replay welcome",
            "See the intro tour again.",
            <Button size="sm" variant="outline" className="mr-[3px]" onClick={() => { resetOnboarding(); window.location.href = "/"; }}>
              Replay
            </Button>
          )}
          {SYNC_ENABLED && systemRow(
            "rgb(var(--surface))",
            <LogOut size={18} strokeWidth={2.5} />,
            "Sign out",
            "End your session and return to login.",
            <Button size="sm" variant="outline" className="mr-[3px]" onClick={() => base44.auth.logout("/")}>
              Sign out
            </Button>
          )}
          {systemRow(
            "#FF4B3E",
            <Trash2 size={18} strokeWidth={2.5} />,
            "Clear all data",
            "Remove every player and game from this device.",
            <Button size="sm" variant="destructive" className="mr-[3px]" onClick={() => setShowConfirm(true)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <BottomSheetModal
        isOpen={showConfirm}
        onClose={() => !clearing && setShowConfirm(false)}
        icon={<AlertTriangle size={30} strokeWidth={2.75} />}
        eyebrow="Confirm"
        title="Clear all data?"
        description="This permanently deletes every saved player and game from this device. It can't be undone."
        footer={
          <div className="grid grid-cols-2 gap-3.5">
            <Button onClick={() => setShowConfirm(false)} variant="outline" disabled={clearing}>
              Cancel
            </Button>
            <Button onClick={handleClearData} disabled={clearing} variant="destructive">
              {clearing ? "Clearing..." : "Yes, clear"}
            </Button>
          </div>
        }
      />
    </div>
  );
}
