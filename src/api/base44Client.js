import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { SYNC_ENABLED } from '@/lib/store';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Local-first: when cloud sync is disabled we don't instantiate the Base44 SDK
// at all. Instantiating it pings the backend (auth.me) on boot, which would
// break the "zero network, no account, works offline" promise. A tiny stub
// satisfies the auth surface the (now dormant) auth code still references —
// auth.me rejects so callers fall through to their unauthenticated path, and
// logout/redirect are no-ops. Flip SYNC_ENABLED on (lib/store.js) to restore
// the real client once cross-device sync is built.
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

export const base44 = SYNC_ENABLED
  ? createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    })
  : createStubClient();
