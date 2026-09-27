import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import '@/index.css'
import { preloadPlayerEmojis } from '@/lib/preloadEmojis'
import { initTheme } from '@/lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Warm the emoji image cache off the critical path. Uses requestIdleCallback
// so we never fight React's initial paint; falls back to a short timeout on
// browsers without it (Safari).
const kickoffPreload = () => preloadPlayerEmojis();
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(kickoffPreload, { timeout: 2000 });
  } else {
    setTimeout(kickoffPreload, 500);
  }
}

// Native shell only (no-op on web): hide the launch splash once React has
// painted (initTheme sets the status bar style). The plugin is dynamically
// imported so none of its code touches the web/dev path.
if (Capacitor.isNativePlatform()) {
  requestAnimationFrame(() => {
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => {})
  })
}