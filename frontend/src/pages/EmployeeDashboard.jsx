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
  BriefcaseIcon,
  ChevronRightIcon,
  UserCircleIcon,
  BuildingOfficeIcon
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 pb-12 px-4 md:px-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Glass Morphism Header */}
      <div className="sticky top-6 z-10 mb-8 pt-6">
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-lg shadow-indigo-100/50 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <UserCircleIcon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {t('common.welcome')}, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{statistics?.employee_name || user?.first_name}</span>!
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <BriefcaseIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{statistics?.position}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-2 text-slate-600">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{statistics?.department}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm">
                <ClockIcon className="h-4 w-4" />
                <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 group hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 cursor-pointer">
                <span className="text-sm font-bold">View Profile</span>
                <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vacation Balance Card - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vacation Balance - Premium Card */}
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <div className="relative p-8 rounded-3xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-blue-100/80 font-semibold text-sm uppercase tracking-widest mb-2">
                    {t('dashboard.vacation_balance')}
                  </p>
                  <h2 className="text-6xl font-black text-white tracking-tight">
                    {vacationBalance || statistics?.vacation_balance || 0}
                    <span className="text-2xl text-blue-100/60 ml-2">days</span>
                  </h2>
                  <p className="text-blue-100/60 mt-3 text-sm font-medium">{t('dashboard.days_available')}</p>
                </div>
                <div className="relative">
                  <CalendarIcon className="h-24 w-24 text-white/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 group hover:bg-white/15 transition-all duration-300">
                  <p className="text-blue-100/70 text-sm font-medium mb-2">{t('dashboard.vacation_earned')}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{statistics?.vacation_earned || 0}</p>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 group hover:bg-white/15 transition-all duration-300">
                  <p className="text-blue-100/70 text-sm font-medium mb-2">{t('dashboard.vacation_used')}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{statistics?.vacation_used || 0}</p>
                    <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <XCircleIcon className="h-5 w-5 text-rose-300" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>Balance Progress</span>
                  <span>{Math.round(((vacationBalance || 0) / (statistics?.vacation_earned || 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(((vacationBalance || 0) / (statistics?.vacation_earned || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Requests */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('dashboard.my_leave_requests')}</h3>
                  <p className="text-slate-500 text-sm mt-1">Current status overview</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-slate-50/50">
                  <p className="text-3xl font-black text-slate-900">{leaves.total || 0}</p>
                  <p className="text-slate-600 text-sm font-medium mt-1">Total</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-emerald-50">
                  <p className="text-3xl font-black text-emerald-600">{leaves.approved || 0}</p>
                  <p className="text-emerald-600 text-sm font-medium mt-1">Approved</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-amber-50">
                  <p className="text-3xl font-black text-amber-600">{leaves.pending || 0}</p>
                  <p className="text-amber-600 text-sm font-medium mt-1">Pending</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-rose-50">
                  <p className="text-3xl font-black text-rose-600">{leaves.rejected || 0}</p>
                  <p className="text-rose-600 text-sm font-medium mt-1">Rejected</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-slate-500 text-sm">
                  <span className="font-bold text-slate-900">{leaves.total_approved_days || 0}</span> approved days
                </p>
              </div>
            </div>

            {/* Salary Advances */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('dashboard.my_salary_advances')}</h3>
                  <p className="text-slate-500 text-sm mt-1">Financial requests summary</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-slate-50/50">
                  <p className="text-3xl font-black text-slate-900">{salaryAdvances.total || 0}</p>
                  <p className="text-slate-600 text-sm font-medium mt-1">Total</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-emerald-50">
                  <p className="text-3xl font-black text-emerald-600">{salaryAdvances.approved || 0}</p>
                  <p className="text-emerald-600 text-sm font-medium mt-1">Approved</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-amber-50">
                  <p className="text-3xl font-black text-amber-600">{salaryAdvances.pending || 0}</p>
                  <p className="text-amber-600 text-sm font-medium mt-1">Pending</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-rose-50">
                  <p className="text-3xl font-black text-rose-600">{salaryAdvances.rejected || 0}</p>
                  <p className="text-rose-600 text-sm font-medium mt-1">Rejected</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-slate-500 text-sm">
                  Total approved amount: <span className="font-bold text-slate-900">{salaryAdvances.total_approved_amount?.toFixed(2) || 0} {t('common.currency')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Recent Activity */}
        <div className="space-y-6">
          {/* Recent Leave Requests */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('dashboard.recent.leave_requests')}</h3>
                <p className="text-slate-500 text-sm mt-1">Latest activities</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="space-y-4">
              {statistics?.recent_leaves?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/50 transition-all group">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    item.status === 'approved' ? 'bg-emerald-50' :
                    item.status === 'pending' ? 'bg-amber-50' : 'bg-rose-50'
                  }`}>
                    {item.status === 'approved' ? <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> :
                     item.status === 'pending' ? <ClockIcon className="h-5 w-5 text-amber-600" /> :
                     <XCircleIcon className="h-5 w-5 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.reason}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString()} • {item.days} days
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              )) || (
                <div className="text-center py-8 text-slate-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recent leave requests</p>
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-3 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all">
              View All Requests
            </button>
          </div>

          {/* Recent Salary Advances */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('dashboard.recent.salary_advances')}</h3>
                <p className="text-slate-500 text-sm mt-1">Financial activities</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-4">
              {statistics?.recent_salary_advances?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/50 transition-all group">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    item.status === 'approved' ? 'bg-emerald-50' :
                    item.status === 'pending' ? 'bg-amber-50' : 'bg-rose-50'
                  }`}>
                    {item.status === 'approved' ? <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> :
                     item.status === 'pending' ? <ClockIcon className="h-5 w-5 text-amber-600" /> :
                     <XCircleIcon className="h-5 w-5 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.reason}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString()} • {item.amount} {t('common.currency')}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              )) || (
                <div className="text-center py-8 text-slate-400">
                  <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recent salary advances</p>
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-3 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all">
              View All Advances
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Request Leave</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CurrencyDollarIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Request Advance</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BriefcaseIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">View Schedule</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats - Optional if you want to keep original StatCard components */}
      <div className="hidden">
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