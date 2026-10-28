import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import PageHeader from './ui/PageHeader'
import LiveClock from './ui/LiveClock'
import { greetingPeriod } from '../utils/greeting'

/** Time-aware greeting used on admin and supervisor dashboards. */
export default function DashboardHero({ pendingLeaves = 0, pendingAdvances = 0, fallbackSubtitle }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const period = greetingPeriod()
  const name = user?.first_name || ''

  let subtitle = fallbackSubtitle
  if (pendingLeaves > 0 && pendingAdvances > 0) {
    subtitle = t('dashboard:inbox.both', { leaves: pendingLeaves, advances: pendingAdvances })
  } else if (pendingLeaves > 0) {
    subtitle = t('dashboard:inbox.leaves', { count: pendingLeaves })
  } else if (pendingAdvances > 0) {
    subtitle = t('dashboard:inbox.advances', { count: pendingAdvances })
  } else if (!subtitle) {
    subtitle = t('dashboard:inbox.clear')
  }

  return (
    <PageHeader
      kicker={<LiveClock />}
      title={
        <>
          {t(`dashboard:greeting.${period}`)}
          {name ? (
            <>
              , <em className="font-normal italic text-primary">{name}</em>
            </>
          ) : null}
        </>
      }
      subtitle={subtitle}
    />
  )
}
