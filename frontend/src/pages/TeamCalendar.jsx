import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calendarAPI, departmentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { CalendarIcon } from '../components/ui/icons'

function monthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 2, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default function TeamCalendar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(monthRange())
  const [scope, setScope] = useState(user?.role === 'supervisor' ? 'team' : 'company')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [absences, setAbsences] = useState([])
  const [holidays, setHolidays] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [calendarRes, deptRes] = await Promise.all([
        calendarAPI.getTeamAbsences({
          start: range.start,
          end: range.end,
          scope,
          departmentId: departmentId || undefined,
        }),
        departmentAPI.getDepartments(),
      ])
      setAbsences(calendarRes.data.absences || [])
      setHolidays(calendarRes.data.holidays || [])
      setDepartments(deptRes.data.departments || [])
    } catch (error) {
      toast.error(error.response?.data?.error || t('teamCalendar.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [range.start, range.end, scope, departmentId])

  const days = useMemo(() => {
    const list = []
    const cursor = new Date(`${range.start}T00:00:00`)
    const last = new Date(`${range.end}T00:00:00`)
    while (cursor <= last) {
      list.push(cursor.toISOString().slice(0, 10))
      cursor.setDate(cursor.getDate() + 1)
    }
    return list
  }, [range])

  const itemsForDay = (day) => {
    const leaveItems = absences.filter((item) => item.start <= day && item.end >= day)
    const holidayItems = holidays.filter((item) => item.start <= day && item.end >= day)
    return { leaveItems, holidayItems }
  }

  if (loading && !absences.length && !holidays.length) {
    return <LoadingSpinner message={t('teamCalendar.loading')} />
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={CalendarIcon}
        kicker={t('teamCalendar.kicker')}
        title={t('teamCalendar.title')}
        subtitle={t('teamCalendar.subtitle')}
      />

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <input type="date" value={range.start} onChange={(e) => setRange((current) => ({ ...current, start: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="date" value={range.end} onChange={(e) => setRange((current) => ({ ...current, end: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        {(user?.role === 'supervisor' || user?.role === 'admin') && (
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
            <option value="company">{t('teamCalendar.scopeCompany')}</option>
            <option value="team">{t('teamCalendar.scopeTeam')}</option>
          </select>
        )}
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">{t('teamCalendar.allDepartments')}</option>
          {departments.map((department) => (
            <option key={department._id} value={department._id}>{department.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const { leaveItems, holidayItems } = itemsForDay(day)
          if (!leaveItems.length && !holidayItems.length) return null
          return (
            <article key={day} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="font-bold text-slate-900">{day}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {holidayItems.map((item) => (
                  <li key={`h-${item._id}`} className="rounded-lg bg-amber-50 px-3 py-2 font-bold text-amber-800">
                    {item.name}
                  </li>
                ))}
                {leaveItems.map((item) => (
                  <li key={item._id} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-bold text-slate-900">{item.userName}</span>
                    <span className="ms-2 text-xs text-slate-500">{item.leaveType}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      {!absences.length && !holidays.length && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {t('teamCalendar.empty')}
        </p>
      )}
    </div>
  )
}
