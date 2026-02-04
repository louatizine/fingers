import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import AdminDashboard from './AdminDashboard'
import SupervisorDashboard from './SupervisorDashboard'
import EmployeeDashboard from './EmployeeDashboard'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Dashboard Router Component
 * Routes users to role-specific dashboards based on their role
 */
export default function Dashboard() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return <LoadingSpinner message={t('common.loading_message')} />
  }

  // Route to role-specific dashboard
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'supervisor':
      return <SupervisorDashboard />
    case 'employee':
      return <EmployeeDashboard />
    default:
      return <EmployeeDashboard />
  }
}