import { createContext, useContext, useState, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const ConfirmDialogContext = createContext()

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider')
  }
  return context
}

export const ConfirmDialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  })

  const confirm = useCallback(({
    title = 'Confirmation',
    message = 'Are you sure?',
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog {...dialogState} />
    </ConfirmDialogContext.Provider>
  )
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  type,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}) => {
  const config = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      confirmButton: 'bg-status-warning hover:bg-amber-600 focus:ring-2 focus:ring-status-warning/50'
    },
    danger: {
      icon: XCircleIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-700',
      confirmButton: 'bg-status-error hover:bg-red-700 focus:ring-2 focus:ring-status-error/50'
    },
    success: {
      icon: CheckCircleIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      confirmButton: 'bg-status-success hover:bg-green-700 focus:ring-2 focus:ring-status-success/50'
    },
    info: {
      icon: InformationCircleIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-primary',
      confirmButton: 'bg-primary hover:bg-primary-hover focus:ring-2 focus:ring-primary/50'
    }
  }

  const style = config[type] || config.warning
  const Icon = style.icon

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-sm bg-white shadow-xl border border-neutral-medium transition-all">
                <div className="p-6">
                  {/* Icon */}
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${style.iconBg}`}>
                    <Icon className={`h-6 w-6 ${style.iconColor}`} aria-hidden="true" />
                  </div>

                  {/* Title */}
                  <Dialog.Title
                    as="h3"
                    className="mt-4 text-lg font-semibold text-neutral-charcoal text-center"
                  >
                    {title}
                  </Dialog.Title>

                  {/* Message */}
                  <div className="mt-2">
                    <p className="text-sm text-neutral-dark text-center">
                      {message}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-neutral-charcoal bg-white border border-neutral-dark rounded-sm hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      onClick={onCancel}
                    >
                      {cancelText}
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-sm ${style.confirmButton} focus:outline-none transition-colors`}
                      onClick={onConfirm}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
