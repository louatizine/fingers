import React, { useEffect, useState } from 'react';
import { leaveAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  CheckIcon, 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon
} from '../components/ui/icons';
import PageHeader from '../components/ui/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { BRAND } from '../config/brand';

export default function Leaves() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const isRTL = i18n.language === 'ar';

  // State Management
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [vacationBalance, setVacationBalance] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadLeaves();
    if (user.role === 'employee') {
      loadVacationBalance();
    }
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await leaveAPI.getLeaves();
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVacationBalance = async () => {
    try {
      const response = await settingsAPI.calculateEmployeeBalance(user._id);
      setVacationBalance(response.data.balance || 0);
    } catch (error) {
      setVacationBalance(user.vacation_balance || 0);
    }
  };

  // Create New Leave Request
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Calculate days between start_date and end_date (inclusive)
    const { start_date, end_date, ...rest } = formData;
    let days = 0;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    if (!days || days < 1) {
      toast.error(t('leaves.messages.invalid_days'));
      return;
    }
    try {
      const response = await leaveAPI.createLeave({ ...rest, start_date, end_date, days });
      if (response.data.insufficient_balance) {
        toast.warning(t('leaves.messages.insufficient_warning', {
          available: Number(response.data.current_balance || 0).toFixed(2),
          requested: response.data.requested_days
        }));
      } else {
        toast.success(t('leaves.messages.success'));
      }
      setShowModal(false);
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      loadLeaves();
      loadVacationBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'));
    }
  };

  const handleApprove = async (id) => {
    const confirmed = await confirm({
      title: t('actions.approve'),
      message: t('leaves.messages.confirm_approve'),
      type: 'success',
    });
    if (!confirmed) return;
    try {
      await leaveAPI.approveLeave(id, '');
      loadLeaves();
      toast.success(t('leaves.messages.approved'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'));
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error(t('salaryAdvances.messages.reasonRequired'));
      return;
    }
    try {
      await leaveAPI.rejectLeave(selectedLeaveId, rejectReason);
      loadLeaves();
      toast.success(t('leaves.messages.rejected'));
      setShowRejectModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'));
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = leaves.slice(indexOfFirstItem, indexOfLastItem);

  // ✅ Chic Action Buttons (same functionality)
  const ActionButtons = ({ leave }) => {
    if (leave.status !== 'pending') return null;

    return (
      <div className={`flex gap-2 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
        {/* Approve */}
        <button
          onClick={() => handleApprove(leave._id)}
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
          aria-label={t('actions.approve')}
          title={t('actions.approve')}
        >
          <span
            className="
              absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent
            "
          />
          <CheckIcon className="relative h-5 w-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
        </button>

        {/* Reject */}
        <button
          onClick={() => { setSelectedLeaveId(leave._id); setShowRejectModal(true); }}
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
          aria-label={t('actions.reject')}
          title={t('actions.reject')}
        >
          <span
            className="
              absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent
            "
          />
          <XMarkIcon className="relative h-5 w-5 text-rose-600 group-hover:text-rose-700 transition-colors" />
        </button>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message={t('leaves.loading')} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <PageHeader
        icon={CalendarDaysIcon}
        kicker={t('leaves.table.title')}
        title={t('leaves.title')}
        subtitle={t('leaves.subtitle')}
        actions={
          user.role === 'employee' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              <span>{t('leaves.new_request')}</span>
            </button>
          )
        }
      />

      {/* Balance Cards (Employee Only) */}
      {user.role === 'employee' && (
        <div className={`w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 ${isRTL ? 'direction-rtl' : ''}`}>
          {[
            { label: t('leaves.annual_leave'), val: vacationBalance, accent: BRAND.violet },
            { label: t('leaves.sick_leave'), val: user.leave_balance?.sick || 0, accent: BRAND.green },
            { label: t('leaves.unpaid_leave'), val: user.leave_balance?.unpaid || 0, accent: BRAND.yellow }
          ].map((card, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: card.accent }} aria-hidden="true" />
              <p className="kicker">{card.label}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl font-light leading-none tabular-nums text-slate-900">{Number(card.val).toFixed(1)}</span>
                <span className="font-display text-lg italic text-slate-400">{t('time.days')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Container */}
      <div className="w-full mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Table Header */}
        <div className="flex flex-col gap-1 border-b border-slate-200 px-6 py-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <h2 className="font-display text-2xl font-medium text-slate-900">{t('leaves.table.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('leaves.table.subtitle')}</p>
          </div>
          <span className="kicker w-fit tabular-nums">
            {leaves.length} {t('leaves.table.title')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {user.role !== 'employee' && <th className="kicker px-6 py-3.5 text-start">{t('leaves.table.employee')}</th>}
                <th className="kicker px-6 py-3.5 text-start">{t('leaves.table.type')}</th>
                <th className="kicker px-6 py-3.5 text-start">{t('leaves.table.dates')}</th>
                <th className="kicker px-6 py-3.5 text-start">{t('leaves.table.days')}</th>
                <th className="kicker px-6 py-3.5 text-start">{t('leaves.table.status')}</th>
                {user.role !== 'employee' && <th className="kicker px-6 py-3.5 text-end">{t('leaves.table.actions')}</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {currentLeaves.map((leave) => (
                <tr key={leave._id} className="transition-colors duration-200 hover:bg-primary-50/30">
                  {user.role !== 'employee' && (
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{leave.user_name}</div>
                      <div className="text-xs font-medium text-primary uppercase mt-0.5">
                        Bal: {leave.user_vacation_balance?.toFixed(1)}
                      </div>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700 capitalize">{t(`leaveTypes.${leave.leave_type}`)}</span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600">{leave.start_date} → {leave.end_date}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium tabular-nums text-slate-900">
                      {leave.days}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={leave.status} />
                  </td>

                  {user.role !== 'employee' && (
                    <td className="px-6 py-4 text-end">
                      <ActionButtons leave={leave} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {leaves.length > 0 ? (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <div className="text-sm font-medium text-slate-500">
              {t('leaves.table.showing', { from: indexOfFirstItem + 1, to: Math.min(indexOfLastItem, leaves.length), total: leaves.length })}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-primary-300 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-9 w-9 rounded-lg font-semibold text-sm transition-all ${
                    currentPage === i + 1
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-primary-300 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-8 py-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <CalendarDaysIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t('leaves.table.noRequests')}</h3>
            <p className="text-slate-500">{t('leaves.table.noRequestsDesc')}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showModal || showRejectModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setShowRejectModal(false); }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-xl font-bold text-slate-900">
                {showModal ? t('leaves.modal.title') : t('actions.reject')}
              </h3>
              <button
                onClick={() => { setShowModal(false); setShowRejectModal(false); }}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={showModal ? handleSubmit : (e) => { e.preventDefault(); handleRejectSubmit(); }}>
              <div className="space-y-4">
                {showModal ? (
                  <>
                    <div className={`grid grid-cols-2 gap-3 ${isRTL ? 'direction-rtl' : ''}`}>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-slate-500">{t('leaves.modal.startDate')}</label>
                        <input
                          type="date"
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          value={formData.start_date}
                          onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-slate-500">{t('leaves.modal.endDate')}</label>
                        <input
                          type="date"
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          value={formData.end_date}
                          onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">{t('leaves.modal.leaveType')}</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none"
                        value={formData.leave_type}
                        onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                      >
                        <option value="annual">{t('leaveTypes.annual')}</option>
                        <option value="sick">{t('leaveTypes.sick')}</option>
                        <option value="unpaid">{t('leaveTypes.unpaid')}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">{t('leaves.modal.reason')}</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        placeholder={t('leaves.modal.reasonPlaceholder')}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">{t('leaves.messages.rejection_reason')}</p>
                    <textarea
                      rows={4}
                      required
                      className="w-full bg-rose-50/50 border border-rose-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder={t('leaves.modal.rejectionReasonPlaceholder')}
                    />
                  </div>
                )}
              </div>

              <div className={`flex gap-3 mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setShowRejectModal(false); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md ${
                    showRejectModal
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                      : 'bg-primary hover:bg-primary-600 focus:ring-primary'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  {showModal ? t('leaves.modal.submitButton') : t('actions.reject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
