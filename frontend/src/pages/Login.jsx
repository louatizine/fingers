import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { CUBE_COLORS, CubeBar, CubeLoader } from '../components/ui/CubeBar'
import {
  UserIcon,
  KeyIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon
} from '../components/ui/icons'
import LiveClock from '../components/ui/LiveClock'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Kbd from '../components/ui/Kbd'

const GRID_COLS = 14
const GRID_ROWS = 7

/** A field of small squares. A few light up in the five Dynamix colours; the rest stay ghosted. */
function CubeField() {
  const cells = useMemo(
    () =>
      Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
        const v = (i * 7919 + 13) % 23
        if (v < 5) return { kind: 'solid', color: CUBE_COLORS[v], delay: (i % 9) * 260 }
        if (v < 10) return { kind: 'outline' }
        return { kind: 'ghost' }
      }),
    []
  )

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`aspect-square rounded-[3px] ${
            cell.kind === 'outline' ? 'border border-white/25' : cell.kind === 'ghost' ? 'bg-white/[0.05]' : 'animate-cube-pulse'
          }`}
          style={cell.kind === 'solid' ? { backgroundColor: cell.color, animationDelay: `${cell.delay}ms` } : undefined}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { login } = useAuth()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const Arrow = isRTL ? ArrowLeftIcon : ArrowRightIcon

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!userId || !password) {
      setError(t('login.validation.requiredFields'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setLoading(false)
      return
    }

    try {
      await login(userId, password)
    } catch (err) {
      setError(err.response?.data?.error || t('login.errors.invalidCredentials'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = `${t('login.welcomeBack')} · Dynamix`
    document.querySelector('input')?.focus()
  }, [t])

  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-primary-700 text-white lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-14">
        <img
          src="/cube.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -end-10 h-72 w-auto opacity-[0.08] animate-float"
        />

        <div className="relative flex items-center gap-3">
          <img src="/cube.png" alt="" className="h-12 w-auto" />
          <div className="leading-none">
            <p className="font-display text-3xl font-medium tracking-tight">Dynamix</p>
            <p className="mt-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-brand-yellow">services</p>
          </div>
        </div>

        <div className="relative">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary-200 rtl:font-sans rtl:tracking-normal">
            {t('login.heroEyebrow', 'Plateforme RH')}
          </p>
          <h1 className="mt-5 max-w-xl font-display text-5xl font-light leading-[1.05] xl:text-6xl">
            {t('login.heroLine1', 'Chaque équipe,')}
            <br />
            <em className="font-light italic text-brand-yellow">{t('login.heroLine2', 'chaque jour, en clair.')}</em>
          </h1>

          <div className="mt-14 max-w-xl">
            <CubeField />
          </div>
        </div>

        <div className="relative flex items-end justify-between gap-6">
          <LiveClock variant="studio" />
          <div className="flex flex-col items-end gap-3">
            <CubeBar width="w-6" />
            <span className="font-mono text-xs text-primary-200">{t('login.footer')}</span>
          </div>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute end-6 top-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/cube.png" alt="" className="h-10 w-auto" />
            <div className="leading-none">
              <p className="font-display text-2xl font-medium tracking-tight text-primary">Dynamix</p>
              <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-brand-red">services</p>
            </div>
          </div>

          <p className="kicker flex items-center gap-2">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-primary" />
            {t('login.securePortal')}
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-slate-900">
            {t('login.welcomeBack')}
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">{t('login.pleaseSignIn')}</p>

          <form
            onSubmit={handleSubmit}
            className={`mt-9 space-y-5 ${shake ? 'animate-shake' : ''}`}
            noValidate
          >
            {error && (
              <div
                role="alert"
                className="border-s-4 border-brand-red bg-[#FCEBEE] px-4 py-3 text-sm font-medium text-[#A8031D]"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-user" className="mb-1.5 block text-sm font-semibold text-slate-800">
                {t('login.userId')}
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  id="login-user"
                  type="text"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="field !py-3 !ps-11"
                  placeholder={t('login.userIdPlaceholder')}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-semibold text-slate-800">
                  {t('login.passwordLabel')}
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setUserId('admin@hrmanagement.com')
                    setPassword('admin123')
                  }}
                >
                  {t('login.demoLogin')}
                </button>
              </div>
              <div className="relative">
                <KeyIcon className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !py-3 !pe-11 !ps-11"
                  placeholder={t('login.passwordPlaceholder')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary group w-full !py-3.5 text-[15px]">
              {loading ? (
                <>
                  <CubeLoader size="h-2.5 w-2.5" />
                  {t('login.authenticating')}
                </>
              ) : (
                <>
                  {t('login.signIn')}
                  <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Kbd>↵</Kbd>
              {t('login.enterHint')}
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
