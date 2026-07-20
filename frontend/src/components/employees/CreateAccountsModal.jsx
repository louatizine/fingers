import React, { useMemo, useState } from 'react';
import { XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../hooks/useDirection';

export default function CreateAccountsModal({
  isOpen,
  onClose,
  employees,
  onSubmit,
}) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const eligible = useMemo(
    () => employees.filter((emp) => !emp.has_web_account),
    [employees],
  );

  const alreadyHaveAccount = useMemo(
    () => employees.filter((emp) => emp.has_web_account),
    [employees],
  );

  const validate = () => {
    const next = {};
    if (!password) next.password = t('validation.required');
    else if (password.length < 8) next.password = t('validation.passwordLength');
    if (password !== confirmPassword) next.confirmPassword = t('employees.createAccounts.passwordMismatch');
    if (eligible.length === 0) next.general = t('employees.createAccounts.noEligible');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        user_ids: eligible.map((emp) => emp._id),
        password,
      });
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch {
      // toast handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <KeyIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('employees.createAccounts.title')}</h3>
                <p className="text-xs text-slate-500">{t('employees.createAccounts.subtitle')}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {errors.general && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.general}</p>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {t('employees.createAccounts.selectedEmployees')} ({eligible.length})
              </p>
              <ul className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
                {eligible.length === 0 ? (
                  <li className="text-sm text-slate-500">{t('employees.createAccounts.noEligible')}</li>
                ) : (
                  eligible.map((emp) => (
                    <li key={emp._id} className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="font-medium text-slate-800">
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-xs text-slate-400">{emp.email}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {alreadyHaveAccount.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                {t('employees.createAccounts.skippedCount', { count: alreadyHaveAccount.length })}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('employees.createAccounts.password')} *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t('employees.createAccounts.confirmPassword')} *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <p className="text-xs text-slate-500">{t('employees.createAccounts.passwordHint')}</p>

            <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || eligible.length === 0}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? t('common.creating') : t('employees.createAccounts.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
