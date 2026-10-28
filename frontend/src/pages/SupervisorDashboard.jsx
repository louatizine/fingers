import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'

import {
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ArrowUpRightIcon
} from '../components/ui/icons'

import { BRAND } from '../config/brand'
import StatCard from '../components/StatCard'
import StatusBarsCard from '../components/StatusBarsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import RecentRequestsList from '../components/RecentRequestsList'
import DashboardHero from '../components/DashboardHero'

export default function SupervisorDashboard() {
  const { t } = useTranslation()

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
    { name: t('status.pending'), value: statistics?.leave_stats?.pending || 0, fill: BRAND.yellow },
    { name: t('status.approved'), value: statistics?.leave_stats?.approved || 0, fill: BRAND.green },
    { name: t('status.rejected'), value: statistics?.leave_stats?.rejected || 0, fill: BRAND.red }
  ]

  const salaryStatsData = [
    { name: t('status.pending'), value: statistics?.salary_advance_stats?.pending || 0, fill: BRAND.yellow },
    { name: t('status.approved'), value: statistics?.salary_advance_stats?.approved || 0, fill: BRAND.green },
    { name: t('status.rejected'), value: statistics?.salary_advance_stats?.rejected || 0, fill: BRAND.red }
  ]

  return (
    <div className="space-y-8 pb-8">
      <DashboardHero
        pendingLeaves={statistics?.pending_leaves || 0}
        pendingAdvances={statistics?.pending_salary_advances || 0}
        fallbackSubtitle={t('dashboard:subtitle_supervisor')}
      />

      {/* Key figures */}
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div style={{ '--i': 0 }}>
          <StatCard
            title={t('dashboard:stats.total_employees')}
            value={statistics?.total_employees || 0}
            icon={UserGroupIcon}
            color="blue"
          />
        </div>
        <div style={{ '--i': 1 }}>
          <StatCard
            title={t('dashboard:stats.pending_leaves')}
            value={statistics?.pending_leaves || 0}
            icon={ClockIcon}
            color="yellow"
          />
        </div>
        <div style={{ '--i': 2 }}>
          <StatCard
            title={t('dashboard:stats.pending_advances')}
            value={statistics?.pending_salary_advances || 0}
            icon={CurrencyDollarIcon}
            color="green"
          />
        </div>
        <div style={{ '--i': 3 }}>
          <StatCard
            title={t('dashboard:stats.active_projects')}
            value={statistics?.total_projects || 0}
            icon={BriefcaseIcon}
            color="purple"
          />
        </div>
      </div>

      {/* Attendance call-out */}
      <Link
        to="/attendance"
        className="group relative block overflow-hidden rounded-xl bg-primary p-6 text-white transition-colors hover:bg-primary-600 md:p-8"
      >
        <img
          src="/cube.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 end-6 h-48 w-auto opacity-[0.12] transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-primary-200 rtl:font-sans rtl:tracking-normal">
              {t('dashboard:attendance_shortcut', 'Attendance')}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight md:text-4xl">
              {t('dashboard:check_attendance', 'Check attendance records')}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-primary-100">
              {t('dashboard:attendance_shortcut_desc')}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-3 self-start rounded-lg bg-brand-yellow py-2.5 pe-3 ps-4 text-sm font-semibold text-slate-900 transition-transform group-hover:-translate-y-0.5 md:self-end">
            {t('dashboard:open_attendance')}
            <ArrowUpRightIcon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
      </Link>

      {/* Distributions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusBarsCard
          title={t('dashboard:charts.leave_requests')}
          subtitle={t('dashboard:companyLeaveStatus')}
          data={leaveStatsData}
        />
        <StatusBarsCard
          title={t('dashboard:charts.salary_advances')}
          subtitle={t('dashboard:salaryAdvanceRequests')}
          data={salaryStatsData}
        />
      </div>

      {/* Latest activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
