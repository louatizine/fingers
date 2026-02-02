import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI } from '../services/api'

import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { RequestsDonutChart, RequestsRadialChart } from '../components/RequestsOverviewChart'
import RecentRequestsList from '../components/RecentRequestsList'
import SystemHealthCard from '../components/SystemHealthCard'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStatistics()
      setStatistics(response.data.statistics)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message={t('common.loading_message')} />

  const leaveStatsData = [
    { name: t('status.pending'), value: statistics?.leave_stats?.pending || 0 },
    { name: t('status.approved'), value: statistics?.leave_stats?.approved || 0 },
    { name: t('status.rejected'), value: statistics?.leave_stats?.rejected || 0 }
  ]

  const salaryStatsData = [
    { name: t('status.pending'), value: statistics?.salary_advance_stats?.pending || 0, fill: '#4f46e5' },
    { name: t('status.approved'), value: statistics?.salary_advance_stats?.approved || 0, fill: '#10b981' },
    { name: t('status.rejected'), value: statistics?.salary_advance_stats?.rejected || 0, fill: '#f59e0b' }
  ]

  return (
    <div className="space-y-8 pb-12 px-4 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('dashboard.title_admin')}
          </h1>
          <p className="text-slate-500 font-medium mt-1">System-wide Overview & Analytics</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 text-sm font-bold flex items-center gap-2">
           <ClockIcon className="h-4 w-4" />
           {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title={t('dashboard.stats.total_employees')}
          value={statistics?.total_employees || 0}
          icon={UserGroupIcon}
          color="blue"
          subtitle={`${statistics?.active_employees || 0} active`}
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
        <StatCard
          title={t('dashboard.stats.active_projects')}
          value={statistics?.total_projects || 0}
          icon={BuildingOfficeIcon}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestsDonutChart
          title={t('dashboard.charts.leave_requests')}
          subtitle={t('dashboard.companyWideLeaveDistribution')}
          data={leaveStatsData}
        />
        <RequestsRadialChart
          title={t('dashboard.charts.salary_advances')}
          subtitle={t('dashboard.advanceRequestOverview')}
          data={salaryStatsData}
        />
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentRequestsList
          title={t('dashboard.recent.leave_requests')}
          items={statistics?.recent_leaves}
          type="leave"
        />
        <RecentRequestsList
          title={t('dashboard.recent.salary_advances')}
          items={statistics?.recent_salary_advances}
          type="advance"
        />
      </div>

      <SystemHealthCard />
    </div>
  )
}
