import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountSettings({ onBack, onModalChange }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const user = await base44.auth.me();
      // Delete all user data
      const games = await base44.entities.GameHistory.filter({ created_by: user.email });
      await Promise.all(games.map((g) => base44.entities.GameHistory.delete(g.id)));
      const groups = await base44.entities.PlayerGroup.filter({ created_by: user.email });
      await Promise.all(groups.map((g) => base44.entities.PlayerGroup.delete(g.id)));
      // Log out
      base44.auth.logout("/");
    } catch {
      setDeleting(false);
      setShowConfirm(false);
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
        <h1 className="font-sans font-medium text-lg text-foreground flex-1 text-center">Account Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4">
         {/* Sign Out */}
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

         {/* Delete Account */}
         <div className="rounded-xl border border-border bg-card overflow-hidden">
           <div className="px-4 py-4 flex items-center justify-between gap-4">
             <div>
               <p className="text-sm font-medium text-foreground">Delete Account</p>
               <p className="text-xs text-muted-foreground mt-0.5">Permanently remove your account and all data.</p>
             </div>
             <button
               onClick={() => setShowConfirm(true)}
               className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
               style={{ color: "#FF3A3A", backgroundColor: "rgba(255,58,58,0.08)" }}
             >
               Delete
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
              onClick={() => !deleting && setShowConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-[44px] shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="px-5 pt-5 pb-8">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <div className="flex flex-col items-center text-center mb-6">
                  <AlertTriangle size={32} strokeWidth={2} className="mb-3" style={{ color: "#FF3A3A" }} />
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">Delete Account?</h2>
                  <p className="text-sm text-muted-foreground">This will permanently delete all your games, groups, and account data. This cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-11" disabled={deleting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 h-11 font-semibold"
                    style={{ backgroundColor: "#FF3A3A", color: "white" }}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
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