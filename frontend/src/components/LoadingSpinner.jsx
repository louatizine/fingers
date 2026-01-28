import { useTranslation } from 'react-i18next'

export default function LoadingSpinner({ message }) {
  const { t } = useTranslation()
  const displayMessage = message || t('common.loading')

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-medium border-t-primary"></div>
      <p className="text-sm text-neutral-dark font-medium">{displayMessage}</p>
    </div>
  )
}
