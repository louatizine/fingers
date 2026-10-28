import { BRAND } from '../../config/brand'

const SEGMENTS = [BRAND.violet, BRAND.blue, BRAND.green, BRAND.yellow, BRAND.red]

/**
 * The five colours of the Dynamix cube, used as a recurring signature:
 * as a short rule under page titles, as a divider, as a loader.
 */
export function CubeBar({
  width = 'w-5',
  height = 'h-[3px]',
  gap = 'gap-[3px]',
  className = '',
  active,
  activeWidth = 'w-12',
}) {
  return (
    <span className={`inline-flex ${gap} ${className}`} aria-hidden="true">
      {SEGMENTS.map((color) => {
        const isActive = active && color === active
        return (
          <span
            key={color}
            className={`${isActive ? activeWidth : width} ${height} rounded-full transition-all duration-300`}
            style={{ backgroundColor: color, opacity: active && !isActive ? 0.45 : 1 }}
          />
        )
      })}
    </span>
  )
}

/** Five squares hopping in sequence. Replaces the generic spinning ring. */
export function CubeLoader({ size = 'h-3 w-3', className = '' }) {
  return (
    <span className={`inline-flex items-end gap-1.5 ${className}`} role="status" aria-label="Loading">
      {SEGMENTS.map((color, i) => (
        <span
          key={color}
          className={`${size} animate-cube-hop rounded-[3px]`}
          style={{ backgroundColor: color, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  )
}

export const CUBE_COLORS = SEGMENTS
