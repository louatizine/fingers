import { useEffect, useRef, useState } from 'react'

/**
 * Eases a number from 0 to `target`. Non-numeric targets are returned untouched.
 * Respects prefers-reduced-motion.
 */
export default function useCountUp(target, duration = 900) {
  const isNumber = typeof target === 'number' && Number.isFinite(target)
  const [value, setValue] = useState(isNumber ? 0 : target)
  const frame = useRef(null)

  useEffect(() => {
    if (!isNumber) {
      setValue(target)
      return undefined
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Decimals (e.g. 2.5 days) would be rounded mid-animation, so show them as-is.
    if (reduce || target === 0 || !Number.isInteger(target)) {
      setValue(target)
      return undefined
    }

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration, isNumber])

  return value
}
