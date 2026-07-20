import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import './i18n/index.js' // Initialize i18n

function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0078d4]" />
    </div>
  )
}

// Set initial document direction and language
const initLanguage = localStorage.getItem('i18nextLng') || 'fr'
const isRTL = initLanguage === 'ar'
document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
document.documentElement.lang = initLanguage

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoading />}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Suspense>
  </React.StrictMode>,
)
