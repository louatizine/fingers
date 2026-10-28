import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, settingsAPI } from '../services/api'

import {
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  FlagIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon
} from '../components/ui/icons'

import { getAttendanceLocale } from '../utils/attendanceI18n'
import { BRAND } from '../config/brand'
import { greetingPeriod } from '../utils/greeting'
import useCountUp from '../hooks/useCountUp'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/StatusBadge'
import LiveClock from '../components/ui/LiveClock'

const TICKS = 28

/** A row of small ticks instead of a gradient progress bar: reads like a ruler / gauge. */
function TickGauge({ ratio }) {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * TICKS)
  return (
    <div className="flex h-8 items-end gap-[3px]" role="img" aria-label={`${Math.round(ratio * 100)}%`}>
      {Array.from({ length: TICKS }).map((_, i) => {
        const on = i < filled
        const tall = i % 7 === 0
        return (
          <span
            key={i}
            className="grow-y flex-1 rounded-full"
            style={{
              height: tall ? '100%' : '62%',
              backgroundColor: on ? BRAND.violet : '#E5E0D5',
              animationDelay: `${i * 18}ms`
            }}
          />
        )
      })}
    </div>
  )
}

function Tally({ label, value, tone }) {
  const tones = {
    default: 'text-slate-900',
    green: 'text-[#17802a]',
    yellow: 'text-[#7A5C00]',
    red: 'text-brand-red'
  }
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className={`font-display text-3xl font-light leading-none tabular-nums ${tones[tone || 'default']}`}>{value}</p>
      <p className="kicker mt-2">{label}</p>
    </div>
  )
}

function RequestPanel({ title, subtitle, icon: Icon, accent, counts, footer }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-medium text-slate-900">{title}</h3>
          <p className="kicker mt-1.5">{subtitle}</p>
        </div>
        <Icon className="h-6 w-6" style={{ color: accent }} strokeWidth={1.5} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">{counts}</div>
      <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">{footer}</p>
    </section>
  )
}

function ActivityList({ title, subtitle, items, renderMeta, emptyLabel, viewAllLabel, to, isRTL }) {
  const Arrow = isRTL ? ArrowLeftIcon : ArrowRightIcon
  const list = items?.slice(0, 3) || []
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 px-6 pb-4 pt-6">
        <h3 className="font-display text-xl font-medium text-slate-900">{title}</h3>
        <p className="kicker mt-1.5">{subtitle}</p>
      </div>

      {list.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-3 px-6 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.reason}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{renderMeta(item)}</p>
              </div>
              <StatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}

      <Link
        to={to}
        className="group flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-sm font-semibold text-primary hover:bg-primary-50"
      >
        {viewAllLabel}
        <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </section>
  )
}

export default function EmployeeDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRTL = i18n.language === 'ar'

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

  const balance = vacationBalance || statistics?.vacation_balance || 0
  const earned = statistics?.vacation_earned || 0
  const ratio = (vacationBalance || 0) / (statistics?.vacation_earned || 1)
  const animatedBalance = useCountUp(Number(balance) || 0, 1100)

  if (loading) return <LoadingSpinner message={t('common.loading_message')} />

  const leaves = statistics?.leaves || {}
  const salaryAdvances = statistics?.salary_advances || {}
  const name = statistics?.employee_name || user?.first_name

  const period = greetingPeriod()

  const quickActions = [
    { label: t('dashboard:request_leave'), to: '/leaves', icon: CalendarIcon, color: BRAND.green },
    { label: t('dashboard:request_advance'), to: '/salary-advances', icon: CurrencyDollarIcon, color: BRAND.yellow },
    { label: t('dashboard:view_schedule'), to: '/holidays', icon: FlagIcon, color: '#F0536C' }
  ]

  return (
    <div className="space-y-8 pb-8">
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
        meta={
          (statistics?.position || statistics?.department) && (
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              {statistics?.position && (
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4" />
                  {statistics.position}
                </span>
              )}
              {statistics?.position && statistics?.department && <span className="text-slate-300">/</span>}
              {statistics?.department && <span>{statistics.department}</span>}
            </span>
          )
        }
        actions={
          <Link to="/profile" className="btn-secondary">
            {t('dashboard:view_profile')}
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Balance */}
          <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
            <img
              src="/cube.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-4 end-4 h-28 w-auto opacity-[0.07]"
            />
            <p className="kicker">{t('dashboard:vacation_balance')}</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-7xl font-light leading-none tracking-tight tabular-nums text-slate-900 md:text-8xl">
                {animatedBalance}
              </span>
              <span className="font-display text-2xl italic text-slate-400">{t('dashboard:days')}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{t('dashboard:days_available')}</p>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span className="kicker">{t('dashboard:balance_progress')}</span>
                <span className="font-mono tabular-nums">{Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%</span>
              </div>
              <TickGauge ratio={ratio} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Tally label={t('dashboard:vacation_earned')} value={earned} tone="green" />
              <Tally label={t('dashboard:vacation_used')} value={statistics?.vacation_used || 0} tone="red" />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RequestPanel
              title={t('dashboard:my_leave_requests')}
              subtitle={t('dashboard:current_status_overview')}
              icon={CalendarIcon}
              accent={BRAND.violet}
              counts={
                <>
                  <Tally label={t('status.total')} value={leaves.total || 0} />
                  <Tally label={t('status.approved')} value={leaves.approved || 0} tone="green" />
                  <Tally label={t('status.pending')} value={leaves.pending || 0} tone="yellow" />
                  <Tally label={t('status.rejected')} value={leaves.rejected || 0} tone="red" />
                </>
              }
              footer={
                <>
                  <span className="font-semibold text-slate-900 tabular-nums">{leaves.total_approved_days || 0}</span>{' '}
                  {t('dashboard:approved_days')}
                </>
              }
            />
            <RequestPanel
              title={t('dashboard:my_salary_advances')}
              subtitle={t('dashboard:financial_requests_summary')}
              icon={CurrencyDollarIcon}
              accent={BRAND.green}
              counts={
                <>
                  <Tally label={t('status.total')} value={salaryAdvances.total || 0} />
                  <Tally label={t('status.approved')} value={salaryAdvances.approved || 0} tone="green" />
                  <Tally label={t('status.pending')} value={salaryAdvances.pending || 0} tone="yellow" />
                  <Tally label={t('status.rejected')} value={salaryAdvances.rejected || 0} tone="red" />
                </>
              }
              footer={
                <>
                  {t('dashboard:total_approved_amount')}:{' '}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {salaryAdvances.total_approved_amount?.toFixed(2) || 0} {t('common.currency')}
                  </span>
                </>
              }
            />
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <ActivityList
            title={t('dashboard:recent.leave_requests')}
            subtitle={t('dashboard:latest_activities')}
            items={statistics?.recent_leaves}
            renderMeta={(item) => `${new Date(item.date).toLocaleDateString(getAttendanceLocale(i18n.language))} · ${item.days} ${t('dashboard:days')}`}
            emptyLabel={t('dashboard:no_recent_leave_requests')}
            viewAllLabel={t('dashboard:view_all_requests')}
            to="/leaves"
            isRTL={isRTL}
          />

          <ActivityList
            title={t('dashboard:recent.salary_advances')}
            subtitle={t('dashboard:financial_activities')}
            items={statistics?.recent_salary_advances}
            renderMeta={(item) => `${new Date(item.date).toLocaleDateString(getAttendanceLocale(i18n.language))} · ${item.amount} ${t('common.currency')}`}
            emptyLabel={t('dashboard:no_recent_salary_advances')}
            viewAllLabel={t('dashboard:view_all_advances')}
            to="/salary-advances"
            isRTL={isRTL}
          />

          {/* Quick actions */}
          <section className="rounded-xl bg-slate-900 p-6 text-white">
            <h3 className="font-display text-xl font-medium">{t('dashboard:quick_actions')}</h3>
            <ul className="mt-4 divide-y divide-white/10">
              {quickActions.map(({ label, to, icon: Icon, color }, index) => (
                <li key={to}>
                  <Link to={to} className="group flex items-center gap-4 py-3.5">
                    <span className="font-mono text-xs text-white/40">{String(index + 1).padStart(2, '0')}</span>
                    <Icon className="h-5 w-5 shrink-0" style={{ color }} strokeWidth={1.75} />
                    <span className="flex-1 text-sm font-medium">{label}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-white/40 transition-all group-hover:-translate-y-0.5 group-hover:text-brand-yellow rtl:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
