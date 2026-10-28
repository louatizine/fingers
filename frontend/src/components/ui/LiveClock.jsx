import { useTranslation } from 'react-i18next'
import useNow from '../../hooks/useNow'
import { getAttendanceLocale } from '../../utils/attendanceI18n'

/**
 * variant:
 *  - kicker  → "mercredi 28 octobre 2026 · 14:32"  (page headers)
 *  - compact → "28 oct · 14:32"                    (navbar)
 *  - studio  → huge tabular time + long date       (login brand panel)
 */
export default function LiveClock({ variant = 'kicker', className = '' }) {
  const { i18n } = useTranslation()
  const locale = getAttendanceLocale(i18n.language)
  const now = useNow(variant === 'studio' ? 1000 : 30000)

  if (variant === 'studio') {
    const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const date = now.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return (
      <div className={className}>
        <p className="font-display text-5xl font-light leading-none tracking-tight tabular-nums xl:text-6xl">
          {time}
        </p>
        <p className="mt-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary-200 rtl:font-sans rtl:tracking-normal">
          {date}
        </p>
      </div>
    )
  }

  if (variant === 'compact') {
    const date = now.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
    const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    return (
      <span className={`kicker ${className}`}>
        {date}
        <span className="mx-1.5 text-slate-300" aria-hidden="true">
          ·
        </span>
        <span className="tabular-nums">{time}</span>
      </span>
    )
  }

  const date = now.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return (
    <span className={className}>
      {date}
      <span className="mx-1.5 opacity-40" aria-hidden="true">
        ·
      </span>
      <span className="tabular-nums">{time}</span>
    </span>
  )
}
