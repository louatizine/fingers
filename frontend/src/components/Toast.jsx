import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    if (duration > 0) setTimeout(() => removeToast(id), duration)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const api = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    removeToast
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-6 right-6 z-[9999] space-y-4 w-full max-w-[380px] pointer-events-none">
    {toasts.map(toast => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
)

const Toast = ({ toast, onClose }) => {
  const { message, type, duration } = toast
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        setProgress(Math.max(0, 100 - (elapsed / duration) * 100))
      }, 16)
      return () => clearInterval(interval)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 400) // Match transition duration
  }

  const themes = {
    success: {
      bg: 'bg-emerald-50/90',
      border: 'border-emerald-100',
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-500',
      title: 'Success',
      accent: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-rose-50/90',
      border: 'border-rose-100',
      icon: XCircleIcon,
      iconColor: 'text-rose-500',
      title: 'Action Failed',
      accent: 'bg-rose-500'
    },
    warning: {
      bg: 'bg-amber-50/90',
      border: 'border-amber-100',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-amber-500',
      title: 'Attention',
      accent: 'bg-amber-500'
    },
    info: {
      bg: 'bg-slate-900/95', // Chic dark mode for info
      border: 'border-slate-800',
      icon: InformationCircleIcon,
      iconColor: 'text-indigo-400',
      title: 'Notification',
      accent: 'bg-indigo-500',
      text: 'text-slate-300',
      titleText: 'text-white'
    }
  }

  const theme = themes[type] || themes.info

  return (
    <div
      className={`
        relative overflow-hidden pointer-events-auto
        ${theme.bg} ${theme.border} border backdrop-blur-md
        rounded-[1.5rem] shadow-[0_15px_30px_rgba(0,0,0,0.08)]
        transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
        ${isExiting ? 'translate-x-12 opacity-0 scale-90' : 'translate-x-0 opacity-100 animate-in slide-in-from-right-8'}
      `}
    >
      {/* Subtle Progress Bar at the Top */}
      {duration > 0 && (
        <div 
          className={`absolute top-0 left-0 h-[3px] ${theme.accent} transition-all duration-100 ease-linear opacity-40`}
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="p-5 flex items-start gap-4">
        <div className={`flex-shrink-0 p-2 rounded-xl bg-white/50 shadow-sm`}>
          <theme.icon className={`h-6 w-6 ${theme.iconColor}`} />
        </div>

        <div className="flex-1 pt-0.5">
          <h4 className={`text-sm font-black uppercase tracking-widest ${theme.titleText || 'text-slate-900'}`}>
            {theme.title}
          </h4>
          <p className={`text-sm font-medium mt-1 leading-relaxed ${theme.text || 'text-slate-600'}`}>
            {message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors group"
        >
          <XMarkIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
        </button>
      </div>
    </div>
  )
}