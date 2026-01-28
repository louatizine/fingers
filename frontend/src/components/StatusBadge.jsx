import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()

  const statusMap = {
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: CheckCircleIcon,
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: ExclamationTriangleIcon,
    },
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: ClockIcon,
    },
    // Default fallback
    default: {
      bg: 'bg-neutral-light',
      text: 'text-neutral-dark',
      icon: ClockIcon
    }
  }

  const cls = statusMap[status?.toLowerCase()] || statusMap.pending
  const Icon = cls.icon
  const displayText = t(`status.${status?.toLowerCase()}`, status)

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls.bg} ${cls.text} capitalize`}>
      <Icon className="h-3.5 w-3.5" />
      {displayText}
    </span>
  )
}
