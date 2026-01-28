import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { ConfirmDialogProvider } from './components/ConfirmDialog'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Leaves from './pages/Leaves'
import SalaryAdvances from './pages/SalaryAdvances'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Attendance from './pages/Attendance'
import FingerprintManagement from './pages/FingerprintManagement'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0078d4]"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const { user } = useAuth()

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <Router>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Employees /></ProtectedRoute>} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="salary-advances" element={<SalaryAdvances />} />
              <Route path="projects" element={<ProtectedRoute allowedRoles={['admin', 'supervisor','employee']}><Projects /></ProtectedRoute>} />
              <Route path="attendance" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Attendance /></ProtectedRoute>} />
              <Route path="fingerprint" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><FingerprintManagement /></ProtectedRoute>} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['supervisor']}><Settings /></ProtectedRoute>} />
             </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ConfirmDialogProvider>
    </ToastProvider>
  )
}

export default App
