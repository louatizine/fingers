import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, settingsAPI } from '../services/api'

import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import LeaveBalanceChart from '../components/LeaveBalanceChart'
import RecentActivityCard from '../components/RecentActivityCard'
import LeaveTrendsChart from '../components/LeaveTrendsChart'
import UpcomingTimeOffCard from '../components/UpcomingTimeOffCard'
import RequestsOverviewChart from '../components/RequestsOverviewChart'
import RecentRequestsList from '../components/RecentRequestsList'
import SystemHealthCard from '../components/SystemHealthCard'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vacationBalance, setVacationBalance] = useState(0)

  useEffect(() => {
    loadDashboardData()

    if (user?.role === 'employee' && user?._id) {
      loadVacationBalance()
    }
  }, [])

  const loadVacationBalance = async () => {
    try {
      const response = await settingsAPI.calculateEmployeeBalance(user._id)
      setVacationBalance(response.data.balance || 0)
    } catch (error) {
      console.error('Failed to load vacation balance:', error)
      setVacationBalance(user?.vacation_balance || 0)
    }
  }

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStatistics()
      setStatistics(response.data.statistics)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)

      // Fallback data (safe for dev)
      setStatistics({
        leave_balance: {
          annual: 15,
          sick: 5,
          unpaid: 0,
          maternity: 90
        },
        leave_stats: {
          pending: 2,
          approved: 8,
          rejected: 1
        },
        recent_leaves: [
          { _id: '1', leave_type: 'Annual', start_date: '2024-03-01', end_date: '2024-03-05', days: 5, status: 'approved' },
          { _id: '2', leave_type: 'Sick', start_date: '2024-03-10', end_date: '2024-03-10', days: 1, status: 'pending' }
        ],
        total_employees: 45,
        pending_leaves: 5,
        pending_salary_advances: 3,
        total_projects: 12,
        salary_advance_stats: { pending: 3, approved: 12, rejected: 1 },
        recent_salary_advances: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message={t('common.loading_message')} />
  }

  /* ===========================
      EMPLOYEE DASHBOARD
     =========================== */
  if (user?.role === 'employee') {
    return (
      <div className="space-y-8 pb-12">

        {/* Header */}
        <div className="bg-white shadow-sm border border-neutral-medium rounded-sm p-6">
          <h1 className="text-2xl font-semibold text-neutral-charcoal">
            {t('dashboard.title_employee')}
          </h1>
          <p className="text-sm text-neutral-dark mt-1">
            {t('dashboard.welcome', { name: user?.first_name || 'Utilisateur' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.stats.annual_leave')}
            value={vacationBalance.toFixed(2)}
            subtitle={t('dashboard.stats.days_remaining')}
            icon={CalendarIcon}
            color="blue"
          />

          <StatCard
            title={t('dashboard.stats.sick_leave')}
            value={statistics?.leave_balance?.sick || 0}
            subtitle={t('dashboard.stats.days_available')}
            icon={CalendarIcon}
            color="green"
          />

          <StatCard
            title={t('dashboard.stats.pending_requests')}
            value={statistics?.leave_stats?.pending || 0}
            subtitle={t('dashboard.stats.awaiting_approval')}
            icon={ClockIcon}
            color="yellow"
          />

          <StatCard
            title={t('dashboard.stats.approved_leaves')}
            value={statistics?.leave_stats?.approved || 0}
            subtitle={t('dashboard.stats.this_year')}
            icon={CheckCircleIcon}
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <LeaveBalanceChart
            leaveBalance={{
              ...statistics?.leave_balance,
              annual: vacationBalance
            }}
          />
          <RecentActivityCard recentLeaves={statistics?.recent_leaves} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LeaveTrendsChart />
          <UpcomingTimeOffCard />
        </div>
      </div>
    )
  }

  /* ===========================
      ADMIN / SUPERVISOR
     =========================== */

  const leaveStatsData = [
    { name: t('status.pending'), value: statistics?.leave_stats?.pending || 0, fill: '#FFAA44' },
    { name: t('status.approved'), value: statistics?.leave_stats?.approved || 0, fill: '#0078D4' },
    { name: t('status.rejected'), value: statistics?.leave_stats?.rejected || 0, fill: '#D13438' }
  ]

  const salaryStatsData = [
    { name: t('status.pending'), value: statistics?.salary_advance_stats?.pending || 0, fill: '#FFAA44' },
    { name: t('status.approved'), value: statistics?.salary_advance_stats?.approved || 0, fill: '#0078D4' },
    { name: t('status.rejected'), value: statistics?.salary_advance_stats?.rejected || 0, fill: '#D13438' }
  ]

  return (
    <div className="space-y-8 pb-12">

      <div className="bg-white shadow-sm border border-neutral-medium rounded-sm p-6">
        <h1 className="text-2xl font-semibold text-neutral-charcoal">
          {user?.role === 'admin'
            ? t('dashboard.title_admin')
            : t('dashboard.title_supervisor')}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title={t('dashboard.stats.total_employees')}
          value={statistics?.total_employees || 0}
          icon={UserGroupIcon}
          color="blue"
        />

        <StatCard
          title={t('dashboard.stats.pending_leaves')}
          value={statistics?.pending_leaves || 0}
          icon={ClockIcon}
          color="yellow"
        />

        <StatCard
          title={t('dashboard.stats.pending_advances')}
          value={statistics?.pending_salary_advances || 0}
          icon={CurrencyDollarIcon}
          color="yellow"
        />

        {user?.role === 'admin' && (
          <StatCard
            title={t('dashboard.stats.active_projects')}
            value={statistics?.total_projects || 0}
            icon={BuildingOfficeIcon}
            color="purple"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestsOverviewChart
          title={t('dashboard.charts.leave_requests')}
          data={leaveStatsData}
        />
        <RequestsOverviewChart
          title={t('dashboard.charts.salary_advances')}
          data={salaryStatsData}
          selectOptions={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentRequestsList
          title={t('dashboard.recent.leave_requests')}
          items={statistics?.recent_leaves}
          type="leave"
        />
        <RecentRequestsList
          title={t('dashboard.recent.salary_advances')}
          items={statistics?.recent_salary_advances}
          type="salary"
        />
      </div>

      <SystemHealthCard />
    </div>
  )
}
