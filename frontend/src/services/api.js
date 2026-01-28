import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
  deactivateUser: (id) => apiClient.delete(`/users/${id}`)
}

// Leave API
export const leaveAPI = {
  getLeaves: () => apiClient.get('/leaves'),
  getLeave: (id) => apiClient.get(`/leaves/${id}`),
  createLeave: (data) => apiClient.post('/leaves', data),
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
  rejectAdvance: (id, comment) => apiClient.post(`/salary-advances/${id}/reject`, { comment }),
  deleteAdvance: (id) => apiClient.delete(`/salary-advances/${id}`),
  getStatistics: () => apiClient.get('/salary-advances/statistics')
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
  // Attendance settings
  getAttendanceSettings: () => apiClient.get('/settings/attendance'),
  updateAttendanceSettings: (data) => apiClient.put('/settings/attendance', data)
}

// Attendance API
export const attendanceAPI = {
  getAttendance: (params) => apiClient.get('/attendance', { params }),
  createAttendance: (data) => apiClient.post('/attendance', data),
  getLastAttendance: (employeeId) => apiClient.get(`/attendance/last/${employeeId}`),
  getDailySummary: (employeeId, date) => apiClient.get(`/attendance/daily-summary/${employeeId}`, { params: { date } }),
  getAttendanceSummary: (employeeId, startDate, endDate) => 
    apiClient.get('/attendance/summary', { params: { employee_id: employeeId, start_date: startDate, end_date: endDate } }),
  exportAttendance: (params) => apiClient.get('/attendance/export', { params, responseType: 'blob' })
}

export default apiClient
