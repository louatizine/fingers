import { useState } from 'react'
import { BanknotesIcon, XMarkIcon } from '../ui/icons'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../../hooks/useDirection'

export default function CreateLoanModal({ isOpen, employee, onClose, onSubmit }) {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !employee) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!amount || Number(amount) <= 0 || !reason.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ amount, reason: reason.trim(), request_date: requestDate, target_employee_id: employee._id })
      setAmount('')
      setReason('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className={`mb-6 flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('salaryAdvances.modal.requestDate')}
            </label>
            <input
              type="date"
              required
              value={requestDate}
              onChange={(event) => setRequestDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <BanknotesIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{t('salaryAdvances.employeeLoan.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {employee.first_name} {employee.last_name} · {t('salaryAdvances.employeeLoan.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
          {t('salaryAdvances.employeeLoan.scheduleHint')}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('salaryAdvances.modal.amount')}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('salaryAdvances.modal.reason')}
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
              {submitting ? t('salaryAdvances.employeeLoan.submitting') : t('salaryAdvances.employeeLoan.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
