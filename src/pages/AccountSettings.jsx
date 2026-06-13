import { useState, useEffect } from "react";
import { AlertTriangle, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, SYNC_ENABLED } from "@/lib/store";
import { resetOnboarding } from "@/lib/onboarding";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SHEET } from "@/lib/motion";

export default function AccountSettings({ onBack, onModalChange }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

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
         {/* Calm, truthful local-first status — your data lives on this device. */}
         <div className="rounded-xl border border-border bg-card overflow-hidden">
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
         </div>

         {/* Replay the welcome / intro flow */}
         <div className="rounded-xl border border-border bg-card overflow-hidden">
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
         </div>

         {/* Sign Out — only relevant once cloud sync is enabled */}
         {SYNC_ENABLED && (
           <div className="rounded-xl border border-border bg-card overflow-hidden">
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
           </div>
         )}

         {/* Clear all local data */}
         <div className="rounded-xl border border-border bg-card overflow-hidden">
           <div className="px-4 py-4 flex items-center justify-between gap-4">
             <div>
               <p className="text-sm font-medium text-foreground">Clear All Data</p>
               <p className="text-xs text-muted-foreground mt-0.5">Remove all saved players and game history from this device.</p>
             </div>
             <button
               onClick={() => setShowConfirm(true)}
               className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-accent-red bg-accent-red/10 hover:bg-accent-red/20"
             >
               Clear
             </button>
           </div>
         </div>
       </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => !clearing && setShowConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={SPRING_SHEET}
              className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-sheet shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex flex-col items-center text-center mb-6">
                  <AlertTriangle size={32} strokeWidth={2} className="mb-3 text-accent-red" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">Clear All Data?</h2>
                  <p className="text-sm text-muted-foreground">This will permanently delete all saved players and game history from this device. This cannot be undone.</p>
                </div>
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
