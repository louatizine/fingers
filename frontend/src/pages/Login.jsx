import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || t('login.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F2F1] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Section with Fluent Design */}
          <div className="bg-[#0078D4] px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-12 h-12 text-[#0078D4]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('login.title')}
            </h1>
            <p className="text-[#E5F1FB] text-sm">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Form Section with Fluent Design principles */}
          <div className="px-8 py-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-[#323130] mb-2">{t('login.welcomeBack')}</h2>
              <p className="text-[#605E5C] text-sm">{t('login.signInMessage')}</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error state with #D13438 */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-[#D13438] p-4 flex items-start" role="alert">
                  <svg className="w-5 h-5 text-[#D13438] mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-[#D13438] font-medium">{error}</p>
                </div>
              )}
              
              {/* Email input with Fluent Design - border #E1DFDD, focus #0078D4 */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#323130] mb-2">
                  {t('login.emailLabel')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-[#E1DFDD] rounded-lg placeholder-[#605E5C] text-[#323130] focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4] transition-all duration-200 sm:text-sm"
                  placeholder={t('login.emailPlaceholder')}
                  aria-label="Email address"
                />
              </div>
              
              {/* Password input with same styling */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#323130] mb-2">
                  {t('login.passwordLabel')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-[#E1DFDD] rounded-lg placeholder-[#605E5C] text-[#323130] focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4] transition-all duration-200 sm:text-sm"
                  placeholder={t('login.passwordPlaceholder')}
                  aria-label="Password"
                />
              </div>

              {/* Submit button - Primary #0078D4, Hover #005A9E */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#0078D4] hover:bg-[#005A9E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078D4] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('login.signingIn')}
                    </span>
                  ) : (
                    t('login.signInButton')
                  )}
                </button>
              </div>

              {/* Demo credentials info with Info color #106EBE */}
              <div className="border-t border-[#E1DFDD] pt-6 mt-6">
                <div className="bg-[#E5F1FB] border border-[#0078D4] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#0078D4] mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {t('login.demoCredentials')}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-[#323130]"><span className="font-semibold">{t('login.emailLabel')}:</span> admin@hrmanagement.com</p>
                    <p className="text-xs text-[#323130]"><span className="font-semibold">{t('login.passwordLabel')}:</span> admin123</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer with proper contrast */}
        <p className="text-center text-sm text-[#605E5C] mt-8">
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}
