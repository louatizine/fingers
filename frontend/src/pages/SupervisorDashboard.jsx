import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'

import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { RequestsDonutChart, RequestsRadialChart } from '../components/RequestsOverviewChart'
import RecentRequestsList from '../components/RecentRequestsList'

export default function SupervisorDashboard() {
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
            {t('dashboard:title_supervisor')}
          </h1>
          <p className="text-slate-500 font-medium mt-1">{t('dashboard:subtitle_supervisor')}</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 text-sm font-bold flex items-center gap-2">
           <ClockIcon className="h-4 w-4" />
           {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title={t('dashboard:stats.total_employees')}
          value={statistics?.total_employees || 0}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title={t('dashboard:stats.pending_leaves')}
          value={statistics?.pending_leaves || 0}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title={t('dashboard:stats.pending_advances')}
          value={statistics?.pending_salary_advances || 0}
          icon={CurrencyDollarIcon}
          color="yellow"
        />
        <StatCard
          title={t('dashboard:stats.active_projects')}
          value={statistics?.total_projects || 0}
          icon={BriefcaseIcon}
          color="purple"
        />
      </div>

      <Link
        to="/attendance"
        className="group block rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-200/40 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-200/50"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <ClockIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
                {t('dashboard:attendance_shortcut', 'Attendance')}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {t('dashboard:check_attendance', 'Check attendance records')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {t('dashboard:attendance_shortcut_desc')}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur-sm transition-all group-hover:bg-white/20">
            {t('dashboard:open_attendance')}
            <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestsDonutChart
          title={t('dashboard:charts.leave_requests')}
          subtitle={t('dashboard:companyLeaveStatus')}
          data={leaveStatsData}
        />
        <RequestsRadialChart
          title={t('dashboard:charts.salary_advances')}
          subtitle={t('dashboard:salaryAdvanceRequests')}
          data={salaryStatsData}
        />
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentRequestsList
          title={t('dashboard:recent.leave_requests')}
          items={statistics?.recent_leaves}
          type="leave"
        />
        <RecentRequestsList
          title={t('dashboard:recent.salary_advances')}
          items={statistics?.recent_salary_advances}
          type="advance"
        />
      </div>
    </div>
  )
}
