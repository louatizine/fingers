import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fleetAPI, workedHoursAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { ClockIcon, PlusIcon, ArrowPathIcon } from '../components/ui/icons'
import { driverLabel } from '../components/fleet/helpers'

const fieldClass = 'rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none'
const STATUS_CLASS = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
}

export default function WorkedHours() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const isManager = user?.role === 'admin' || user?.role === 'supervisor'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState([])
  const [drivers, setDrivers] = useState([])
  const [clients, setClients] = useState([])
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    driverId: '',
    status: '',
  })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    driverId: '',
    date: '',
    totalHours: '',
    clientId: '',
    notes: '',
    status: 'submitted',
  })
  const [attachment, setAttachment] = useState(null)
  const [missionInfo, setMissionInfo] = useState(null)
  const [standardHours, setStandardHours] = useState(null)

  const extrasPreview = useMemo(() => {
    const total = Number(form.totalHours)
    if (!Number.isFinite(total) || standardHours == null) return null
    return Math.max(0, Math.round((total - standardHours) * 100) / 100)
  }, [form.totalHours, standardHours])

  const load = async () => {
    setLoading(true)
    try {
      const params = {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        driverId: filters.driverId || undefined,
        status: filters.status || undefined,
        limit: 100,
      }
      const [entriesRes, clientsRes] = await Promise.all([
        workedHoursAPI.getEntries(params),
        fleetAPI.getClients({ activeOnly: true }),
      ])
      setEntries(entriesRes.data.entries || [])
      setClients(clientsRes.data.clients || [])
      if (isManager) {
        const driversRes = await fleetAPI.getDrivers({ page: 1, limit: 100 })
        setDrivers(driversRes.data.drivers || [])
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isManager])

  const resolveMission = async (driverId, date) => {
    if (!date || (isManager && !driverId)) {
      setMissionInfo(null)
      setStandardHours(null)
      return
    }
    try {
      const response = await workedHoursAPI.getMission({
        driverId: isManager ? driverId : undefined,
        date,
      })
      setMissionInfo(response.data.mission || null)
      setStandardHours(response.data.standardHours ?? null)
      if (response.data.mission?.clientId) {
        setForm((current) => ({ ...current, clientId: response.data.mission.clientId }))
      }
    } catch {
      setMissionInfo(null)
      setStandardHours(null)
    }
  }

  const openCreate = () => {
    setForm({
      driverId: '',
      date: '',
      totalHours: '',
      clientId: '',
      notes: '',
      status: 'submitted',
    })
    setAttachment(null)
    setMissionInfo(null)
    setStandardHours(null)
    setShowForm(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      if (isManager && form.driverId) data.append('driverId', form.driverId)
      data.append('date', form.date)
      data.append('totalHours', form.totalHours)
      data.append('status', form.status || 'submitted')
      if (!missionInfo && form.clientId) data.append('clientId', form.clientId)
      if (form.notes) data.append('notes', form.notes)
      if (attachment) data.append('attachment', attachment)
      await workedHoursAPI.createEntry(data)
      toast.success(t('workedHours.created'))
      setShowForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const approve = async (entry) => {
    try {
      await workedHoursAPI.approveEntry(entry._id)
      toast.success(t('workedHours.approved'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.saveFailed'))
    }
  }

  const reject = async (entry) => {
    const reason = window.prompt(t('workedHours.rejectReason'))
    if (reason == null) return
    try {
      await workedHoursAPI.rejectEntry(entry._id, reason)
      toast.success(t('workedHours.rejected'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.saveFailed'))
    }
  }

  const remove = async (entry) => {
    const ok = await confirm({
      title: t('workedHours.delete'),
      message: t('workedHours.deleteConfirm'),
      type: 'danger',
    })
    if (!ok) return
    try {
      await workedHoursAPI.deleteEntry(entry._id)
      toast.success(t('workedHours.deleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.saveFailed'))
    }
  }

  const downloadAttachment = async (entry) => {
    try {
      const response = await workedHoursAPI.downloadAttachment(entry._id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = entry.attachment?.originalName || 'attachment'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.response?.data?.error || t('workedHours.attachmentFailed'))
    }
  }

  if (loading && !entries.length) {
    return <LoadingSpinner message={t('workedHours.loading')} />
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={ClockIcon}
        kicker={t('workedHours.kicker')}
        title={t('workedHours.title')}
        subtitle={t('workedHours.subtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={load}>
              <ArrowPathIcon className="h-4 w-4" />
              {t('common.refresh')}
            </button>
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              {t('workedHours.add')}
            </button>
          </div>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className={fieldClass} />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className={fieldClass} />
        {isManager && (
          <select value={filters.driverId} onChange={(e) => setFilters({ ...filters, driverId: e.target.value })} className={fieldClass}>
            <option value="">{t('workedHours.allDrivers')}</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>{driverLabel(driver)}</option>
            ))}
          </select>
        )}
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={fieldClass}>
          <option value="">{t('workedHours.allStatuses')}</option>
          {['draft', 'submitted', 'approved', 'rejected'].map((status) => (
            <option key={status} value={status}>{t(`workedHours.status.${status}`)}</option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={load}>{t('common.apply')}</button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['date', 'driver', 'client', 'mission', 'total', 'standard', 'extras', 'status', 'actions'].map((key) => (
                  <th key={key} className="kicker px-6 py-3 text-start">{t(`workedHours.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{entry.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{driverLabel(entry.driver || entry.driverId)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{entry.client?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{entry.assignment?.purpose || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{entry.totalHours}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{entry.standardHours}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{entry.extraHours}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[entry.status] || STATUS_CLASS.draft}`}>
                      {t(`workedHours.status.${entry.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.attachment && (
                        <button type="button" className="text-xs font-bold text-primary" onClick={() => downloadAttachment(entry)}>
                          {t('workedHours.attachment')}
                        </button>
                      )}
                      {isManager && entry.status === 'submitted' && (
                        <>
                          <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => approve(entry)}>
                            {t('workedHours.approve')}
                          </button>
                          <button type="button" className="text-xs font-bold text-rose-600" onClick={() => reject(entry)}>
                            {t('workedHours.reject')}
                          </button>
                        </>
                      )}
                      {isManager && (
                        <button type="button" className="text-xs font-bold text-rose-600" onClick={() => remove(entry)}>
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!entries.length && <p className="p-8 text-center text-sm text-slate-500">{t('workedHours.empty')}</p>}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-black text-slate-900">{t('workedHours.add')}</h2>
            <form className="space-y-4" onSubmit={submit}>
              {isManager && (
                <select
                  required
                  value={form.driverId}
                  onChange={(e) => {
                    const driverId = e.target.value
                    setForm({ ...form, driverId })
                    resolveMission(driverId, form.date)
                  }}
                  className={`w-full ${fieldClass}`}
                >
                  <option value="">{t('workedHours.selectDriver')}</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>{driverLabel(driver)}</option>
                  ))}
                </select>
              )}
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => {
                  const date = e.target.value
                  setForm({ ...form, date })
                  resolveMission(form.driverId, date)
                }}
                className={`w-full ${fieldClass}`}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {missionInfo ? (
                  <>
                    <p className="font-bold text-slate-900">{t('workedHours.missionFound')}</p>
                    <p>{missionInfo.client?.name || t('workedHours.noClient')} · {missionInfo.purpose || t('workedHours.noPurpose')}</p>
                    <p>{missionInfo.startDate} – {missionInfo.endDate || '∞'}</p>
                  </>
                ) : (
                  <p>{t('workedHours.noMission')}</p>
                )}
                {standardHours != null && (
                  <p className="mt-1">{t('workedHours.standardLabel', { hours: standardHours })}</p>
                )}
              </div>
              {!missionInfo && (
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className={`w-full ${fieldClass}`}
                >
                  <option value="">{t('workedHours.optionalClient')}</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              )}
              <input
                required
                type="number"
                min="0"
                max="24"
                step="0.25"
                value={form.totalHours}
                onChange={(e) => setForm({ ...form, totalHours: e.target.value })}
                placeholder={t('workedHours.totalHours')}
                className={`w-full ${fieldClass}`}
              />
              {extrasPreview != null && (
                <p className="text-sm font-bold text-slate-700">
                  {t('workedHours.extrasPreview', { hours: extrasPreview })}
                </p>
              )}
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('workedHours.notes')}
                rows={3}
                className={`w-full ${fieldClass}`}
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className={`w-full ${fieldClass}`}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
