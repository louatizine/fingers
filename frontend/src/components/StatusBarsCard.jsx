import { useTranslation } from 'react-i18next'
import { BRAND } from '../config/brand'

const FALLBACK_COLORS = [BRAND.violet, BRAND.green, BRAND.red]

/**
 * One stacked bar that shows the split at a glance, with a legend ledger underneath.
 * Shared by the admin and supervisor dashboards.
 */
export default function StatusBarsCard({ title, subtitle, data }) {
  const { t } = useTranslation()
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-medium text-slate-900">{title}</h2>
          <p className="kicker mt-1.5">{subtitle}</p>
        </div>
        <div className="text-end">
          <p className="font-display text-4xl font-light leading-none tabular-nums text-slate-900">{total}</p>
          <p className="kicker mt-1.5">{t('attendance.total')}</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div
        className="mt-6 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={data.map((d) => `${d.name}: ${d.value}`).join(', ')}
      >
        {total > 0 &&
          data.map((item, index) =>
            item.value > 0 ? (
              <span
                key={item.name}
                className="grow-x h-full first:rounded-s-full last:rounded-e-full"
                style={{
                  width: `${(item.value / total) * 100}%`,
                  backgroundColor: item.fill || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                  animationDelay: `${index * 120}ms`,
                }}
              />
            ) : null
          )}
      </div>

      {/* Ledger */}
      <ul className="mt-5 divide-y divide-slate-100">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
          const color = item.fill || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
          return (
            <li key={item.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="truncate text-slate-700">{item.name}</span>
              </span>
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-slate-400 tabular-nums">{percentage}%</span>
                <span className="w-8 text-end font-semibold tabular-nums text-slate-900">{item.value}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
