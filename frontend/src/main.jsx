import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import './i18n' // Initialize i18n

// Set initial document direction and language
const initLanguage = localStorage.getItem('i18nextLng') || 'fr'
const isRTL = initLanguage === 'ar'
document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
document.documentElement.lang = initLanguage

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
