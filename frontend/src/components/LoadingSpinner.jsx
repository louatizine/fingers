import { useTranslation } from 'react-i18next'
import { CubeLoader } from './ui/CubeBar'

/**
 * Brand page/section loader — hopping Dynamix cube colours.
 * Use `compact` for inline panels; full size for whole-page waits.
 */
export default function LoadingSpinner({ message, compact = false, className = '' }) {
  const { t } = useTranslation()
  const displayMessage = message === null || message === false
    ? null
    : message || t('common.loading')

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        compact ? 'py-12' : 'min-h-[400px] gap-5'
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CubeLoader size={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {displayMessage && <p className="kicker">{displayMessage}</p>}
    </div>
  )
}
