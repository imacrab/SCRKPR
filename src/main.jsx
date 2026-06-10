import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Force dark theme app-wide
document.documentElement.classList.add('dark')
document.documentElement.style.colorScheme = 'dark'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)