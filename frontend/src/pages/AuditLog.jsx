import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { auditAPI } from '../services/api'
import { useToast } from '../components/Toast'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { ClockIcon } from '../components/ui/icons'

export default function AuditLog() {
  const { t } = useTranslation()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [entityType, setEntityType] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const response = await auditAPI.getLogs({
        limit: 100,
        entityType: entityType || undefined,
      })
      setLogs(response.data.logs || [])
    } catch (error) {
      toast.error(error.response?.data?.error || t('audit.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [entityType])

  if (loading && !logs.length) return <LoadingSpinner message={t('audit.loading')} />

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={ClockIcon}
        kicker={t('audit.kicker')}
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
      />

      <div className="flex flex-wrap gap-3">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">{t('audit.allTypes')}</option>
          {['leave', 'salary_advance', 'department', 'comment'].map((value) => (
            <option key={value} value={value}>{t(`audit.entityTypes.${value}`)}</option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={load}>{t('common.refresh')}</button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['when', 'action', 'entity', 'actor'].map((key) => (
                  <th key={key} className="kicker px-6 py-3 text-start">{t(`audit.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-6 py-4 text-sm text-slate-600">{log.createdAt?.replace?.('T', ' ')?.slice(0, 19)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t(`audit.entityTypes.${log.entityType}`, { defaultValue: log.entityType })} · {log.entityId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{log.actorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length && <p className="p-8 text-center text-sm text-slate-500">{t('audit.empty')}</p>}
      </section>
    </div>
  )
}
