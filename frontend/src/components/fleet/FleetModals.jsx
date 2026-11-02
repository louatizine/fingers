import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FleetModalShell from './FleetModalShell'
import {
  DOCUMENT_TYPES,
  FUEL_TYPES,
  LICENSE_CATEGORIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  emptyDriver,
  emptyVehicle,
  vehicleLabel,
  driverLabel,
} from './helpers'

const fieldClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 font-normal focus:border-primary focus:outline-none'
const labelClass = 'space-y-1 text-sm font-bold text-slate-600'

export function VehicleFormModal({ open, initial, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyVehicle)
  const [photos, setPhotos] = useState(null)
  useEffect(() => {
    if (!open) return
    setForm({ ...emptyVehicle, ...(initial || {}) })
    setPhotos(null)
  }, [open, initial])
  if (!open) return null
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return (
    <FleetModalShell title={initial?._id ? t('fleet.editVehicle') : t('fleet.addVehicle')} onClose={onClose} wide>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form, photos)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['plateNumber', 'text', true],
            ['brand', 'text', true],
            ['model', 'text', true],
            ['vin', 'text', false],
            ['year', 'number', false],
            ['color', 'text', false],
            ['currentMileage', 'number', false],
            ['tankCapacityLiters', 'number', false],
          ].map(([key, type, required]) => (
            <label key={key} className={labelClass}>
              {t(`fleet.form.${key}`)}
              <input required={required} type={type} value={form[key] ?? ''} onChange={(e) => set(key, e.target.value)} className={fieldClass} />
            </label>
          ))}
          <label className={labelClass}>
            {t('fleet.form.vehicleType')}
            <select value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)} className={fieldClass}>
              {VEHICLE_TYPES.map((value) => <option key={value} value={value}>{t(`fleet.vehicleTypes.${value}`)}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t('fleet.form.fuelType')}
            <select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)} className={fieldClass}>
              {FUEL_TYPES.map((value) => <option key={value} value={value}>{t(`fleet.fuelTypes.${value}`)}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t('fleet.form.transmission')}
            <select value={form.transmission} onChange={(e) => set('transmission', e.target.value)} className={fieldClass}>
              {TRANSMISSIONS.map((value) => <option key={value} value={value}>{t(`fleet.transmissions.${value}`)}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t('fleet.form.status')}
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={fieldClass}>
              {VEHICLE_STATUSES.map((value) => <option key={value} value={value}>{t(`fleet.status.${value}`)}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          {t('fleet.form.notes')}
          <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} className={fieldClass} rows={2} />
        </label>
        <label className={labelClass}>
          {t('fleet.form.photos')}
          <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setPhotos(e.target.files)} className={fieldClass} />
        </label>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function DriverFormModal({ open, initial, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyDriver)
  const [licenseFile, setLicenseFile] = useState(null)
  useEffect(() => {
    if (!open) return
    const license = initial?.license || {}
    setForm({
      ...emptyDriver,
      ...(initial || {}),
      licenseNumber: license.number || initial?.licenseNumber || '',
      licenseCategory: (license.categories || []).join(',') || initial?.licenseCategory || '',
      licenseExpiryDate: license.expiryDate || initial?.licenseExpiryDate || '',
      licenseIssueDate: license.issueDate || initial?.licenseIssueDate || '',
    })
    setLicenseFile(null)
  }, [open, initial])
  if (!open) return null
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return (
    <FleetModalShell title={initial?._id ? t('fleet.editDriver') : t('fleet.addDriver')} onClose={onClose} wide>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form, licenseFile) }}>
        <div className="grid gap-4 sm:grid-cols-2">
          {['firstName', 'lastName', 'phone', 'email', 'employeeId', 'licenseNumber', 'licenseIssueDate', 'licenseExpiryDate'].map((key) => (
            <label key={key} className={labelClass}>
              {t(`fleet.form.${key}`)}
              <input
                required={['firstName', 'lastName', 'licenseNumber', 'licenseExpiryDate'].includes(key)}
                type={key.includes('Date') ? 'date' : 'text'}
                value={form[key] || ''}
                onChange={(e) => set(key, e.target.value)}
                className={fieldClass}
              />
            </label>
          ))}
          <label className={`${labelClass} sm:col-span-2`}>
            {t('fleet.form.licenseCategory')}
            <select
              required
              multiple
              value={(form.licenseCategory || '').split(',').filter(Boolean)}
              onChange={(e) => set('licenseCategory', Array.from(e.target.selectedOptions).map((option) => option.value).join(','))}
              className={`${fieldClass} min-h-[7rem]`}
            >
              {LICENSE_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <span className="text-xs font-normal text-slate-400">{t('fleet.form.multiSelectHint')}</span>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            {t('fleet.form.licenseFile')}
            <input type="file" accept="image/*,.pdf" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} className={fieldClass} />
          </label>
        </div>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function AssignmentFormModal({ open, vehicles, drivers, clients = [], saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ vehicleId: '', driverId: '', clientId: '', startDate: '', endDate: '', purpose: '' })
  useEffect(() => {
    if (open) setForm({ vehicleId: '', driverId: '', clientId: '', startDate: '', endDate: '', purpose: '' })
  }, [open])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addAssignment')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.vehicle')}</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicleLabel(vehicle)}</option>)}
        </select>
        <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.driver')}</option>
          {drivers.map((driver) => <option key={driver._id} value={driver._id}>{driverLabel(driver)}</option>)}
        </select>
        <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.client')}</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}{client.code ? ` (${client.code})` : ''}
            </option>
          ))}
        </select>
        <div className="grid gap-4 sm:grid-cols-2">
          {['startDate', 'endDate'].map((key) => (
            <input key={key} required={key === 'startDate'} type="date" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={fieldClass} />
          ))}
        </div>
        <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder={t('fleet.form.purpose')} className={fieldClass} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function ClientFormModal({ open, initial, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const empty = { name: '', code: '', contactName: '', phone: '', email: '', address: '', notes: '', isActive: true }
  const [form, setForm] = useState(empty)
  useEffect(() => {
    if (!open) return
    setForm({ ...empty, ...(initial || {}), isActive: initial?.isActive !== false })
  }, [open, initial])
  if (!open) return null
  return (
    <FleetModalShell title={initial ? t('fleet.editClient') : t('fleet.addClient')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('fleet.form.clientName')} className={fieldClass} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('fleet.form.clientCode')} className={fieldClass} />
          <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder={t('fleet.form.contactName')} className={fieldClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('fleet.form.phone')} className={fieldClass} />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('fleet.form.email')} className={fieldClass} />
        </div>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('fleet.form.address')} className={fieldClass} />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('fleet.form.notes')} rows={3} className={fieldClass} />
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          {t('fleet.form.active')}
        </label>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function AssignmentActionModal({ open, action, assignment, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ mileage: '', fuelLevel: '', conditionNotes: '' })
  const [photos, setPhotos] = useState(null)
  useEffect(() => {
    if (!open) return
    setForm({ mileage: '', fuelLevel: '', conditionNotes: '' })
    setPhotos(null)
  }, [open])
  if (!open || !assignment) return null
  return (
    <FleetModalShell title={t(`fleet.${action}`)} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">{vehicleLabel(assignment.vehicle || assignment.vehicleId)} · {driverLabel(assignment.driver || assignment.driverId)}</p>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form, photos) }}>
        <label className={labelClass}>
          {t('fleet.form.mileage')}
          <input required type="number" min="0" step="0.1" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className={fieldClass} />
        </label>
        <label className={labelClass}>
          {t('fleet.form.fuelLevel')}
          <input type="number" min="0" max="100" step="1" value={form.fuelLevel} onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })} className={fieldClass} placeholder="%" />
        </label>
        <label className={labelClass}>
          {t('fleet.form.conditionNotes')}
          <textarea value={form.conditionNotes} onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })} className={fieldClass} rows={3} />
        </label>
        <label className={labelClass}>
          {t('fleet.form.photos')}
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} className={fieldClass} />
        </label>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function FuelPurchaseFormModal({ open, vehicles, drivers, isManager, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    vehicleId: '', driverId: '', purchaseDate: new Date().toISOString().slice(0, 10),
    station: '', liters: '', pricePerLiter: '', mileageAtPump: '',
  })
  const [receipt, setReceipt] = useState(null)
  useEffect(() => {
    if (open) {
      setForm({
        vehicleId: '', driverId: '', purchaseDate: new Date().toISOString().slice(0, 10),
        station: '', liters: '', pricePerLiter: '', mileageAtPump: '',
      })
      setReceipt(null)
    }
  }, [open])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addFuelPurchase')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form, receipt) }}>
        <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.vehicle')}</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicleLabel(vehicle)}</option>)}
        </select>
        {isManager && (
          <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={fieldClass}>
            <option value="">{t('fleet.form.driver')}</option>
            {drivers.map((driver) => <option key={driver._id} value={driver._id}>{driverLabel(driver)}</option>)}
          </select>
        )}
        {['purchaseDate', 'station', 'liters', 'pricePerLiter', 'mileageAtPump'].map((key) => (
          <input
            key={key}
            required
            type={['liters', 'pricePerLiter', 'mileageAtPump'].includes(key) ? 'number' : key === 'purchaseDate' ? 'date' : 'text'}
            step="0.01"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={t(`fleet.form.${key}`)}
            className={fieldClass}
          />
        ))}
        <label className={labelClass}>
          {t('fleet.form.receipt')}
          <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className={fieldClass} />
        </label>
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function FuelLimitFormModal({ open, vehicles, drivers, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    driverId: '', vehicleId: '', period: 'month', limitType: 'money', limitAmount: '',
    effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '',
  })
  useEffect(() => {
    if (open) {
      setForm({
        driverId: '', vehicleId: '', period: 'month', limitType: 'money', limitAmount: '',
        effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '',
      })
    }
  }, [open])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addFuelLimit')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.driver')}</option>
          {drivers.map((driver) => <option key={driver._id} value={driver._id}>{driverLabel(driver)}</option>)}
        </select>
        <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.allVehicles')}</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.plateNumber}</option>)}
        </select>
        <div className="grid gap-4 sm:grid-cols-2">
          <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={fieldClass}>
            <option value="day">{t('fleet.day')}</option>
            <option value="week">{t('fleet.week')}</option>
            <option value="month">{t('fleet.month')}</option>
          </select>
          <select value={form.limitType} onChange={(e) => setForm({ ...form, limitType: e.target.value })} className={fieldClass}>
            <option value="money">{t('fleet.money')}</option>
            <option value="liters">{t('fleet.liters')}</option>
          </select>
        </div>
        <input required type="number" min="0" step="0.01" value={form.limitAmount} onChange={(e) => setForm({ ...form, limitAmount: e.target.value })} placeholder={t('fleet.limitAmount')} className={fieldClass} />
        <input required type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} className={fieldClass} />
        <input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} className={fieldClass} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function RejectReasonModal({ open, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) setReason('') }, [open])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.reject')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(reason) }}>
        <label className={labelClass}>
          {t('fleet.rejectionReason')}
          <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass} rows={4} />
        </label>
        <ModalActions saving={saving} onClose={onClose} confirmLabel={t('fleet.reject')} />
      </form>
    </FleetModalShell>
  )
}

export function DocumentFormModal({ open, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ type: 'insurance', documentNumber: '', issueDate: '', expiryDate: '', provider: '', cost: '' })
  const [file, setFile] = useState(null)
  useEffect(() => {
    if (open) {
      setForm({ type: 'insurance', documentNumber: '', issueDate: '', expiryDate: '', provider: '', cost: '' })
      setFile(null)
    }
  }, [open])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addDocument')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form, file) }}>
        <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={fieldClass}>
          {DOCUMENT_TYPES.map((value) => <option key={value} value={value}>{t(`fleet.docTypes.${value}`)}</option>)}
        </select>
        <input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder={t('fleet.form.documentNumber')} className={fieldClass} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input required type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className={fieldClass} />
          <input required type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={fieldClass} />
        </div>
        <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder={t('fleet.form.provider')} className={fieldClass} />
        <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder={t('fleet.form.cost')} className={fieldClass} />
        <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={fieldClass} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function MaintenanceFormModal({ open, vehicles, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    vehicleId: '', type: 'service', serviceDate: new Date().toISOString().slice(0, 10),
    mileage: '', cost: '', garage: '', notes: '', status: 'planned', setVehicleMaintenance: true,
  })
  const [invoice, setInvoice] = useState(null)
  useEffect(() => {
    if (open) {
      setForm({
        vehicleId: vehicles.length === 1 ? vehicles[0]._id : '',
        type: 'service',
        serviceDate: new Date().toISOString().slice(0, 10),
        mileage: '', cost: '', garage: '', notes: '', status: 'planned', setVehicleMaintenance: true,
      })
      setInvoice(null)
    }
  }, [open, vehicles])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addMaintenance')} onClose={onClose} wide>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form, invoice) }}>
        <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.vehicle')}</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicleLabel(vehicle)}</option>)}
        </select>
        <div className="grid gap-4 sm:grid-cols-2">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={fieldClass}>
            {MAINTENANCE_TYPES.map((value) => <option key={value} value={value}>{t(`fleet.maintenanceTypes.${value}`)}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fieldClass}>
            {MAINTENANCE_STATUSES.map((value) => <option key={value} value={value}>{t(`fleet.maintenanceStatuses.${value}`)}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <input required type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} className={fieldClass} />
          <input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder={t('fleet.form.mileage')} className={fieldClass} />
          <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder={t('fleet.form.cost')} className={fieldClass} />
        </div>
        <input value={form.garage} onChange={(e) => setForm({ ...form, garage: e.target.value })} placeholder={t('fleet.form.garage')} className={fieldClass} />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('fleet.form.notes')} className={fieldClass} rows={2} />
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <input type="checkbox" checked={form.setVehicleMaintenance} onChange={(e) => setForm({ ...form, setVehicleMaintenance: e.target.checked })} />
          {t('fleet.setVehicleMaintenance')}
        </label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setInvoice(e.target.files?.[0] || null)} className={fieldClass} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

export function ScheduleFormModal({ open, vehicles, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    vehicleId: '', type: 'service', nextDueDate: '', nextDueMileage: '', intervalMonths: '', intervalKm: '', notes: '',
  })
  useEffect(() => {
    if (open) {
      setForm({
        vehicleId: vehicles.length === 1 ? vehicles[0]._id : '',
        type: 'service', nextDueDate: '', nextDueMileage: '', intervalMonths: '', intervalKm: '', notes: '',
      })
    }
  }, [open, vehicles])
  if (!open) return null
  return (
    <FleetModalShell title={t('fleet.addSchedule')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={fieldClass}>
          <option value="">{t('fleet.form.vehicle')}</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicleLabel(vehicle)}</option>)}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={fieldClass}>
          {MAINTENANCE_TYPES.map((value) => <option key={value} value={value}>{t(`fleet.maintenanceTypes.${value}`)}</option>)}
        </select>
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} className={fieldClass} />
          <input type="number" min="0" value={form.nextDueMileage} onChange={(e) => setForm({ ...form, nextDueMileage: e.target.value })} placeholder={t('fleet.form.nextDueMileage')} className={fieldClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="number" min="1" value={form.intervalMonths} onChange={(e) => setForm({ ...form, intervalMonths: e.target.value })} placeholder={t('fleet.form.intervalMonths')} className={fieldClass} />
          <input type="number" min="1" value={form.intervalKm} onChange={(e) => setForm({ ...form, intervalKm: e.target.value })} placeholder={t('fleet.form.intervalKm')} className={fieldClass} />
        </div>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('fleet.form.notes')} className={fieldClass} rows={2} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </FleetModalShell>
  )
}

function ModalActions({ saving, onClose, confirmLabel }) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">{t('common.cancel')}</button>
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? t('common.saving') : (confirmLabel || t('common.save'))}</button>
    </div>
  )
}
