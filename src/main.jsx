import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import '@/index.css'
import { preloadPlayerEmojis } from '@/lib/preloadEmojis'

// Force dark theme app-wide
document.documentElement.classList.add('dark')
document.documentElement.style.colorScheme = 'dark'

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

// Native shell only (no-op on web): set a light-content status bar for the dark
// UI, and hide the launch splash once React has painted. The plugins are
// dynamically imported so none of their code touches the web/dev path.
if (Capacitor.isNativePlatform()) {
  requestAnimationFrame(() => {
    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Dark }))
      .catch(() => {})
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => {})
  })
}