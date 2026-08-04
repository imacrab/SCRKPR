import { useState, useEffect } from "react";
import { AlertTriangle, Smartphone, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, SYNC_ENABLED } from "@/lib/store";
import { resetOnboarding } from "@/lib/onboarding";
import { base44 } from "@/api/base44Client";
import BottomSheetModal from "@/components/scorekeeper/BottomSheetModal";
import Toggle from "@/components/scorekeeper/Toggle";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";
import { useGameModeToggles, OPTIONAL_MODES } from "@/lib/useGameModeToggles";

export default function AccountSettings({ onBack, onModalChange }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { toggles, setMode } = useGameModeToggles();

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

  return (
    <div
      className="bg-background flex flex-col overflow-hidden"
      style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}

    >
      {/* Header */}
      <div className="pt-10 pb-4 px-5 flex items-center flex-shrink-0" style={{ backgroundColor: "hsl(var(--background) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}>
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4">
         {/* Game Modes — toggle optional modes on/off. Disabled modes are
             hidden from the Game Mode picker on the home screen. */}
         <div>
           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-1 pb-2">
             Game Modes
           </p>
           <div className="rounded-xl border border-border bg-card overflow-hidden">
             {OPTIONAL_MODES.map((mode) => (
               <div key={mode.id} className="px-4 py-3 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3 min-w-0">
                   <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                     <FluentEmoji emoji={mode.emoji} size={28} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-medium text-foreground">{mode.label}</p>
                     <p className="text-xs text-muted-foreground mt-0.5 truncate">{mode.description}</p>
                   </div>
                 </div>
                 <Toggle
                   checked={toggles[mode.id] !== false}
                   onChange={(next) => setMode(mode.id, next)}
                   ariaLabel={`Toggle ${mode.label}`}
                 />
               </div>
             ))}
           </div>
         </div>

         {/* System — grouped device/data controls in a single card. */}
         <div>
           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-1 pb-2">
             System
           </p>
           <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
             {/* Saved on this device */}
             <div className="px-4 py-4 flex items-center gap-3">
               <div className="w-9 h-9 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                 <Smartphone size={18} strokeWidth={2} className="text-accent-blue" />
               </div>
               <div>
                 <p className="text-sm font-medium text-foreground">Saved on this device</p>
                 <p className="text-xs text-muted-foreground mt-0.5">
                   Your players and games stay here — no account needed.
                 </p>
               </div>
             </div>

             {/* Replay welcome */}
             <div className="px-4 py-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                   <Sparkles size={18} strokeWidth={2} className="text-accent-blue" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-foreground">Replay Welcome</p>
                   <p className="text-xs text-muted-foreground mt-0.5">See the intro tour again.</p>
                 </div>
               </div>
               <button
                 onClick={() => { resetOnboarding(); window.location.href = "/"; }}
                 className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:text-foreground text-muted-foreground"
               >
                 Replay
               </button>
             </div>

             {/* Sign Out — only relevant once cloud sync is enabled */}
             {SYNC_ENABLED && (
               <div className="px-4 py-4 flex items-center justify-between gap-4">
                 <div>
                   <p className="text-sm font-medium text-foreground">Sign Out</p>
                   <p className="text-xs text-muted-foreground mt-0.5">End your session and return to login.</p>
                 </div>
                 <button
                   onClick={() => base44.auth.logout("/")}
                   className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:text-foreground text-muted-foreground"
                 >
                   Sign Out
                 </button>
               </div>
             )}

             {/* Clear all local data */}
             <div className="px-4 py-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-accent-red/10 flex items-center justify-center flex-shrink-0">
                   <Trash2 size={18} strokeWidth={2} className="text-accent-red" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-foreground">Clear All Data</p>
                   <p className="text-xs text-muted-foreground mt-0.5">Remove all saved players and game history from this device.</p>
                 </div>
               </div>
               <button
                 onClick={() => setShowConfirm(true)}
                 className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-white bg-accent-red/10 hover:bg-accent-red/20 flex-shrink-0"
               >
                 Clear
               </button>
             </div>
           </div>
         </div>
       </div>

      {/* Confirm modal — shared BottomSheetModal shell */}
      <BottomSheetModal
        isOpen={showConfirm}
        onClose={() => !clearing && setShowConfirm(false)}
        icon={<AlertTriangle size={32} strokeWidth={2} className="text-accent-red" />}
        title="Clear All Data?"
        description="This will permanently delete all saved players and game history from this device. This cannot be undone."
        footer={
          <div className="flex gap-3">
            <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-11" disabled={clearing}>
              Cancel
            </Button>
            <Button
              onClick={handleClearData}
              disabled={clearing}
              className="flex-1 h-11 font-semibold bg-accent-red hover:bg-accent-red/90 text-white"
            >
              {clearing ? "Clearing..." : "Yes, Clear"}
            </Button>
          </div>
        }
      />
    </div>
  );
}