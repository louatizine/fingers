import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fleetAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { TruckIcon } from '../components/ui/icons'
import { DocumentFormModal, MaintenanceFormModal, ScheduleFormModal, VehicleFormModal } from '../components/fleet/FleetModals'
import { VEHICLE_FORM_KEYS, appendFormData, driverLabel, pickFields, statusClass, vehicleLabel } from '../components/fleet/helpers'

export default function FleetVehicleDetail() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const isManager = user?.role === 'admin' || user?.role === 'supervisor'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vehicle, setVehicle] = useState(null)
  const [documents, setDocuments] = useState([])
  const [history, setHistory] = useState({ assignments: [], auditLogs: [] })
  const [records, setRecords] = useState([])
  const [schedules, setSchedules] = useState([])
  const [section, setSection] = useState('overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [vehicleRes, docsRes, historyRes, maintRes, scheduleRes] = await Promise.all([
        fleetAPI.getVehicle(vehicleId),
        fleetAPI.getVehicleDocuments(vehicleId),
        fleetAPI.getVehicleHistory(vehicleId),
        fleetAPI.getMaintenanceRecords({ vehicleId, limit: 50 }),
        fleetAPI.getMaintenanceSchedules({ vehicleId }),
      ])
      setVehicle(vehicleRes.data.vehicle)
      setDocuments(docsRes.data.documents || [])
      setHistory(historyRes.data || { assignments: [], auditLogs: [] })
      setRecords(maintRes.data.records || [])
      setSchedules(scheduleRes.data.schedules || [])
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.loadFailed'))
      navigate('/fleet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [vehicleId])

  const submitVehicle = async (form, photos) => {
    setSaving(true)
    try {
      const data = appendFormData(null, pickFields(form, VEHICLE_FORM_KEYS), { files: { photos } })
      await fleetAPI.updateVehicle(vehicleId, data)
      toast.success(t('fleet.vehicleUpdated'))
      setShowEdit(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const deleteVehicle = async () => {
    const ok = await confirm({
      title: t('fleet.deleteVehicle'),
      message: t('fleet.deleteVehicleConfirm'),
      type: 'danger',
      confirmText: t('common.delete'),
    })
    if (!ok) return
    try {
      await fleetAPI.deleteVehicle(vehicleId)
      toast.success(t('fleet.vehicleDeleted'))
      navigate('/fleet')
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitDocument = async (form, file) => {
    setSaving(true)
    try {
      const data = appendFormData(null, form, { files: { file } })
      await fleetAPI.createVehicleDocument(vehicleId, data)
      toast.success(t('fleet.documentCreated'))
      setShowDoc(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const removeDocument = async (documentId) => {
    const ok = await confirm({ title: t('fleet.deleteDocument'), message: t('fleet.deleteDocumentConfirm'), type: 'danger' })
    if (!ok) return
    try {
      await fleetAPI.deleteVehicleDocument(documentId)
      toast.success(t('fleet.documentDeleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitMaintenance = async (form, invoice) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        setVehicleMaintenance: form.setVehicleMaintenance ? 'true' : 'false',
      }
      const data = appendFormData(null, payload, { files: { invoice } })
      await fleetAPI.createMaintenanceRecord(data)
      toast.success(t('fleet.maintenanceCreated'))
      setShowMaintenance(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const completeMaintenance = async (record) => {
    try {
      const data = new FormData()
      data.append('status', 'completed')
      await fleetAPI.updateMaintenanceRecord(record._id, data)
      toast.success(t('fleet.maintenanceCompleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitSchedule = async (form) => {
    setSaving(true)
    try {
      await fleetAPI.createMaintenanceSchedule(form)
      toast.success(t('fleet.scheduleCreated'))
      setShowSchedule(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !vehicle) return <LoadingSpinner message={t('fleet.loading')} />

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={TruckIcon}
        kicker={t('fleet.kicker')}
        title={vehicleLabel(vehicle)}
        subtitle={`${t(`fleet.vehicleTypes.${vehicle.vehicleType || 'car'}`)} · ${t(`fleet.status.${vehicle.status}`)}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/fleet" className="btn-secondary">{t('fleet.backToFleet')}</Link>
            {isManager && <button type="button" className="btn-secondary" onClick={() => setShowEdit(true)}>{t('fleet.editVehicle')}</button>}
            {isManager && <button type="button" className="btn-secondary text-rose-600" onClick={deleteVehicle}>{t('fleet.deleteVehicle')}</button>}
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
        {['overview', 'documents', 'history', 'maintenance'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${section === item ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t(`fleet.detailTabs.${item}`)}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['plateNumber', vehicle.plateNumber],
            ['vin', vehicle.vin || '—'],
            ['brand', vehicle.brand],
            ['model', vehicle.model],
            ['year', vehicle.year || '—'],
            ['color', vehicle.color || '—'],
            ['currentMileage', vehicle.currentMileage],
            ['tankCapacityLiters', vehicle.tankCapacityLiters || '—'],
            ['fuelType', t(`fleet.fuelTypes.${vehicle.fuelType || 'other'}`)],
            ['transmission', t(`fleet.transmissions.${vehicle.transmission || 'other'}`)],
            ['status', t(`fleet.status.${vehicle.status}`)],
          ].map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="kicker">{t(`fleet.form.${key}`)}</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
          {vehicle.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:col-span-2 xl:col-span-3">
              <p className="kicker">{t('fleet.form.notes')}</p>
              <p className="mt-2 text-sm text-slate-700">{vehicle.notes}</p>
            </div>
          )}
        </section>
      )}

      {section === 'documents' && (
        <section className="space-y-4">
          {isManager && (
            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={() => setShowDoc(true)}>{t('fleet.addDocument')}</button>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <table className="w-full text-start">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {['type', 'documentNumber', 'issueDate', 'expiryDate', 'status', 'actions'].map((key) => (
                    <th key={key} className="kicker px-6 py-3 text-start">{t(`fleet.table.${key}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <tr key={document._id}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{t(`fleet.docTypes.${document.type}`)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{document.documentNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{document.issueDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{document.expiryDate}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(document.status)}`}>{t(`fleet.docStatus.${document.status}`)}</span></td>
                    <td className="px-6 py-4">
                      {isManager && <button type="button" className="text-xs font-bold text-rose-600" onClick={() => removeDocument(document._id)}>{t('common.delete')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!documents.length && <p className="p-8 text-center text-sm text-slate-500">{t('fleet.noDocuments')}</p>}
          </div>
        </section>
      )}

      {section === 'history' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.detailTabs.history')}</h3></div>
            <ul className="divide-y divide-slate-100">
              {(history.assignments || []).map((assignment) => (
                <li key={assignment._id} className="px-6 py-4 text-sm">
                  <p className="font-bold text-slate-900">{driverLabel(assignment.driver || assignment.driverId)}</p>
                  <p className="text-slate-500">{assignment.startDate} – {assignment.endDate || '∞'} · {t(`fleet.assignmentStatus.${assignment.status}`)}</p>
                </li>
              ))}
              {!(history.assignments || []).length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noAssignments')}</li>}
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.auditLogs')}</h3></div>
            <ul className="divide-y divide-slate-100">
              {(history.auditLogs || []).map((log) => (
                <li key={log._id} className="px-6 py-4 text-sm">
                  <p className="font-bold text-slate-900">{log.action}</p>
                  <p className="text-slate-500">{log.createdAt}</p>
                </li>
              ))}
              {!(history.auditLogs || []).length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noAuditLogs')}</li>}
            </ul>
          </div>
        </section>
      )}

      {section === 'maintenance' && (
        <section className="space-y-4">
          {isManager && (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowSchedule(true)}>{t('fleet.addSchedule')}</button>
              <button type="button" className="btn-primary" onClick={() => setShowMaintenance(true)}>{t('fleet.addMaintenance')}</button>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.maintenanceRecords')}</h3></div>
              <ul className="divide-y divide-slate-100">
                {records.map((record) => (
                  <li key={record._id} className="flex items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{t(`fleet.maintenanceTypes.${record.type}`)} · {record.serviceDate}</p>
                      <p className="text-slate-500">{record.garage || '—'} · {record.cost ?? '—'} · {t(`fleet.maintenanceStatuses.${record.status}`)}</p>
                    </div>
                    {isManager && ['planned', 'in_progress'].includes(record.status) && (
                      <button type="button" className="text-xs font-bold text-primary" onClick={() => completeMaintenance(record)}>{t('fleet.complete')}</button>
                    )}
                  </li>
                ))}
                {!records.length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noMaintenance')}</li>}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.maintenanceSchedules')}</h3></div>
              <ul className="divide-y divide-slate-100">
                {schedules.map((schedule) => (
                  <li key={schedule._id} className="flex items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{t(`fleet.maintenanceTypes.${schedule.type}`)}</p>
                      <p className="text-slate-500">{schedule.nextDueDate || '—'} · {schedule.nextDueMileage || '—'} km</p>
                    </div>
                    {isManager && (
                      <button
                        type="button"
                        className="text-xs font-bold text-rose-600"
                        onClick={async () => {
                          await fleetAPI.deleteMaintenanceSchedule(schedule._id)
                          toast.success(t('fleet.scheduleDeleted'))
                          await load()
                        }}
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </li>
                ))}
                {!schedules.length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noSchedules')}</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      <VehicleFormModal open={showEdit} initial={vehicle} saving={saving} onClose={() => setShowEdit(false)} onSubmit={submitVehicle} />
      <DocumentFormModal open={showDoc} saving={saving} onClose={() => setShowDoc(false)} onSubmit={submitDocument} />
      <MaintenanceFormModal open={showMaintenance} vehicles={[vehicle]} saving={saving} onClose={() => setShowMaintenance(false)} onSubmit={submitMaintenance} />
      <ScheduleFormModal open={showSchedule} vehicles={[vehicle]} saving={saving} onClose={() => setShowSchedule(false)} onSubmit={submitSchedule} />
    </div>
  )
}
