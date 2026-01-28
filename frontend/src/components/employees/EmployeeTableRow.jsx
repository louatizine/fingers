import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getEmploymentTypeBadge, getInitials } from '../../hooks/useEmployees';
import { useDirection } from '../../hooks/useDirection';

const EmployeeTableRow = memo(({ 
  employee, 
  isSelected, 
  onSelect, 
  onViewDetails, 
  onDeactivate, 
  onActivate 
}) => {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  
  const employmentType = getEmploymentTypeBadge(employee.employment_type);
  
  return (
    <tr className="group hover:bg-slate-50/80 transition-all duration-150">
      {/* Selection */}
      <td className="px-6 py-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(employee._id)}
          className="h-4 w-4 text-[#0078d4] border-slate-300 rounded focus:ring-[#0078d4] cursor-pointer"
        />
      </td>

      {/* Employee Identity - The truncate Fix */}
      <td className="px-4 py-4 min-w-0 overflow-hidden">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''} min-w-0`}>
          <div className="h-10 w-10 rounded-xl bg-[#002050] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
            {getInitials(employee.first_name, employee.last_name)}
          </div>

          <div className={`flex flex-col min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="text-sm font-bold text-slate-900 truncate">
              {employee.first_name} {employee.last_name}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase truncate">
              {employee.position}
            </div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className={`hidden md:table-cell px-4 py-4 min-w-0 ${isRTL ? 'text-right' : ''}`}>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg truncate inline-block max-w-full">
          {employee.department}
        </span>
      </td>

      {/* Contact Info - The truncate Fix */}
      <td className={`hidden lg:table-cell px-4 py-4 min-w-0 ${isRTL ? 'text-right' : ''}`}>
        <div className="flex flex-col min-w-0">
          <div className="text-sm font-medium text-slate-600 truncate">{employee.email}</div>
          {employee.phone && (
            <div className="text-xs text-slate-400 truncate">{employee.phone}</div>
          )}
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-4 text-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          employee.is_active 
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
          : 'bg-slate-50 text-slate-400 border border-slate-100'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${employee.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {employee.is_active ? t('status.active') : t('status.inactive')}
        </span>
      </td>

      {/* Actions */}
      <td className={`px-4 py-4 text-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
        <button
          onClick={() => onViewDetails(employee)}
          className="text-xs font-bold text-[#0078d4] hover:underline"
        >
          {t('common.view')}
        </button>
        
        <button
          onClick={() => employee.is_active ? onDeactivate(employee._id) : onActivate(employee._id)}
          className={`text-xs font-bold ${employee.is_active ? 'text-red-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'}`}
        >
          {employee.is_active ? t('actions.deactivate') : t('actions.activate')}
        </button>
      </td>
    </tr>
  );
});

EmployeeTableRow.displayName = 'EmployeeTableRow';

export default EmployeeTableRow;