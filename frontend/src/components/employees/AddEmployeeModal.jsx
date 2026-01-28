import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection } from '../../hooks/useDirection';

const AddEmployeeModal = ({ isOpen, onClose, formData, setFormData, onSubmit, companies }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isRTL } = useDirection();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = t('validation.required');
    if (!formData.last_name.trim()) newErrors.last_name = t('validation.required');
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.passwordLength');
    }
    if (!formData.department) newErrors.department = t('validation.required');
    if (!formData.position) newErrors.position = t('validation.required');
    if (user?.role === 'admin' && !formData.company_id) newErrors.company_id = t('validation.required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Power Apps Backdrop */}
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
        
        {/* Fluent Modal Card */}
        <div className="inline-block align-bottom bg-white rounded-card text-left overflow-hidden shadow-premium transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-brand-border">
          
          {/* Header - Solid Surface Style */}
          <div className="bg-brand-surface px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-brand-dark tracking-tight">
                {t('employees.modal.title')}
              </h3>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{t('branding.subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-muted hover:text-brand-primary hover:bg-white rounded-item transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-8 py-6 space-y-5">
              
              {/* Name Section */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${isRTL ? 'rtl' : ''}`}>
                <InputGroup
                  label={t('employees.modal.firstName')}
                  required
                  error={errors.first_name}
                >
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={inputClass(errors.first_name, isRTL)}
                    placeholder="John"
                  />
                </InputGroup>
                
                <InputGroup
                  label={t('employees.modal.lastName')}
                  required
                  error={errors.last_name}
                >
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={inputClass(errors.last_name, isRTL)}
                    placeholder="Doe"
                  />
                </InputGroup>
              </div>

              {/* Security Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label={t('employees.modal.email')} required error={errors.email}>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass(errors.email, isRTL)}
                    placeholder="john.doe@company.com"
                  />
                </InputGroup>

                <InputGroup label={t('employees.modal.password')} required error={errors.password}>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClass(errors.password, isRTL)}
                    placeholder="••••••••"
                  />
                </InputGroup>
              </div>

              <div className="h-px bg-brand-border w-full my-2" />

              {/* Professional Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label={t('employees.modal.phone')}>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass(null, isRTL)}
                  />
                </InputGroup>

                <InputGroup label={t('employees.modal.role')}>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={inputClass(null, isRTL)}
                  >
                    <option value="employee">{t('employees.roles.employee')}</option>
                    <option value="supervisor">{t('employees.roles.supervisor')}</option>
                    <option value="admin">{t('employees.roles.admin')}</option>
                  </select>
                </InputGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label={t('employees.modal.department')} required error={errors.department}>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={inputClass(errors.department, isRTL)}
                  >
                    <option value="">{t('employees.modal.selectDepartment')}</option>
                    <option value="Engineering">{t('employees.departments.engineering')}</option>
                    <option value="Sales">{t('employees.departments.sales')}</option>
                    <option value="Marketing">{t('employees.departments.marketing')}</option>
                    <option value="Human Resource">{t('employees.departments.hr')}</option>
                    <option value="Finance">{t('employees.departments.finance')}</option>
                  </select>
                </InputGroup>

                <InputGroup label={t('employees.modal.position')} required error={errors.position}>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={inputClass(errors.position, isRTL)}
                  />
                </InputGroup>
              </div>

              {user?.role === 'admin' && (
                <InputGroup label={t('employees.modal.company')} required error={errors.company_id}>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className={inputClass(errors.company_id, isRTL)}
                  >
                    <option value="">{t('employees.modal.selectCompany')}</option>
                    {companies?.map((company) => (
                      <option key={company._id} value={company._id}>{company.name}</option>
                    ))}
                  </select>
                </InputGroup>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 bg-brand-surface border-t border-brand-border flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2.5 border-2 border-brand-border rounded-item text-xs font-black uppercase tracking-widest text-brand-dark hover:bg-white transition-all disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-primary border-2 border-brand-primary rounded-item text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {submitting ? t('common.creating') : t('employees.modal.createButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Internal Helpers to keep the JSX clean
const InputGroup = ({ label, children, required, error }) => (
  <div>
    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 px-1">
      {label} {required && <span className="text-status-error">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-[10px] font-bold text-status-error uppercase tracking-tighter">{error}</p>
    )}
  </div>
);

const inputClass = (error, isRTL) => `
  block w-full border-2 rounded-item py-2.5 px-4 text-sm font-bold text-brand-dark 
  transition-all duration-200 outline-none
  ${error ? 'border-status-error/50 bg-status-error/5' : 'border-brand-border bg-brand-surface/50 focus:bg-white focus:border-brand-primary'}
  ${isRTL ? 'text-right' : 'text-left'}
`;

export default AddEmployeeModal;