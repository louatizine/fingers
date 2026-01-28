import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }

    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast])
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast])
  const warning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast])
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast])

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

const Toast = ({ toast, onClose }) => {
  const { message, type, duration } = toast
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
        setProgress(remaining)

        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 16) // ~60fps

      return () => clearInterval(interval)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const config = {
    success: {
      container: 'bg-white border-l-4 border-status-success shadow-lg',
      icon: CheckCircleIcon,
      iconColor: 'text-status-success',
      title: 'Success',
      titleColor: 'text-neutral-charcoal',
      textColor: 'text-neutral-dark',
      progressBar: 'bg-status-success',
      closeHover: 'hover:bg-neutral-light'
    },
    error: {
      container: 'bg-white border-l-4 border-status-error shadow-lg',
      icon: XCircleIcon,
      iconColor: 'text-status-error',
      title: 'Error',
      titleColor: 'text-neutral-charcoal',
      textColor: 'text-neutral-dark',
      progressBar: 'bg-status-error',
      closeHover: 'hover:bg-neutral-light'
    },
    warning: {
      container: 'bg-white border-l-4 border-status-warning shadow-lg',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-status-warning',
      title: 'Warning',
      titleColor: 'text-neutral-charcoal',
      textColor: 'text-neutral-dark',
      progressBar: 'bg-status-warning',
      closeHover: 'hover:bg-neutral-light'
    },
    info: {
      container: 'bg-white border-l-4 border-primary shadow-lg',
      icon: InformationCircleIcon,
      iconColor: 'text-primary',
      title: 'Information',
      titleColor: 'text-neutral-charcoal',
      textColor: 'text-neutral-dark',
      progressBar: 'bg-primary',
      closeHover: 'hover:bg-neutral-light'
    }
  }

  const style = config[type] || config.info
  const Icon = style.icon

  return (
    <div
      className={`
        ${style.container}
        rounded-sm border border-neutral-medium
        pointer-events-auto
        transform transition-all duration-300 ease-out
        ${isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-slideIn'
        }
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${style.iconColor}`} aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${style.titleColor}`}>
              {style.title}
            </p>
            <p className={`text-sm ${style.textColor} mt-0.5 break-words`}>
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 
              text-neutral-dark hover:text-neutral-charcoal
              ${style.closeHover}
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/50
              rounded-sm p-1
            `}
            aria-label="Dismiss notification"
            type="button"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="h-1 bg-neutral-light overflow-hidden">
          <div
            className={`h-full ${style.progressBar} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Time remaining"
          />
        </div>
      )}
    </div>
  )
}
