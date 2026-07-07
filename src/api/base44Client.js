// Local-first: the app runs entirely on-device (see SYNC_ENABLED in lib/store.js),
// so the Base44 SDK is not bundled. `base44` is a tiny stub that satisfies the
// auth surface the (now dormant) auth code still references — auth.me rejects so
// callers fall through to their unauthenticated path, and logout/redirect are
// no-ops. The zero-network, no-account, works-offline promise depends on this.
//
// Restoring cloud sync (a deliberate phase-2 rebuild): re-add `@base44/sdk` to
// package.json, then instantiate the real client here behind SYNC_ENABLED and
// reinstate the app-state/auth flow in lib/AuthContext.jsx.
function createStubClient() {
  const noop = () => {};
  return {
    auth: {
      me: () => Promise.reject(new Error('Sync disabled — local-first mode')),
      logout: noop,
      redirectToLogin: noop,
    },
  };
}

export const base44 = createStubClient();
