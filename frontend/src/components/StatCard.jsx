import React from 'react'
import { BRAND } from '../config/brand'
import useCountUp from '../hooks/useCountUp'

// Each tile gets one accent from the Dynamix cube; it only shows up as a rule, a dot and on hover.
const ACCENTS = {
  blue: BRAND.blue,
  green: BRAND.green,
  yellow: BRAND.yellow,
  purple: BRAND.violet,
  red: BRAND.red,
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const accent = ACCENTS[color] || BRAND.violet
  const display = useCountUp(value)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <p className="kicker leading-snug">{title}</p>
        {Icon && (
          <Icon
            className="h-5 w-5 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-[var(--accent)]"
            style={{ '--accent': accent }}
            strokeWidth={1.5}
          />
        )}
      </div>

      <p className="mt-6 font-display text-5xl font-light leading-none tracking-tight text-slate-900 tabular-nums">
        {display}
      </p>

      {subtitle && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
          {subtitle}
        </p>
      )}
    </div>
  )
}
