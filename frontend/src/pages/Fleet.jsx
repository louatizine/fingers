import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fleetAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import FleetDashboard from '../components/fleet/FleetDashboard'
import {
  AssignmentActionModal,
  AssignmentFormModal,
  DriverFormModal,
  FuelLimitFormModal,
  FuelPurchaseFormModal,
  MaintenanceFormModal,
  RejectReasonModal,
  ScheduleFormModal,
  VehicleFormModal,
} from '../components/fleet/FleetModals'
import {
  DRIVER_FORM_KEYS,
  VEHICLE_FORM_KEYS,
  appendFormData,
  driverLabel,
  pickFields,
  statusClass,
  vehicleLabel,
} from '../components/fleet/helpers'
import { TruckIcon, PlusIcon, ArrowPathIcon } from '../components/ui/icons'
import RequestComments from '../components/RequestComments'

export default function Fleet() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const isManager = user?.role === 'admin' || user?.role === 'supervisor'
  const isAdmin = user?.role === 'admin'

  const [tab, setTab] = useState('overview')
  const [fuelSubTab, setFuelSubTab] = useState('purchases')
  const [commentsFuelId, setCommentsFuelId] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [drivers, setDrivers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [purchases, setPurchases] = useState([])
  const [fuelLimits, setFuelLimits] = useState([])
  const [myLimits, setMyLimits] = useState([])
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [schedules, setSchedules] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vehiclePage, setVehiclePage] = useState(1)
  const [vehiclePagination, setVehiclePagination] = useState({ page: 1, pages: 1, total: 0 })

  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showFuelForm, setShowFuelForm] = useState(false)
  const [showLimitForm, setShowLimitForm] = useState(false)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [assignmentAction, setAssignmentAction] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const navGroups = useMemo(() => ([
    { id: 'overview', items: ['overview'] },
    { id: 'fleet', items: ['vehicles', ...(isManager ? ['drivers'] : [])] },
    { id: 'operations', items: ['assignments'] },
    { id: 'fuel', items: ['fuel'] },
    { id: 'maintenance', items: ['maintenance'] },
  ]), [isManager])

  const primaryAction = useMemo(() => {
    if (tab === 'vehicles' && isManager) {
      return { label: t('fleet.addVehicle'), onClick: () => { setEditingVehicle(null); setShowVehicleForm(true) } }
    }
    if (tab === 'drivers' && isManager) {
      return { label: t('fleet.addDriver'), onClick: () => { setEditingDriver(null); setShowDriverForm(true) } }
    }
    if (tab === 'assignments' && isManager) {
      return { label: t('fleet.addAssignment'), onClick: () => setShowAssignmentForm(true) }
    }
    if (tab === 'fuel') {
      if (fuelSubTab === 'limits' && isAdmin) {
        return { label: t('fleet.addFuelLimit'), onClick: () => setShowLimitForm(true) }
      }
      return { label: t('fleet.addFuelPurchase'), onClick: () => setShowFuelForm(true) }
    }
    if (tab === 'maintenance' && isManager) {
      return { label: t('fleet.addMaintenance'), onClick: () => setShowMaintenanceForm(true) }
    }
    return null
  }, [tab, fuelSubTab, isManager, isAdmin, t])

  const load = async () => {
    setLoading(true)
    try {
      const vehicleParams = { page: vehiclePage, limit: 20, search: search || undefined, status: statusFilter || undefined }
      const [vehicleResponse, vehicleOptionsResponse, assignmentResponse, fuelResponse, dashboardResponse] = await Promise.all([
        fleetAPI.getVehicles(vehicleParams),
        fleetAPI.getVehicles({ page: 1, limit: 100 }),
        isManager ? fleetAPI.getAssignments({ page: 1, limit: 100 }) : fleetAPI.getMyAssignments({ page: 1, limit: 100 }),
        fleetAPI.getFuelPurchases({ page: 1, limit: 100 }),
        fleetAPI.getDashboard(),
      ])
      setVehicles(vehicleResponse.data.vehicles || [])
      setVehicleOptions(vehicleOptionsResponse.data.vehicles || [])
      setVehiclePagination(vehicleResponse.data.pagination || { page: 1, pages: 1, total: 0 })
      setAssignments(assignmentResponse.data.assignments || [])
      setPurchases(fuelResponse.data.purchases || [])
      setDashboard(dashboardResponse.data)

      const [maintRes, scheduleRes] = await Promise.all([
        fleetAPI.getMaintenanceRecords({ page: 1, limit: 50 }),
        fleetAPI.getMaintenanceSchedules(),
      ])
      setMaintenanceRecords(maintRes.data.records || [])
      setSchedules(scheduleRes.data.schedules || [])

      if (isManager) {
        const [driverResponse, limitResponse] = await Promise.all([
          fleetAPI.getDrivers({ page: 1, limit: 100 }),
          fleetAPI.getFuelLimits(),
        ])
        setDrivers(driverResponse.data.drivers || [])
        setFuelLimits(limitResponse.data.limits || [])
      } else {
        const myLimitResponse = await fleetAPI.getMyFuelLimits()
        setMyLimits(myLimitResponse.data.limits || [])
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isManager, vehiclePage, statusFilter])

  const submitVehicle = async (form, photos) => {
    setSaving(true)
    try {
      const data = appendFormData(null, pickFields(form, VEHICLE_FORM_KEYS), { files: { photos } })
      if (editingVehicle?._id) {
        await fleetAPI.updateVehicle(editingVehicle._id, data)
        toast.success(t('fleet.vehicleUpdated'))
      } else {
        await fleetAPI.createVehicle(data)
        toast.success(t('fleet.vehicleCreated'))
      }
      setShowVehicleForm(false)
      setEditingVehicle(null)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitDriver = async (form, licenseFile) => {
    setSaving(true)
    try {
      const data = appendFormData(null, pickFields(form, DRIVER_FORM_KEYS), { files: { licenseFile } })
      if (editingDriver?._id) {
        await fleetAPI.updateDriver(editingDriver._id, data)
        toast.success(t('fleet.driverUpdated'))
      } else {
        await fleetAPI.createDriver(data)
        toast.success(t('fleet.driverCreated'))
      }
      setShowDriverForm(false)
      setEditingDriver(null)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitAssignment = async (form) => {
    setSaving(true)
    try {
      await fleetAPI.createAssignment(form)
      toast.success(t('fleet.assignmentCreated'))
      setShowAssignmentForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitAssignmentAction = async (form, photos) => {
    setSaving(true)
    try {
      const data = appendFormData(null, form, { files: { photos } })
      await fleetAPI[assignmentAction.action](assignmentAction.assignment._id, data)
      toast.success(t(`fleet.${assignmentAction.action}Success`))
      setAssignmentAction(null)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const cancelAssignment = async (assignment) => {
    const ok = await confirm({ title: t('fleet.cancelAssignment'), message: t('fleet.cancelAssignmentConfirm'), type: 'warning' })
    if (!ok) return
    try {
      await fleetAPI.cancelAssignment(assignment._id)
      toast.success(t('fleet.assignmentCancelled'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitFuelPurchase = async (form, receipt) => {
    setSaving(true)
    try {
      const data = appendFormData(null, form, { files: { receipt } })
      await fleetAPI.createFuelPurchase(data)
      toast.success(t('fleet.fuelCreated'))
      setShowFuelForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitFuelLimit = async (form) => {
    setSaving(true)
    try {
      await fleetAPI.createFuelLimit({
        ...form,
        limitAmount: Number(form.limitAmount),
        vehicleId: form.vehicleId || null,
        effectiveTo: form.effectiveTo || null,
      })
      toast.success(t('fleet.limitCreated'))
      setShowLimitForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const deleteFuelLimit = async (limit) => {
    const ok = await confirm({ title: t('fleet.deleteLimit'), message: t('fleet.deleteLimitConfirm'), type: 'danger' })
    if (!ok) return
    try {
      await fleetAPI.deleteFuelLimit(limit._id)
      toast.success(t('fleet.limitDeleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const reviewFuelPurchase = async (purchase, action) => {
    if (action === 'reject') {
      setRejectTarget(purchase)
      return
    }
    try {
      await fleetAPI.validateFuelPurchase(purchase._id)
      toast.success(t('fleet.fuelValidated'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitReject = async (reason) => {
    setSaving(true)
    try {
      await fleetAPI.rejectFuelPurchase(rejectTarget._id, reason)
      toast.success(t('fleet.fuelRejected'))
      setRejectTarget(null)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const attachReceipt = async (purchase, file) => {
    if (!file) return
    const data = new FormData()
    data.append('receipt', file)
    try {
      await fleetAPI.attachFuelReceipt(purchase._id, data)
      toast.success(t('fleet.receiptAttached'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  const submitMaintenance = async (form, invoice) => {
    setSaving(true)
    try {
      const payload = { ...form, setVehicleMaintenance: form.setVehicleMaintenance ? 'true' : 'false' }
      const data = appendFormData(null, payload, { files: { invoice } })
      await fleetAPI.createMaintenanceRecord(data)
      toast.success(t('fleet.maintenanceCreated'))
      setShowMaintenanceForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitSchedule = async (form) => {
    setSaving(true)
    try {
      await fleetAPI.createMaintenanceSchedule(form)
      toast.success(t('fleet.scheduleCreated'))
      setShowScheduleForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const deleteDriver = async (driver) => {
    const ok = await confirm({ title: t('fleet.deleteDriver'), message: t('fleet.deleteDriverConfirm'), type: 'danger' })
    if (!ok) return
    try {
      await fleetAPI.deleteDriver(driver._id)
      toast.success(t('fleet.driverDeleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('fleet.saveFailed'))
    }
  }

  if (loading) return <LoadingSpinner message={t('fleet.loading')} />

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={TruckIcon}
        kicker={t('fleet.kicker')}
        title={t('fleet.title')}
        subtitle={t('fleet.subtitleShort')}
        actions={(
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="btn-secondary" title={t('common.refresh')}>
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            {primaryAction && (
              <button type="button" className="btn-primary" onClick={primaryAction.onClick}>
                <PlusIcon className="h-5 w-5" />
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      />

      <nav className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-px">
        {navGroups.map((group, groupIndex) => (
          <div key={group.id} className="flex items-center gap-1">
            {groupIndex > 0 && <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />}
            {group.items.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                  tab === item ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {t(`fleet.tabs.${item}`)}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {tab === 'overview' && <FleetDashboard dashboard={dashboard} isManager={isManager} onNavigate={setTab} />}

      {tab === 'vehicles' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setVehiclePage(1); load() } }}
              placeholder={t('fleet.searchVehicles')}
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2"
            />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setVehiclePage(1) }} className="rounded-xl border border-slate-200 px-3 py-2">
              <option value="">{t('fleet.allStatuses')}</option>
              {['available', 'assigned', 'maintenance', 'retired', 'out_of_service'].map((value) => (
                <option key={value} value={value}>{t(`fleet.status.${value}`)}</option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={() => { setVehiclePage(1); load() }}>{t('common.search')}</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>{['plateNumber', 'vehicle', 'currentMileage', 'status', 'actions'].map((key) => <th key={key} className="kicker px-6 py-3 text-start">{t(`fleet.table.${key}`)}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link to={`/fleet/vehicles/${vehicle._id}`} className="text-primary hover:underline">{vehicle.plateNumber}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{vehicle.brand} {vehicle.model}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{vehicle.currentMileage}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(vehicle.status)}`}>{t(`fleet.status.${vehicle.status}`)}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/fleet/vehicles/${vehicle._id}`} className="text-xs font-bold text-primary">{t('fleet.view')}</Link>
                          {isManager && (
                            <button type="button" className="text-xs font-bold text-slate-600" onClick={() => { setEditingVehicle(vehicle); setShowVehicleForm(true) }}>{t('common.edit')}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!vehicles.length && <p className="p-8 text-center text-sm text-slate-500">{t('fleet.noVehicles')}</p>}
          </div>
          <Pagination pagination={vehiclePagination} page={vehiclePage} setPage={setVehiclePage} />
        </section>
      )}

      {tab === 'drivers' && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <article key={driver._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{driverLabel(driver)}</h3>
                  <p className="mt-1 text-sm text-slate-500">{driver.employeeId || driver.phone || t('fleet.externalDriver')}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(driver.licenseStatus)}`}>
                  {t(`fleet.license.${driver.licenseStatus}`)}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{(driver.license?.categories || []).join(', ')}</p>
              {isManager && (
                <div className="mt-4 flex gap-3">
                  <button type="button" className="text-xs font-bold text-primary" onClick={() => { setEditingDriver(driver); setShowDriverForm(true) }}>{t('common.edit')}</button>
                  <button type="button" className="text-xs font-bold text-rose-600" onClick={() => deleteDriver(driver)}>{t('common.delete')}</button>
                </div>
              )}
            </article>
          ))}
          {!drivers.length && <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{t('fleet.noDrivers')}</p>}
        </section>
      )}

      {tab === 'assignments' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>{['vehicle', 'driver', 'period', 'status', 'actions'].map((key) => <th key={key} className="kicker px-6 py-3 text-start">{t(`fleet.table.${key}`)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{vehicleLabel(assignment.vehicle || assignment.vehicleId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{driverLabel(assignment.driver || assignment.driverId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{assignment.startDate} – {assignment.endDate || '∞'}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(assignment.status)}`}>{t(`fleet.assignmentStatus.${assignment.status}`)}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {assignment.status === 'reserved' && (
                          <button type="button" onClick={() => setAssignmentAction({ assignment, action: 'checkout' })} className="text-xs font-bold text-primary">{t('fleet.checkout')}</button>
                        )}
                        {assignment.status === 'active' && (
                          <button type="button" onClick={() => setAssignmentAction({ assignment, action: 'checkin' })} className="text-xs font-bold text-primary">{t('fleet.checkin')}</button>
                        )}
                        {isManager && assignment.status === 'reserved' && (
                          <button type="button" onClick={() => cancelAssignment(assignment)} className="text-xs font-bold text-rose-600">{t('fleet.cancel')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!assignments.length && <p className="p-8 text-center text-sm text-slate-500">{t('fleet.noAssignments')}</p>}
        </section>
      )}

      {tab === 'fuel' && (
        <section className="space-y-4">
          {isManager && (
            <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
              {['purchases', 'limits'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFuelSubTab(item)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${fuelSubTab === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  {t(`fleet.fuelSubTabs.${item}`)}
                </button>
              ))}
            </div>
          )}

          {(!isManager || fuelSubTab === 'purchases') && (
            <>
              {!isManager && !!myLimits.length && (
                <div className="grid gap-3 md:grid-cols-3">
                  {myLimits.map((limit) => (
                    <div key={limit._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
                      <p className="kicker">{limit.period} · {limit.limitType}</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{limit.limitAmount}</p>
                      <p className="mt-1 text-xs text-slate-500">{vehicleOptions.find((v) => v._id === limit.vehicleId)?.plateNumber || t('fleet.allVehicles')}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full text-start">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        {['vehicle', 'driver', 'date', 'liters', 'total', 'status', 'actions'].map((key) => (
                          <th key={key} className="kicker px-6 py-3 text-start">{t(`fleet.table.${key}`)}</th>
                        ))}
                        <th className="kicker px-6 py-3 text-end">{t('comments.title')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchases.map((purchase) => (
                        <tr key={purchase._id}>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{vehicleLabel(purchase.vehicle || purchase.vehicleId)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{driverLabel(purchase.driver || purchase.driverId)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{purchase.purchaseDate}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{purchase.liters}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{purchase.totalAmount}{purchase.flagged ? ' ⚠' : ''}</td>
                          <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(purchase.status)}`}>{t(`fleet.fuelStatus.${purchase.status}`)}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {purchase.status === 'pending_proof' && (
                                <label className="cursor-pointer text-xs font-bold text-primary">
                                  {t('fleet.attachReceipt')}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => attachReceipt(purchase, e.target.files?.[0])} />
                                </label>
                              )}
                              {isManager && purchase.status === 'submitted' && (
                                <>
                                  <button type="button" onClick={() => reviewFuelPurchase(purchase, 'validate')} className="text-xs font-bold text-primary">{t('fleet.validate')}</button>
                                  <button type="button" onClick={() => reviewFuelPurchase(purchase, 'reject')} className="text-xs font-bold text-rose-600">{t('fleet.reject')}</button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-end">
                            <button
                              type="button"
                              onClick={() => setCommentsFuelId(commentsFuelId === purchase._id ? null : purchase._id)}
                              className="text-xs font-bold text-primary"
                            >
                              {t('comments.title')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {commentsFuelId && (
                  <div className="border-t border-slate-200 p-4">
                    <RequestComments entityType="fuel_purchase" entityId={commentsFuelId} />
                  </div>
                )}
                {!purchases.length && <p className="p-8 text-center text-sm text-slate-500">{t('fleet.noPurchases')}</p>}
              </div>
            </>
          )}

          {isManager && fuelSubTab === 'limits' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>{['driver', 'vehicle', 'period', 'limit', 'effectiveFrom', 'actions'].map((key) => <th key={key} className="kicker px-6 py-3 text-start">{t(`fleet.table.${key}`)}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fuelLimits.map((limit) => (
                      <tr key={limit._id}>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{driverLabel(limit.driver || drivers.find((driver) => driver._id === limit.driverId) || limit.driverId)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{limit.vehicle?.plateNumber || vehicleOptions.find((vehicle) => vehicle._id === limit.vehicleId)?.plateNumber || t('fleet.allVehicles')}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{limit.period}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{limit.limitAmount} {limit.limitType}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{limit.effectiveFrom}</td>
                        <td className="px-6 py-4">
                          {isAdmin && <button type="button" className="text-xs font-bold text-rose-600" onClick={() => deleteFuelLimit(limit)}>{t('common.delete')}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!fuelLimits.length && <p className="p-8 text-center text-sm text-slate-500">{t('fleet.noLimits')}</p>}
            </div>
          )}
        </section>
      )}

      {tab === 'maintenance' && (
        <section className="space-y-4">
          {isManager && (
            <div className="flex justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowScheduleForm(true)}>{t('fleet.addSchedule')}</button>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.maintenanceRecords')}</h3></div>
              <ul className="divide-y divide-slate-100">
                {maintenanceRecords.map((record) => (
                  <li key={record._id} className="px-6 py-4 text-sm">
                    <p className="font-bold text-slate-900">{vehicleLabel(record.vehicle)} · {t(`fleet.maintenanceTypes.${record.type}`)}</p>
                    <p className="text-slate-500">{record.serviceDate} · {t(`fleet.maintenanceStatuses.${record.status}`)} · {record.cost ?? '—'}</p>
                  </li>
                ))}
                {!maintenanceRecords.length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noMaintenance')}</li>}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3"><h3 className="text-sm font-black">{t('fleet.maintenanceSchedules')}</h3></div>
              <ul className="divide-y divide-slate-100">
                {schedules.map((schedule) => (
                  <li key={schedule._id} className="px-6 py-4 text-sm">
                    <p className="font-bold text-slate-900">{vehicleLabel(schedule.vehicle)} · {t(`fleet.maintenanceTypes.${schedule.type}`)}</p>
                    <p className="text-slate-500">{schedule.nextDueDate || '—'} · {schedule.nextDueMileage || '—'} km</p>
                  </li>
                ))}
                {!schedules.length && <li className="p-8 text-center text-sm text-slate-500">{t('fleet.noSchedules')}</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      <VehicleFormModal open={showVehicleForm} initial={editingVehicle} saving={saving} onClose={() => { setShowVehicleForm(false); setEditingVehicle(null) }} onSubmit={submitVehicle} />
      <DriverFormModal open={showDriverForm} initial={editingDriver} saving={saving} onClose={() => { setShowDriverForm(false); setEditingDriver(null) }} onSubmit={submitDriver} />
      <AssignmentFormModal open={showAssignmentForm} vehicles={vehicleOptions} drivers={drivers} saving={saving} onClose={() => setShowAssignmentForm(false)} onSubmit={submitAssignment} />
      <AssignmentActionModal open={!!assignmentAction} action={assignmentAction?.action} assignment={assignmentAction?.assignment} saving={saving} onClose={() => setAssignmentAction(null)} onSubmit={submitAssignmentAction} />
      <FuelPurchaseFormModal open={showFuelForm} vehicles={vehicleOptions} drivers={drivers} isManager={isManager} saving={saving} onClose={() => setShowFuelForm(false)} onSubmit={submitFuelPurchase} />
      <FuelLimitFormModal open={showLimitForm} vehicles={vehicleOptions} drivers={drivers} saving={saving} onClose={() => setShowLimitForm(false)} onSubmit={submitFuelLimit} />
      <RejectReasonModal open={!!rejectTarget} saving={saving} onClose={() => setRejectTarget(null)} onSubmit={submitReject} />
      <MaintenanceFormModal open={showMaintenanceForm} vehicles={vehicleOptions} saving={saving} onClose={() => setShowMaintenanceForm(false)} onSubmit={submitMaintenance} />
      <ScheduleFormModal open={showScheduleForm} vehicles={vehicleOptions} saving={saving} onClose={() => setShowScheduleForm(false)} onSubmit={submitSchedule} />
    </div>
  )
}

function Pagination({ pagination, page, setPage }) {
  const { t } = useTranslation()
  if (!pagination || pagination.pages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>{t('fleet.pagination', { current: page, total: pagination.pages, count: pagination.total })}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">{t('common.previous')}</button>
        <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">{t('common.next')}</button>
      </div>
    </div>
  )
}
