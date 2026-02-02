import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, settingsAPI } from '../services/api'

import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'

import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import RecentRequestsList from '../components/RecentRequestsList'

export default function EmployeeDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vacationBalance, setVacationBalance] = useState(0)

  useEffect(() => {
    loadDashboardData()
    if (user?._id) {
      loadVacationBalance()
    }
  }, [])

  const loadVacationBalance = async () => {
    try {
      const response = await settingsAPI.calculateEmployeeBalance(user._id)
      setVacationBalance(response.data.balance || 0)
    } catch (error) {
      setVacationBalance(user?.vacation_balance || 0)
    }
  }

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

  const leaves = statistics?.leaves || {}
  const salaryAdvances = statistics?.salary_advances || {}

  return (
    <div className="space-y-8 pb-12 px-4 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('common.welcome')}, {statistics?.employee_name || user?.first_name}!
          </h1>
          <p className="text-slate-600 font-medium mt-1">
            {statistics?.position} • {statistics?.department}
          </p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 text-sm font-bold flex items-center gap-2">
           <ClockIcon className="h-4 w-4" />
           {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Vacation Balance Card */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-[2rem] shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 font-semibold text-sm uppercase tracking-wide">
              {t('dashboard.vacation_balance')}
            </p>
            <h2 className="text-5xl font-black mt-2">{vacationBalance || statistics?.vacation_balance || 0}</h2>
            <p className="text-blue-100 mt-1">{t('dashboard.days_available')}</p>
          </div>
          <CalendarIcon className="h-20 w-20 text-blue-200 opacity-50" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-100">{t('dashboard.vacation_earned')}</p>
            <p className="text-2xl font-bold">{statistics?.vacation_earned || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-100">{t('dashboard.vacation_used')}</p>
            <p className="text-2xl font-bold">{statistics?.vacation_used || 0}</p>
          </div>
        </div>
      </div>

      {/* My Requests Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('dashboard.my_leave_requests')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.total_requests')}
            value={leaves.total || 0}
            icon={CalendarIcon}
            color="blue"
          />
          <StatCard
            title={t('status.approved')}
            value={leaves.approved || 0}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${leaves.total_approved_days || 0} ${t('dashboard.days')}`}
          />
          <StatCard
            title={t('status.pending')}
            value={leaves.pending || 0}
            icon={ClockIcon}
            color="yellow"
          />
          <StatCard
            title={t('status.rejected')}
            value={leaves.rejected || 0}
            icon={XCircleIcon}
            color="red"
          />
        </div>
      </div>

      {/* My Salary Advance Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('dashboard.my_salary_advances')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.total_requests')}
            value={salaryAdvances.total || 0}
            icon={CurrencyDollarIcon}
            color="blue"
          />
          <StatCard
            title={t('status.approved')}
            value={salaryAdvances.approved || 0}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${salaryAdvances.total_approved_amount?.toFixed(2) || 0} ${t('common.currency')}`}
          />
          <StatCard
            title={t('status.pending')}
            value={salaryAdvances.pending || 0}
            icon={ClockIcon}
            color="yellow"
          />
          <StatCard
            title={t('status.rejected')}
            value={salaryAdvances.rejected || 0}
            icon={XCircleIcon}
            color="red"
          />
        </div>
      </div>

      {/* Recent Activity */}
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
    </div>
  )
}
