import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import '@/index.css'
import { initTheme } from '@/lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

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