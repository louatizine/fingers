import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from './ui/icons'
import { XMarkIcon } from './ui/icons'

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
  <div className="pointer-events-none fixed top-6 end-6 z-[9999] w-full max-w-[380px] space-y-4">
    {toasts.map(toast => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
)

const Toast = ({ toast, onClose }) => {
  const { t } = useTranslation()
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
      bg: 'bg-white',
      border: 'border-slate-200',
      icon: CheckCircleIcon,
      iconColor: 'text-brand-green',
      title: t('toast.success'),
      accent: 'bg-brand-green'
    },
    error: {
      bg: 'bg-white',
      border: 'border-slate-200',
      icon: XCircleIcon,
      iconColor: 'text-brand-red',
      title: t('toast.error'),
      accent: 'bg-brand-red'
    },
    warning: {
      bg: 'bg-white',
      border: 'border-slate-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-[#C89600]',
      title: t('toast.warning'),
      accent: 'bg-brand-yellow'
    },
    info: {
      bg: 'bg-white',
      border: 'border-slate-200',
      icon: InformationCircleIcon,
      iconColor: 'text-brand-blue',
      title: t('toast.info'),
      accent: 'bg-brand-blue'
    }
  }

  const theme = themes[type] || themes.info

  return (
    <div
      className={`
        relative overflow-hidden pointer-events-auto
        ${theme.bg} ${theme.border} border
        rounded-xl shadow-lg
        transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
        ${isExiting ? 'translate-x-12 opacity-0 scale-90' : 'translate-x-0 opacity-100 animate-in slide-in-from-right-8'}
      `}
    >
      {/* Subtle Progress Bar at the Top */}
      {duration > 0 && (
        <div 
          className={`absolute bottom-0 left-0 h-[3px] ${theme.accent} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex items-start gap-3.5 p-4">
        <theme.icon className={`h-6 w-6 shrink-0 ${theme.iconColor}`} />

        <div className="flex-1 pt-0.5">
          <h4 className="kicker !text-slate-500">
            {theme.title}
          </h4>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
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