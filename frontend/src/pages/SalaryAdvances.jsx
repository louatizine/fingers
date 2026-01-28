import { useEffect, useState } from 'react'
import { salaryAdvanceAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { useTranslation } from 'react-i18next'
import {
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function SalaryAdvances() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()

  const [advances, setAdvances] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ amount: '', reason: '' })
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadAdvances()
  }, [])

  const loadAdvances = async () => {
    setLoading(true)
    try {
      const res = await salaryAdvanceAPI.getAdvances()
      setAdvances(res.data.salary_advances)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(advances.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAdvances = advances.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
    } else {
      let startPage = Math.max(1, currentPage - 2)
      let endPage = Math.min(totalPages, currentPage + 2)
      if (currentPage <= 3) endPage = maxPagesToShow
      if (currentPage >= totalPages - 2) startPage = totalPages - maxPagesToShow + 1
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)
    }
    return pageNumbers
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await salaryAdvanceAPI.createAdvance(formData)
      toast.success(t('salaryAdvances.messages.createSuccess'))
      setShowModal(false)
      setFormData({ amount: '', reason: '' })
      loadAdvances()
    } catch {
      toast.error(t('salaryAdvances.messages.createFailed'))
    }
  }

  const handleApprove = async (id) => {
    const confirmed = await confirm({
      title: t('actions.approve'),
      message: t('salaryAdvances.messages.confirmApprove'),
      type: 'success',
      confirmText: t('actions.approve'),
      cancelText: t('common.cancel')
    })
    if (!confirmed) return
    try {
      setActionLoading(true)
      await salaryAdvanceAPI.approveAdvance(id, '')
      toast.success(t('salaryAdvances.messages.approved'))
      loadAdvances()
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (item) => {
    setSelectedAdvance(item)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error(t('salaryAdvances.messages.reasonRequired'))
      return
    }
    try {
      setActionLoading(true)
      await salaryAdvanceAPI.rejectAdvance(selectedAdvance._id, rejectReason)
      toast.success(t('salaryAdvances.messages.rejected'))
      setShowRejectModal(false)
      loadAdvances()
    } catch {
      toast.error(t('salaryAdvances.messages.rejectFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const StatusBadge = ({ status }) => {
    const map = {
      approved: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      rejected: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
      pending: 'bg-amber-500/10 text-amber-600 ring-amber-500/20'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${map[status]}`}>
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-600' : status === 'rejected' ? 'bg-rose-600' : 'bg-amber-600'}`} />
        {t(`status.${status}`, status)}
      </span>
    )
  }

  // ✅ Chic Modern Action Buttons (component)
  const ActionButtons = ({ item }) => {
    if (item.status !== 'pending') return null

    return (
      <div className="flex justify-end items-center gap-3">
        {/* Approve */}
        <button
          onClick={() => handleApprove(item._id)}
          className="
            group relative inline-flex items-center justify-center
            h-10 w-10 rounded-2xl
            bg-white/80 backdrop-blur
            border border-emerald-200/70
            shadow-[0_10px_25px_rgba(16,185,129,0.10)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,185,129,0.18)]
            active:translate-y-0 active:scale-[0.98]
            focus:outline-none focus:ring-4 focus:ring-emerald-200/40
          "
          title={t('actions.approve')}
        >
          <span className="
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent
          " />
          <CheckIcon className="relative h-5 w-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
        </button>

        {/* Reject */}
        <button
          onClick={() => openRejectModal(item)}
          className="
            group relative inline-flex items-center justify-center
            h-10 w-10 rounded-2xl
            bg-white/80 backdrop-blur
            border border-rose-200/70
            shadow-[0_10px_25px_rgba(244,63,94,0.10)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(244,63,94,0.18)]
            active:translate-y-0 active:scale-[0.98]
            focus:outline-none focus:ring-4 focus:ring-rose-200/40
          "
          title={t('actions.reject')}
        >
          <span className="
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent
          " />
          <XMarkIcon className="relative h-5 w-5 text-rose-600 group-hover:text-rose-700 transition-colors" />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin opacity-20" />
        <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide">Refining your view...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="relative group">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('salaryAdvances.title')}
            </h1>
            <p className="mt-2 text-lg text-slate-500 font-medium">
              {t('salaryAdvances.subtitle')}
            </p>
          </div>

          {user.role === 'employee' && (
            <button
              onClick={() => setShowModal(true)}
              className="relative group overflow-hidden bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <PlusIcon className="h-5 w-5 z-10" />
              <span className="z-10">{t('salaryAdvances.newRequest')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Total Requests:</span>
          <span className="text-xs font-black text-slate-900">{advances.length}</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-slate-400 uppercase">Items / Page</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[10, 20, 50].map(val => (
              <button
                key={val}
                onClick={() => { setItemsPerPage(val); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${itemsPerPage === val ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {user.role !== 'employee' && (
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t('salaryAdvances.table.employee')}
                  </th>
                )}
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {t('salaryAdvances.table.amount')}
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {t('salaryAdvances.table.reason')}
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {t('salaryAdvances.table.date')}
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {t('salaryAdvances.table.status')}
                </th>
                {user.role !== 'employee' && (
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t('salaryAdvances.table.actions')}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {currentAdvances.map((item) => (
                <tr key={item._id} className="group hover:bg-slate-50/50 transition-colors">
                  {user.role !== 'employee' && (
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 text-sm">{item.user_name}</div>
                    </td>
                  )}

                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <BanknotesIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-black text-slate-900">
                        {item.amount}{' '}
                        <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                          {t('currency.dinar')}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-600 font-medium max-w-[240px] truncate leading-relaxed">
                      {item.reason}
                    </p>
                  </td>

                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>

                  <td className="px-8 py-5">
                    <StatusBadge status={item.status} />
                  </td>

                  {user.role !== 'employee' && (
                    <td className="px-8 py-5 text-right">
                      <ActionButtons item={item} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200">
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-none"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex gap-1 px-4">
              {getPageNumbers().map(n => (
                <button
                  key={n}
                  onClick={() => handlePageChange(n)}
                  className={`h-10 w-10 rounded-lg font-semibold text-sm transition-all ${
                    currentPage === n
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-none"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 sm:mt-0">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}

      {/* Floating Action Modal Styling */}
      {(showModal || showRejectModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => { setShowModal(false); setShowRejectModal(false) }}
          />

          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {showModal ? t('salaryAdvances.modal.title') : t('salaryAdvances.rejectModal.title')}
                </h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                  Action Required
                </p>
              </div>

              <button
                onClick={() => { setShowModal(false); setShowRejectModal(false) }}
                className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={showModal ? handleSubmit : (e) => { e.preventDefault(); handleRejectSubmit() }}
            >
              <div className="space-y-6">
                {showRejectModal ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">
                        Item to Reject
                      </p>
                      <p className="font-bold text-rose-900">
                        {selectedAdvance?.user_name} - {selectedAdvance?.amount} {t('currency.dinar')}
                      </p>
                    </div>

                    <textarea
                      required
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-rose-100 transition-all placeholder:text-slate-300"
                      rows={4}
                      placeholder={t('salaryAdvances.rejectModal.reasonPlaceholder')}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        {t('salaryAdvances.modal.amount')}
                      </label>

                      <div className="relative">
                        <BanknotesIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <input
                          type="number"
                          required
                          className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                          value={formData.amount}
                          onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        {t('salaryAdvances.modal.reason')}
                      </label>

                      <textarea
                        required
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                        rows={4}
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setShowRejectModal(false) }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-[2] px-6 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${
                    showRejectModal ? 'bg-rose-600 shadow-rose-200' : 'bg-blue-600 shadow-blue-200'
                  }`}
                >
                  {showRejectModal ? t('salaryAdvances.rejectModal.confirmButton') : t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
