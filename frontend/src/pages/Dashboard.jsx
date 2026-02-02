import { useAuth } from '../context/AuthContext'
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

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
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