import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  UserIcon,
  KeyIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Form validation
    if (!userId || !password) {
      setError(t('login.validation.requiredFields'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setLoading(false)
      return
    }
    
    try {
      // Remove vendor parameter
      await login(userId, password)
    } catch (err) {
      setError(err.response?.data?.error || t('login.errors.invalidCredentials'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  // Auto-focus first input
  useEffect(() => {
    document.querySelector('input')?.focus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Premium Header */}
        <div className="text-center mb-10 transform transition-all duration-700 hover:scale-105">
          <div className="inline-flex flex-col items-center">
            {/* Logo Container with Glow Effect */}
            <div className="relative mb-4">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 blur-xl rounded-full animate-pulse" />
              <h1 className="relative text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                HR DYNAMIX
              </h1>
            </div>
            {/* Add line under logo */}
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-2" />
            {/* Tagline */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm mt-4">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-600">
                Workforce Management Platform
              </p>
            </div>
          </div>
        </div>

        {/* Glass Card */}
        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/50 overflow-hidden transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          
          {/* Card Header with Gradient */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-ping" />
            
            <div className="relative px-8 py-7">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {t('login.welcomeBack')}
                </h2>
                <p className="text-blue-100/90 font-medium">
                  {t('login.pleaseSignIn')}
                </p>
              </div>
              
              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <ShieldCheckIcon className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">{t('login.securePortal')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form with Enhanced Fields */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message - Premium Style */}
              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50/80 to-rose-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* User ID Field with Floating Label */}
              <div className="relative">
                <label className="absolute -top-2 left-3 px-2 bg-white text-xs font-semibold text-slate-700 z-10">
                  {t('login.userId')}
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder={t('login.userIdPlaceholder')}
                    required
                    disabled={loading}
                  />
                  {userId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field with Toggle */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 px-1">
                    {t('login.passwordLabel')}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => {
                      setUserId('admin@hrdynamix.com')
                      setPassword('admin123')
                    }}
                  >
                    {t('login.demoLogin')}
                  </button>
                </div>
                <div className="relative group">
                  <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button with Glow Effect */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {loading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-semibold">{t('login.authenticating')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="font-semibold">{t('login.signIn')}</span>
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}