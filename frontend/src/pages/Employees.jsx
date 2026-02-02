import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  FunnelIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

// Hooks & API
import { useEmployees } from '../hooks/useEmployees';
import { useDirection } from '../hooks/useDirection';
import { useToast } from '../components/Toast';
import { settingsAPI, companyAPI } from '../services/api';

// Components
import EmployeeTableRow from '../components/employees/EmployeeTableRow';
import SkeletonLoader from '../components/employees/SkeletonLoader';
import EmptyState from '../components/employees/EmptyState';
import EmployeeDrawer from '../components/employees/EmployeeDrawer';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import SortableHeader from '../components/employees/SortableHeader';
import BulkActions from '../components/employees/BulkActions';

const Employees = () => {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const toast = useToast();

  // Unified State
  const [viewMode, setViewMode] = useState('directory'); // 'directory' or 'vacation'
  const [settings, setSettings] = useState({ monthlyVacationDays: 2.5, probationPeriodMonths: 3 });
  const [companies, setCompanies] = useState([]);

  const {
    filteredEmployees = [],
    loading: hookLoading,
    searchTerm,
    selectedDepartment,
    selectedStatus,
    sortConfig,
    selectedEmployees = new Set(),
    isDetailDrawerOpen,
    selectedEmployee,
    isAddModalOpen,
    formData,
    stats = { total: 0, active: 0, departments: 0, avgExperience: 0 },
    setSearchTerm,
    setSelectedDepartment,
    setSelectedStatus,
    setSelectedEmployees,
    setIsAddModalOpen,
    setFormData,
    handleSort,
    handleSelectEmployee,
    handleSelectAll,
    handleBulkDeactivate,
    handleBulkExport,
    handleCreateEmployee,
    handleDeactivate,
    handleActivate,
    handleViewDetails,
    handleCloseDrawer
  } = useEmployees();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          settingsAPI.getSettings(),
          companyAPI.getCompanies()
        ]);
        if (sRes.data?.settings) setSettings(sRes.data.settings);
        if (cRes.data?.companies) setCompanies(cRes.data.companies);
      } catch (e) {
        console.error("Initialization error", e);
      }
    };
    fetchData();
  }, []);

  // Professional Vacation Calculation Logic
  const getVacationData = useCallback((employee) => {
    if (!employee.hire_date) return { balance: 0, earned: 0, months: 0 };
    const start = new Date(employee.hire_date);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const effectiveMonths = Math.max(0, months - (settings.probationPeriodMonths || 0));
    const earned = effectiveMonths * (settings.monthlyVacationDays || 0);
    const used = employee.used_vacation_days || 0;
    return {
      months,
      earned: earned.toFixed(1),
      used,
      balance: (earned - used).toFixed(1)
    };
  }, [settings]);

  const statsConfig = useMemo(() => [
    { label: t('employees.stats.total'), value: stats.total, icon: UsersIcon, color: 'bg-indigo-500' },
    { label: t('employees.stats.active'), value: stats.active, icon: IdentificationIcon, color: 'bg-emerald-500' },
    { label: t('employees.stats.departments'), value: stats.departments, icon: BuildingOfficeIcon, color: 'bg-amber-500' },
  ], [stats, t]);

  if (hookLoading) return <div className="p-10"><SkeletonLoader /></div>;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* 1. CHIC HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase mb-2 block">
            {t('employees.workforceManagement')}
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('employees.title')}
          </h1>
          <p className="text-slate-500 mt-2 max-w-md">{t('employees.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 bg-white">
            <ArrowUpTrayIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"
          >
            <PlusIcon className="h-5 w-5 stroke-[3px]" />
            {t('employees.addButton')}
          </button>
        </div>
      </div>

      {/* 2. DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((s, i) => (
          <div key={i} className="relative group overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className={`absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] group-hover:scale-125 transition-transform duration-500 text-black`}>
               <s.icon className="w-full h-full" />
            </div>
            <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
              <s.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* 3. TABLE CONTROLS & TABS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {/* Navigation & Search Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col xl:flex-row gap-6 items-center justify-between">
          
          {/* Chic Tab Switcher */}
          <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full xl:w-auto">
            <button 
              onClick={() => setViewMode('directory')}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'directory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserGroupIcon className="h-4 w-4" />
              {t('employees.tabs.directory')}
            </button>
            <button 
              onClick={() => setViewMode('vacation')}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'vacation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {t('employees.tabs.leave')}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-1 xl:max-w-2xl">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('employees.filters.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <FunnelIcon className="h-4 w-4" />
              {t('common.filters')}
            </button>
          </div>
        </div>

        {/* 4. THE UNIFIED TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                    checked={selectedEmployees.size === filteredEmployees.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <SortableHeader 
                  className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400" 
                  label={t('employees.table.employee')} 
                  sortKey="first_name" 
                  sortConfig={sortConfig} 
                  onSort={handleSort} 
                />
                
                {viewMode === 'directory' ? (
                  <>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase text-slate-400">{t('employees.table.department')}</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase text-slate-400">{t('employees.table.contact')}</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase text-slate-400">{t('settings.employeeBalances.monthsService')}</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase text-slate-400">{t('settings.employeeBalances.earned')}</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase text-slate-400">{t('settings.employeeBalances.balance')}</th>
                  </>
                )}
                
                <th className="px-6 py-5 text-center text-xs font-bold uppercase text-slate-400">{t('employees.table.status')}</th>
                <th className="px-6 py-5 text-center text-xs font-bold uppercase text-slate-400">{t('employees.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const vac = getVacationData(emp);
                return (
                  <tr key={emp._id} className="group hover:bg-indigo-50/40 transition-all duration-200">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.has(emp._id)}
                        onChange={() => handleSelectEmployee(emp._id)}
                        className="rounded-lg border-slate-300 text-indigo-600 h-5 w-5"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-100 to-white flex items-center justify-center border border-indigo-100 text-indigo-700 font-black shadow-sm group-hover:scale-110 transition-transform">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-slate-500 font-medium">{emp.position || t('employees.defaultPosition')}</p>
                        </div>
                      </div>
                    </td>

                    {viewMode === 'directory' ? (
                      <>
                        <td className="px-6 py-4">
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{emp.department || t('employees.notAvailable')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-600">{emp.email}</p>
                          <p className="text-xs text-slate-400">{emp.phone || t('employees.noPhone')}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-slate-700">{vac.months}</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase">{t('employees.months')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-emerald-600">+{vac.earned}</td>
                        <td className="px-6 py-4">
                           <span className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${parseFloat(vac.balance) > 0 ? 'bg-indigo-600 text-white' : 'bg-rose-100 text-rose-600'}`}>
                              {vac.balance} {t('time.days')}
                           </span>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {emp.is_active ? t('employees.status.active') : t('employees.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleViewDetails(emp)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
                      >
                         <IdentificationIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODALS & DRAWER */}
      <EmployeeDrawer
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDrawer}
        employee={selectedEmployee}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateEmployee}
        companies={companies}
      />
    </div>
  );
};

export default Employees;