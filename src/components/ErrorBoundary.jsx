import React from "react";
import logoDark from "@/assets/SCRKPR_dark_mode.png";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";

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
        <img src={logoDark} alt="SCRKPR!" className="mb-10" style={{ maxWidth: 130, height: "auto", opacity: 0.85 }} />
        <div className="mb-5">
          <FluentEmoji emoji="🎲" size={56} />
        </div>
        <h1 className="text-foreground text-xl font-bold mb-2">We had a little hiccup</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-9 max-w-[16rem]">
          No worries — your games are still saved. Let's head back home and pick up where you left off.
        </p>
        <button
          onClick={this.handleHome}
          className="py-3.5 px-8 rounded-full bg-white font-semibold text-base active:scale-95 transition-transform"
          style={{ color: "#111", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)" }}
        >
          Back to Home
        </button>
      </div>
    );
  }
}
