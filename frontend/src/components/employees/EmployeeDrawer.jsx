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
  UserGroupIcon
} from '@heroicons/react/24/outline';
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
  onActivate
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
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-[2px] transition-opacity z-40"
          onClick={onClose}
        />
      )}
      
      {/* Fluent Drawer */}
      <div className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} max-w-2xl w-full bg-white shadow-premium transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')
      }`}>
        <div className="h-full flex flex-col">
          {/* Header - High Contrast Fluent Style */}
          <div className="px-8 py-6 border-b border-brand-border flex items-center justify-between bg-brand-surface">
            <div>
              <h2 className="text-xl font-black text-brand-dark tracking-tight">
                {t('employees.detailView.title')}
              </h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                ID: {employee.employee_id || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-muted hover:text-brand-primary hover:bg-white rounded-item transition-all"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-8">
              {/* Profile Header Card */}
              <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 pb-10 border-b border-brand-border ${isRTL ? 'sm:flex-row-reverse text-right' : 'text-left'}`}>
                <div className={`h-24 w-24 rounded-card ${departmentColor || 'bg-brand-primary'} flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-primary/20 flex-shrink-0`}>
                  {getInitials(employee.first_name, employee.last_name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-brand-dark leading-tight">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-lg font-bold text-brand-primary mt-1">{employee.position}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      employee.is_active ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${employee.is_active ? 'bg-status-success' : 'bg-status-error'}`} />
                      {employee.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                    <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-brand-surface text-brand-dark border border-brand-border">
                      {employmentType.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
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

                {/* Section Divider */}
                <div className="col-span-full pt-4">
                  <h4 className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6">
                    {t('employees.detailView.additionalInfo')}
                  </h4>
                </div>

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
          <div className="px-8 py-6 border-t border-brand-border bg-brand-surface">
            <div className={`flex flex-col sm:flex-row gap-4 justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <button
                onClick={handleStatusAction}
                className={`flex-1 sm:flex-none px-8 py-3 rounded-item text-xs font-black uppercase tracking-widest transition-all ${
                  employee.is_active
                    ? 'border-2 border-status-error text-status-error hover:bg-status-error hover:text-white'
                    : 'border-2 border-status-success text-status-success hover:bg-status-success hover:text-white'
                }`}
              >
                {employee.is_active ? t('actions.deactivate') : t('actions.activate')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-8 py-3 border-2 border-brand-border rounded-item text-xs font-black uppercase tracking-widest text-brand-dark hover:bg-white transition-all"
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
      <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 px-1">
        {label}
      </label>
      <div className={`flex items-start gap-3 p-3 rounded-item bg-brand-surface group-hover:bg-white border border-transparent group-hover:border-brand-border transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
        <Icon className="h-5 w-5 text-brand-primary mt-0.5 flex-shrink-0" />
        <span className="text-sm font-bold text-brand-dark break-all">{value}</span>
      </div>
    </div>
  )
}

export default EmployeeDrawer;