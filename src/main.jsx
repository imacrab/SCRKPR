import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import '@/index.css'

// Force dark theme app-wide
document.documentElement.classList.add('dark')
document.documentElement.style.colorScheme = 'dark'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

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