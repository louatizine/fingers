import { useLocation } from 'react-router-dom'
import { CubeBar } from './CubeBar'
import { sectionFor } from '../../config/brand'

/**
 * Editorial page header: mono kicker, serif title, hairline rule with the cube signature.
 *
 * Direction is inherited from <html dir>, so no manual RTL reversing is needed.
 */
export default function PageHeader({ kicker, title, subtitle, actions, meta, icon: Icon }) {
  const { pathname } = useLocation()
  const section = sectionFor(pathname)

  return (
    <header className="animate-fadeIn">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {kicker && (
            <p className="kicker mb-3 flex items-center gap-2">
              {Icon ? (
                <Icon className="h-3.5 w-3.5" style={{ color: section.ink }} aria-hidden="true" />
              ) : (
                <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: section.color }} aria-hidden="true" />
              )}
              <span style={{ color: section.ink }}>{kicker}</span>
            </p>
          )}
          <h1 className="font-display text-4xl font-medium leading-[1.05] text-slate-900 md:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">{subtitle}</p>}
          {meta && <div className="mt-3 text-sm text-slate-500">{meta}</div>}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <CubeBar className="grow-x" active={section.color} />
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </header>
  )
}
