import React from 'react';
import { 
  XMarkIcon,
  PhoneIcon, 
  EnvelopeIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CakeIcon,
  UserGroupIcon,
  KeyIcon,
  BanknotesIcon,
} from '../ui/icons';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../hooks/useDirection';
import { 
  getInitials, 
  getDepartmentColor, 
  getEmploymentTypeBadge, 
  calculateYearsOfService 
} from '../../hooks/useEmployees';

const EmployeeDrawer = ({ 
  isOpen, 
  onClose, 
  employee, 
  onDeactivate, 
  onActivate,
  onCreateAccount,
  onCreateLoan,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  
  if (!employee) return null;
  
  const employmentType = getEmploymentTypeBadge(employee.employment_type);
  const departmentColor = getDepartmentColor(employee.department);
  
  const handleStatusAction = () => {
    if (employee.is_active) {
      onDeactivate(employee._id);
    } else {
      onActivate(employee._id);
    }
    onClose();
  };

  return (
    <>
      {/* Power Apps Style Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Fluent Drawer */}
      <div className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} z-50 w-full max-w-2xl transform bg-gradient-to-b from-white via-white to-slate-50 shadow-2xl shadow-slate-900/20 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')
      }`}>
        <div className="h-full flex flex-col">
          {/* Header - High Contrast Fluent Style */}
          <div className="relative flex items-center justify-between overflow-hidden border-b border-slate-200/80 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-6 py-5 sm:px-8">
            <div className="pointer-events-none absolute -top-20 end-8 h-36 w-36 rounded-full bg-blue-200/30 blur-3xl" aria-hidden="true" />
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-500">
                {t('employees.workforceManagement')}
              </p>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {t('employees.detailView.title')}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {employee.employee_id || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="relative rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-500 shadow-sm transition-all hover:border-primary-200 hover:bg-white hover:text-primary"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 sm:p-8">
              {/* Profile Header Card */}
              <div className={`relative mb-8 flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 sm:flex-row sm:items-start ${isRTL ? 'sm:flex-row-reverse text-right' : 'text-left'}`}>
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary-100/50 blur-2xl" aria-hidden="true" />
                <div className={`relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl ${departmentColor || 'bg-brand-primary'} text-3xl font-black text-white shadow-lg shadow-primary-200/50 ring-4 ring-white`}>
                  {getInitials(employee.first_name, employee.last_name)}
                </div>
                <div className="relative min-w-0 flex-1">
                  <h3 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="mt-1 text-base font-bold text-primary">{employee.position || t('employees.defaultPosition')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                      employee.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${employee.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {employee.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      {employmentType.label}
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                      employee.has_web_account
                        ? 'bg-primary-50 text-primary-600 border border-primary-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {employee.has_web_account
                        ? t('employees.account.hasAccount')
                        : t('employees.account.noAccount')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('employees.detailView.additionalInfo')}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem 
                  icon={EnvelopeIcon} 
                  label="Email" 
                  value={employee.email} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={PhoneIcon} 
                  label={t('employees.detailView.phone')} 
                  value={employee.phone || 'N/A'} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={BuildingOffice2Icon} 
                  label={t('employees.detailView.department')} 
                  value={employee.department || 'N/A'} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={UserGroupIcon} 
                  label={t('employees.detailView.role')} 
                  value={<span className="capitalize">{employee.role}</span>} 
                  isRTL={isRTL} 
                />

                <DetailItem 
                  icon={CalendarIcon} 
                  label={t('employees.detailView.hireDate')} 
                  value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={ClockIcon} 
                  label={t('employees.detailView.yearsOfService')} 
                  value={calculateYearsOfService(employee.hire_date)} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={CakeIcon} 
                  label={t('employees.detailView.birthday')} 
                  value={employee.birthday ? new Date(employee.birthday).toLocaleDateString() : 'N/A'} 
                  isRTL={isRTL} 
                />
                <DetailItem 
                  icon={MapPinIcon} 
                  label={t('employees.detailView.address')} 
                  value={employee.address || 'N/A'} 
                  isRTL={isRTL} 
                  fullWidth
                />
              </div>
            </div>
          </div>
          
          {/* Footer - Solid Neutral Bar */}
          <div className="border-t border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur sm:px-8">
            <div className={`flex flex-col sm:flex-row gap-4 justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div className={`flex flex-col sm:flex-row gap-4 flex-1 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                {!employee.has_web_account && onCreateAccount && (
                  <button
                    type="button"
                    onClick={() => onCreateAccount(employee)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-primary-600 transition-all hover:bg-primary hover:text-white sm:flex-none"
                  >
                    <KeyIcon className="h-4 w-4 stroke-[2.5px]" />
                    {t('employees.createAccounts.action')}
                  </button>
                )}
                {onCreateLoan && (
                  <button
                    type="button"
                    onClick={() => onCreateLoan(employee)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white sm:flex-none"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                    {t('salaryAdvances.employeeLoan.action')}
                  </button>
                )}
                <button
                  onClick={handleStatusAction}
                  className={`flex-1 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all sm:flex-none ${
                    employee.is_active
                      ? 'border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white'
                      : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  {employee.is_active ? t('actions.deactivate') : t('actions.activate')}
                </button>
              </div>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Reusable Detail Component to maintain consistency
function DetailItem({ icon: Icon, label, value, isRTL, fullWidth }) {
  return (
    <div className={`${fullWidth ? 'col-span-full' : ''} group`}>
      <label className="mb-1 block px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </label>
      <div className={`flex min-h-[50px] items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all group-hover:-translate-y-px group-hover:border-primary-200 group-hover:shadow-md ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="break-all pt-1 text-sm font-bold text-slate-700">{value}</span>
      </div>
    </div>
  )
}

export default EmployeeDrawer;