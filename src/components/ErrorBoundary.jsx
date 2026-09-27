import React from "react";
import { LogoSticker, PlayerTile } from "@/components/scorekeeper/neo";
import NeoIcon from "@/components/scorekeeper/NeoIcon";

/**
 * App-level error boundary. React error boundaries must be class components.
 *
 * Catches any render/lifecycle crash in the page tree so a single broken page
 * can't white-screen the whole app. Shows a calm, on-brand fallback and a
 * "Back to Home" action that hard-reloads to "/" — a fresh mount that clears
 * whatever transient state caused the crash. Game data lives in localStorage +
 * the backend, so nothing is lost (hence the reassurance copy).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surfaced in the console for now; a telemetry hook could go here later.
    console.error("[ErrorBoundary] caught an error:", error, info?.componentStack);
  }

  handleHome = () => {
    // Hard reload to home — re-mounts the app fresh from saved state.
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-8 text-center"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <LogoSticker size="lg" className="mb-12" />
        <PlayerTile color="#FF4FA0" size={96} radius={22} rotate={-6} className="shadow-neo-md">
          <NeoIcon name="dices" size={58} />
        </PlayerTile>
        <h1 className="font-display mt-8 text-[26px] leading-[1.1] uppercase">We had a little hiccup</h1>
        <p className="mt-3 mb-8 text-base font-medium leading-relaxed text-subtle max-w-[18rem]">
          No worries — your games are still saved. Let's head back home and pick up where you left off.
        </p>
        <button
          onClick={this.handleHome}
          className="neo-press h-14 px-8 bg-sun text-ink border-3 border-ink rounded-xl shadow-neo-md text-[17px] font-extrabold"
        >
          Back to home
        </button>
      </div>
    );
  }
}