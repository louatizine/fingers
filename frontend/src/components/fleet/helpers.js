export const emptyVehicle = {
  plateNumber: '',
  brand: '',
  model: '',
  vehicleType: 'car',
  vin: '',
  year: '',
  color: '',
  currentMileage: '',
  tankCapacityLiters: '',
  fuelType: 'diesel',
  transmission: 'manual',
  status: 'available',
  notes: '',
}

export const emptyDriver = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  employeeId: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiryDate: '',
  licenseIssueDate: '',
}

export const FUEL_TYPES = ['diesel', 'petrol', 'hybrid', 'electric', 'other']
export const TRANSMISSIONS = ['manual', 'automatic', 'other']
export const VEHICLE_TYPES = ['car', 'van', 'truck']
export const VEHICLE_STATUSES = ['available', 'assigned', 'maintenance', 'retired', 'out_of_service']
export const LICENSE_CATEGORIES = ['A', 'A1', 'B', 'BE', 'C', 'C1', 'CE', 'C1E', 'D', 'D1']
export const DOCUMENT_TYPES = ['insurance', 'technical_inspection', 'registration', 'other']
export const MAINTENANCE_TYPES = ['service', 'repair', 'tires', 'inspection', 'other']
export const MAINTENANCE_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled']

export function statusClass(status) {
  return {
    available: 'bg-emerald-50 text-emerald-700',
    assigned: 'bg-blue-50 text-blue-700',
    maintenance: 'bg-amber-50 text-amber-700',
    retired: 'bg-slate-100 text-slate-600',
    out_of_service: 'bg-rose-50 text-rose-700',
    valid: 'bg-emerald-50 text-emerald-700',
    expiring: 'bg-amber-50 text-amber-700',
    expired: 'bg-rose-50 text-rose-700',
    reserved: 'bg-blue-50 text-blue-700',
    active: 'bg-emerald-50 text-emerald-700',
    returned: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-rose-50 text-rose-700',
    submitted: 'bg-blue-50 text-blue-700',
    pending_proof: 'bg-amber-50 text-amber-700',
    validated: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    planned: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    overdue: 'bg-rose-50 text-rose-700',
    upcoming: 'bg-amber-50 text-amber-700',
  }[status] || 'bg-slate-50 text-slate-600'
}

export function vehicleLabel(vehicle, fallback = '—') {
  if (!vehicle) return fallback
  if (typeof vehicle === 'string') return vehicle
  const name = [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
  return vehicle.plateNumber ? `${vehicle.plateNumber}${name ? ` · ${name}` : ''}` : name || fallback
}

export function driverLabel(driver, fallback = '—') {
  if (!driver) return fallback
  if (typeof driver === 'string') return driver
  const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ')
  return name || fallback
}

export const VEHICLE_FORM_KEYS = [
  'plateNumber', 'brand', 'model', 'vehicleType', 'vin', 'year', 'color',
  'currentMileage', 'tankCapacityLiters', 'fuelType', 'transmission', 'status', 'notes',
]

export const DRIVER_FORM_KEYS = [
  'firstName', 'lastName', 'phone', 'email', 'employeeId',
  'licenseNumber', 'licenseCategory', 'licenseExpiryDate', 'licenseIssueDate',
]

export function pickFields(source, keys) {
  return keys.reduce((acc, key) => {
    if (source[key] !== undefined && source[key] !== null) acc[key] = source[key]
    return acc
  }, {})
}

export function appendFormData(_ignored, entries, { files = {} } = {}) {
  const data = new FormData()
  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (typeof value === 'object') return
    data.append(key, value)
  })
  Object.entries(files).forEach(([key, value]) => {
    if (!value) return
    if (value instanceof FileList) {
      Array.from(value).forEach((file) => data.append(key, file))
    } else {
      data.append(key, value)
    }
  })
  return data
}
