import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRightIcon, ArrowLeftIcon } from './ui/icons'
import StatusBadge from './StatusBadge'
import { CUBE_COLORS } from './ui/CubeBar'
import { avatarFor } from '../config/brand'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function RecentRequestsList({ title, subtitle, items, type = 'leave' }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const target = type === 'leave' ? '/leaves' : '/salary-advances'
  const Arrow = isRTL ? ArrowLeftIcon : ArrowRightIcon

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-end justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-6">
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-medium text-slate-900">{title}</h3>
          {subtitle && <p className="kicker mt-1.5">{subtitle}</p>}
        </div>

        <button
          type="button"
          onClick={() => navigate(target)}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('common.viewAll')}
          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </button>
      </div>

      {!items || items.length === 0 ? (
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="flex gap-1" aria-hidden="true">
            {CUBE_COLORS.map((color) => (
              <span key={color} className="h-2 w-2 rounded-[2px] opacity-30" style={{ backgroundColor: color }} />
            ))}
          </span>
          <p className="kicker">{t('common.noData')}</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100">
          {items.slice(0, 5).map((item) => {
            const tone = avatarFor(item.user_name)
            return (
              <li key={item._id}>
                <button
                  type="button"
                  onClick={() => navigate(target)}
                  className="group flex w-full items-center gap-4 px-6 py-3.5 text-start transition-colors hover:bg-slate-50"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-semibold"
                    style={{ backgroundColor: tone.tint, color: tone.ink, boxShadow: `inset 0 0 0 1px ${tone.color}40` }}
                  >
                    {initials(item.user_name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{item.user_name}</span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-slate-500">
                      {type === 'leave'
                        ? `${t(`leaveTypes.${item.leave_type}`)} · ${item.days} ${t('time.days')}`
                        : `${item.amount} DT · ${new Date(item.created_at).toLocaleDateString(i18n.language)}`}
                    </span>
                  </span>

                  <StatusBadge status={item.status} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
