import { createContext, useContext, useState, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline'

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
      themeColor: 'amber',
      btnClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
    },
    danger: {
      icon: XCircleIcon,
      themeColor: 'rose',
      btnClass: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
    },
    success: {
      icon: CheckCircleIcon,
      themeColor: 'emerald',
      btnClass: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
    },
    info: {
      icon: InformationCircleIcon,
      themeColor: 'indigo',
      btnClass: 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
    }
  }

  const style = config[type] || config.warning
  const Icon = style.icon

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onCancel}>
        {/* Modern Glass Overlay */}
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border border-slate-100 transition-all">
                
                <div className="flex items-start gap-5">
                  {/* Chic Icon Container */}
                  <div className={`flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-${style.themeColor}-50`}>
                    <Icon className={`h-7 w-7 text-${style.themeColor}-600`} aria-hidden="true" />
                  </div>

                  <div className="flex-1">
                    {/* Title with Executive Tracking */}
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-black text-slate-900 tracking-tight"
                    >
                      {title}
                    </Dialog.Title>

                    {/* Sophisticated Message Styling */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Refined Actions */}
                <div className="mt-10 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`
                      flex-1 inline-flex justify-center items-center px-6 py-3.5 
                      text-sm font-bold text-white rounded-xl shadow-lg
                      transition-all duration-200 active:scale-95
                      ${style.btnClass}
                    `}
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="
                      flex-1 inline-flex justify-center items-center px-6 py-3.5 
                      text-sm font-bold text-slate-500 bg-slate-50 rounded-xl
                      hover:bg-slate-100 hover:text-slate-700 transition-all duration-200
                    "
                    onClick={onCancel}
                  >
                    {cancelText}
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