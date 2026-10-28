import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import './i18n/index.js' // Initialize i18n
import { CubeLoader } from './components/ui/CubeBar'

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <CubeLoader size="h-4 w-4" />
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
