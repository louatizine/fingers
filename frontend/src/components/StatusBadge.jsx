import { useTranslation } from 'react-i18next'

const STATUS_STYLES = {
  approved: { dot: 'bg-brand-green', text: 'text-[#17802a]', bg: 'bg-[#EAF7EC]', ring: 'ring-[#BFE5C5]' },
  rejected: { dot: 'bg-brand-red', text: 'text-[#A8031D]', bg: 'bg-[#FCEBEE]', ring: 'ring-[#F3C4CB]' },
  pending: { dot: 'bg-brand-yellow', text: 'text-[#7A5C00]', bg: 'bg-[#FDF6D6]', ring: 'ring-[#F1DE8A]' },
}

export default function StatusBadge({ status }) {
  const { t } = useTranslation()

  const key = status?.toLowerCase()
  const style = STATUS_STYLES[key] || STATUS_STYLES.pending
  const displayText = t(`status.${key}`, status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${style.bg} ${style.text} ${style.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${key === 'pending' ? 'pending-dot' : ''}`} aria-hidden="true" />
      <span className="capitalize">{displayText}</span>
    </span>
  )
}
