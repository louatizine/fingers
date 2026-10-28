import { createContext, useContext, useState, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon 
} from './ui/icons'

const ConfirmDialogContext = createContext()

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmDialogProvider')
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
    message = 'Are you sure you want to proceed?',
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
      wrap: 'bg-[#FDF6D6] text-[#7A5C00]',
      confirm: 'bg-brand-yellow text-slate-900 hover:bg-[#e3bc12]',
    },
    danger: {
      icon: XCircleIcon,
      wrap: 'bg-[#FCEBEE] text-brand-red',
      confirm: 'bg-brand-red text-white hover:bg-[#b40320]',
    },
    success: {
      icon: CheckCircleIcon,
      wrap: 'bg-[#EAF7EC] text-[#17802a]',
      confirm: 'bg-brand-green text-white hover:bg-[#1a962c]',
    },
    info: {
      icon: InformationCircleIcon,
      wrap: 'bg-primary-50 text-primary',
      confirm: 'bg-primary text-white hover:bg-primary-600',
    },
  }

  const style = config[type] || config.warning
  const Icon = style.icon

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto font-sans">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-8 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-8 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-all">
                <div className="flex items-start gap-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.wrap}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="flex-1">
                    <Dialog.Title as="h3" className="font-display text-xl font-medium tracking-tight text-slate-900">
                      {title}
                    </Dialog.Title>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button type="button" className="btn-secondary" onClick={onCancel}>
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`btn ${style.confirm}`}
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}