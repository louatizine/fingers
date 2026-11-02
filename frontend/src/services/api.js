import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me')
}

// User API
export const userAPI = {
  getUsers: () => apiClient.get('/users'),
  getUser: (id) => apiClient.get(`/users/${id}`),
  createUser: (data) => apiClient.post('/users', data),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  activateUser: (id) => apiClient.post(`/users/${id}/activate`),
  deactivateUser: (id) => apiClient.delete(`/users/${id}`),
  createAccounts: (data) => apiClient.post('/users/create-accounts', data),
}

// Leave API
export const leaveAPI = {
  getLeaves: () => apiClient.get('/leaves'),
  getLeave: (id) => apiClient.get(`/leaves/${id}`),
  downloadAttachment: (id) => apiClient.get(`/leaves/${id}/attachment`, { responseType: 'blob' }),
  createLeave: (data) => data instanceof FormData
    ? apiClient.post('/leaves', data, { headers: { 'Content-Type': undefined } })
    : apiClient.post('/leaves', data),
  approveLeave: (id, comment) => apiClient.post(`/leaves/${id}/approve`, { comment }),
  rejectLeave: (id, comment) => apiClient.post(`/leaves/${id}/reject`, { comment }),
  deleteLeave: (id) => apiClient.delete(`/leaves/${id}`),
  getStatistics: () => apiClient.get('/leaves/statistics')
}

// Salary Advance API
export const salaryAdvanceAPI = {
  getAdvances: () => apiClient.get('/salary-advances'),
  getAdvance: (id) => apiClient.get(`/salary-advances/${id}`),
  createAdvance: (data) => apiClient.post('/salary-advances', data),
  approveAdvance: (id, comment) => apiClient.post(`/salary-advances/${id}/approve`, { comment }),
  updatePayment: (id, month, paid) => apiClient.post(`/salary-advances/${id}/payments`, { month, paid }),
  rejectAdvance: (id, comment) => apiClient.post(`/salary-advances/${id}/reject`, { comment }),
  deleteAdvance: (id) => apiClient.delete(`/salary-advances/${id}`),
  getStatistics: () => apiClient.get('/salary-advances/statistics')
}

export const fleetAPI = {
  getDashboard: () => apiClient.get('/fleet/dashboard'),
  getVehicles: (params) => apiClient.get('/fleet/vehicles', { params }),
  getVehicle: (id) => apiClient.get(`/fleet/vehicles/${id}`),
  getVehicleHistory: (id) => apiClient.get(`/fleet/vehicles/${id}/history`),
  createVehicle: (data) => apiClient.post('/fleet/vehicles', data, { headers: { 'Content-Type': undefined } }),
  updateVehicle: (id, data) => apiClient.put(`/fleet/vehicles/${id}`, data, { headers: { 'Content-Type': undefined } }),
  deleteVehicle: (id) => apiClient.delete(`/fleet/vehicles/${id}`),
  getVehicleDocuments: (id) => apiClient.get(`/fleet/vehicles/${id}/documents`),
  createVehicleDocument: (id, data) => apiClient.post(`/fleet/vehicles/${id}/documents`, data, { headers: { 'Content-Type': undefined } }),
  deleteVehicleDocument: (id) => apiClient.delete(`/fleet/documents/${id}`),
  getDrivers: (params) => apiClient.get('/fleet/drivers', { params }),
  createDriver: (data) => apiClient.post('/fleet/drivers', data, { headers: { 'Content-Type': undefined } }),
  updateDriver: (id, data) => apiClient.put(`/fleet/drivers/${id}`, data, { headers: { 'Content-Type': undefined } }),
  deleteDriver: (id) => apiClient.delete(`/fleet/drivers/${id}`),
  getClients: (params) => apiClient.get('/fleet/clients', { params }),
  createClient: (data) => apiClient.post('/fleet/clients', data),
  updateClient: (id, data) => apiClient.put(`/fleet/clients/${id}`, data),
  deleteClient: (id) => apiClient.delete(`/fleet/clients/${id}`),
  getAssignments: (params) => apiClient.get('/fleet/assignments', { params }),
  getMyAssignments: (params) => apiClient.get('/fleet/assignments/mine', { params }),
  createAssignment: (data) => apiClient.post('/fleet/assignments', data),
  cancelAssignment: (id) => apiClient.post(`/fleet/assignments/${id}/cancel`),
  checkout: (id, data) => apiClient.post(`/fleet/assignments/${id}/checkout`, data, { headers: { 'Content-Type': undefined } }),
  checkin: (id, data) => apiClient.post(`/fleet/assignments/${id}/checkin`, data, { headers: { 'Content-Type': undefined } }),
  getFuelLimits: () => apiClient.get('/fleet/fuel/limits'),
  getMyFuelLimits: () => apiClient.get('/fleet/fuel/limits/mine'),
  createFuelLimit: (data) => apiClient.post('/fleet/fuel/limits', data),
  updateFuelLimit: (id, data) => apiClient.put(`/fleet/fuel/limits/${id}`, data),
  deleteFuelLimit: (id) => apiClient.delete(`/fleet/fuel/limits/${id}`),
  getFuelPurchases: (params) => apiClient.get('/fleet/fuel/purchases', { params }),
  createFuelPurchase: (data) => apiClient.post('/fleet/fuel/purchases', data, { headers: { 'Content-Type': undefined } }),
  attachFuelReceipt: (id, data) => apiClient.post(`/fleet/fuel/purchases/${id}/receipt`, data, { headers: { 'Content-Type': undefined } }),
  validateFuelPurchase: (id) => apiClient.post(`/fleet/fuel/purchases/${id}/validate`),
  rejectFuelPurchase: (id, reason) => apiClient.post(`/fleet/fuel/purchases/${id}/reject`, { reason }),
  getMaintenanceRecords: (params) => apiClient.get('/fleet/maintenance/records', { params }),
  createMaintenanceRecord: (data) => apiClient.post('/fleet/maintenance/records', data, { headers: { 'Content-Type': undefined } }),
  updateMaintenanceRecord: (id, data) => apiClient.put(`/fleet/maintenance/records/${id}`, data, { headers: { 'Content-Type': undefined } }),
  deleteMaintenanceRecord: (id) => apiClient.delete(`/fleet/maintenance/records/${id}`),
  getMaintenanceSchedules: (params) => apiClient.get('/fleet/maintenance/schedules', { params }),
  createMaintenanceSchedule: (data) => apiClient.post('/fleet/maintenance/schedules', data),
  deleteMaintenanceSchedule: (id) => apiClient.delete(`/fleet/maintenance/schedules/${id}`),
}

// Project API
export const projectAPI = {
  getProjects: () => apiClient.get('/projects'),
  getProject: (id) => apiClient.get(`/projects/${id}`),
  createProject: (data) => apiClient.post('/projects', data),
  updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),
  assignEmployee: (projectId, userId) => apiClient.post(`/projects/${projectId}/assign/${userId}`),
  removeEmployee: (projectId, userId) => apiClient.post(`/projects/${projectId}/remove/${userId}`),
  assignUser: (projectId, userId) => apiClient.post(`/projects/${projectId}/assign/${userId}`)
}

// Company API
export const companyAPI = {
  getCompanies: () => apiClient.get('/companies'),
  getCompany: (id) => apiClient.get(`/companies/${id}`),
  createCompany: (data) => apiClient.post('/companies', data),
  updateCompany: (id, data) => apiClient.put(`/companies/${id}`, data),
  deleteCompany: (id) => apiClient.delete(`/companies/${id}`)
}

// Dashboard API
export const dashboardAPI = {
  getStatistics: () => apiClient.get('/dashboard/statistics'),
  getPendingApprovals: () => apiClient.get('/dashboard/pending-approvals')
}

// Notification API
export const notificationAPI = {
  getSmtpSettings: () => apiClient.get('/notifications/smtp-settings'),
  updateSmtpSettings: (data) => apiClient.post('/notifications/smtp-settings', data),
  testEmail: (email) => apiClient.post('/notifications/test-email', { test_email: email })
}

// Settings API
export const settingsAPI = {
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.put('/settings', data),
  recalculateAllBalances: () => apiClient.post('/settings/recalculate-balances'),
  getEmployeeVacations: () => apiClient.get('/settings/employee-vacations'),
  calculateEmployeeBalance: (employeeId) => apiClient.get(`/settings/calculate-employee/${employeeId}`),
  getAttendanceSettings: () => apiClient.get('/settings/attendance'),
  updateAttendanceSettings: (data) => apiClient.put('/settings/attendance', data)
}

// Holidays API
export const holidaysAPI = {
  getReligiousHolidays: (year) => apiClient.get('/holidays/religious', { params: { year } }),
  createReligiousHoliday: (data) => apiClient.post('/holidays/religious', data),
  updateReligiousHoliday: (id, data) => apiClient.put(`/holidays/religious/${id}`, data),
  deleteReligiousHoliday: (id) => apiClient.delete(`/holidays/religious/${id}`),
}

export const departmentAPI = {
  getDepartments: (params) => apiClient.get('/departments', { params }),
  createDepartment: (data) => apiClient.post('/departments', data),
  updateDepartment: (id, data) => apiClient.put(`/departments/${id}`, data),
  deleteDepartment: (id) => apiClient.delete(`/departments/${id}`),
}

export const calendarAPI = {
  getTeamAbsences: (params) => apiClient.get('/calendar/team-absences', { params }),
}

export const auditAPI = {
  getLogs: (params) => apiClient.get('/audit', { params }),
}

export const workedHoursAPI = {
  getEntries: (params) => apiClient.get('/worked-hours', { params }),
  getMission: (params) => apiClient.get('/worked-hours/mission', { params }),
  createEntry: (data) => apiClient.post('/worked-hours', data, { headers: { 'Content-Type': undefined } }),
  updateEntry: (id, data) => apiClient.put(`/worked-hours/${id}`, data, { headers: { 'Content-Type': undefined } }),
  approveEntry: (id) => apiClient.post(`/worked-hours/${id}/approve`),
  rejectEntry: (id, reason) => apiClient.post(`/worked-hours/${id}/reject`, { reason }),
  deleteEntry: (id) => apiClient.delete(`/worked-hours/${id}`),
  downloadAttachment: (id) => apiClient.get(`/worked-hours/${id}/attachment`, { responseType: 'blob' }),
}

export const commentAPI = {
  getComments: (entityType, entityId) => apiClient.get(`/comments/${entityType}/${entityId}`),
  postComment: (entityType, entityId, body) => apiClient.post(`/comments/${entityType}/${entityId}`, { body }),
}

// Attendance API
export const attendanceAPI = {
  getAttendance: (params) => apiClient.get('/attendance', { params }),
  createAttendance: (data) => apiClient.post('/attendance', data),
  getLastAttendance: (employeeId) => apiClient.get(`/attendance/last/${employeeId}`),
  getDailySummary: (employeeId, date) => apiClient.get(`/attendance/daily-summary/${employeeId}`, { params: { date } }),
  getAttendanceSummary: (employeeId, startDate, endDate) =>
    apiClient.get('/attendance/summary', { params: { employee_id: employeeId, start_date: startDate, end_date: endDate } }),
  getDailyAttendance: (date, config = {}) =>
    apiClient.get('/attendance/daily', { params: { date }, ...config }),
  exportAttendance: (params) => apiClient.get('/attendance/export', { params, responseType: 'blob' })
}

export default apiClient
