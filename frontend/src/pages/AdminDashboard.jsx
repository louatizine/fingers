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
  BuildingOfficeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

import { getAttendanceLocale } from '../utils/attendanceI18n'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import RecentRequestsList from '../components/RecentRequestsList'
import SystemHealthCard from '../components/SystemHealthCard'
import dynLogo from '../assets/dynlogo.jpg'

const STATUS_COLORS = ['#3B2176', '#22B135', '#D10424']

function StatusBarsCard({ title, subtitle, data }) {
  const { i18n, t } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const maxValue = Math.max(...data.map(item => item.value), 1)

  return (
    <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-lg shadow-slate-200/35 backdrop-blur-xl md:p-6">
      <div className={`mb-5 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
          </div>
          <div className="rounded-xl bg-primary-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">{t('attendance.total')}</p>
            <p className="text-xl font-black leading-none text-primary">{total}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
          const width = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0)}%`
          const color = item.fill || STATUS_COLORS[index % STATUS_COLORS.length]

          return (
            <div key={item.name} className="space-y-1.5">
              <div className={`flex items-center justify-between gap-3 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex min-w-0 items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate font-bold text-slate-700">{item.name}</span>
                </div>
                <div className={`flex shrink-0 items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-black text-slate-900">{item.value}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{percentage}%</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700" style={{ width, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
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
    { name: t('status.pending'), value: statistics?.leave_stats?.pending || 0, fill: '#F1CA15' },
    { name: t('status.approved'), value: statistics?.leave_stats?.approved || 0, fill: '#22B135' },
    { name: t('status.rejected'), value: statistics?.leave_stats?.rejected || 0, fill: '#D10424' }
  ]

  const salaryStatsData = [
    { name: t('status.pending'), value: statistics?.salary_advance_stats?.pending || 0, fill: '#3B2176' },
    { name: t('status.approved'), value: statistics?.salary_advance_stats?.approved || 0, fill: '#22B135' },
    { name: t('status.rejected'), value: statistics?.salary_advance_stats?.rejected || 0, fill: '#D10424' }
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(74,106,173,0.12),_transparent_32%),linear-gradient(135deg,_#f8f7fc_0%,_#f4f6fb_52%,_#f9fafb_100%)] px-3 py-4 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1600px] space-y-5 pb-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary-900 via-primary-700 to-brand-blue px-5 py-5 text-white shadow-xl shadow-primary-900/15 md:px-7 md:py-6">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute right-16 -bottom-28 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
{/*             <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg shadow-black/15">
              <img src={dynLogo} alt="Dynamix Services" className="h-full w-full object-contain" />
            </div> */}
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-primary-100">
                {t('dashboard:subtitle_admin')}
              </span>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                {t('dashboard:title_admin')}
              </h1>
              <p className="mt-1 text-sm text-white/70">{t('dashboard:subtitle_admin')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
            <ClockIcon className="h-4 w-4" />
            <span>{new Date().toLocaleDateString(getAttendanceLocale(i18n.language), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard:stats.total_employees')}
          value={statistics?.total_employees || 0}
          icon={UserGroupIcon}
          color="blue"
          subtitle={`${statistics?.active_employees || 0} ${t('dashboard:active')}`}
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
          icon={BuildingOfficeIcon}
          color="purple"
        />
      </div>

      <Link
        to="/attendance"
        className="group block rounded-2xl border border-primary-100 bg-gradient-to-r from-primary to-brand-blue p-5 text-white shadow-lg shadow-primary-200/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-200/45"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <ClockIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
                {t('dashboard:attendance_shortcut', 'Attendance')}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusBarsCard
          title={t('dashboard:charts.leave_requests')}
          subtitle={t('dashboard:companyWideLeaveDistribution')}
          data={leaveStatsData}
        />
        <StatusBarsCard
          title={t('dashboard:charts.salary_advances')}
          subtitle={t('dashboard:advanceRequestOverview')}
          data={salaryStatsData}
        />
      </div>

      {/* Activity Lists */}
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

      <SystemHealthCard />
      </div>
    </div>
  )
}
