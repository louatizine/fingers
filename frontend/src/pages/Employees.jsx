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
  ArrowUpTrayIcon,
  KeyIcon,
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
import CreateAccountsModal from '../components/employees/CreateAccountsModal';
import dynLogo from '../assets/dynlogo.jpg';

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
    isCreateAccountsModalOpen,
    formData,
    stats = { total: 0, active: 0, departments: 0, avgExperience: 0 },
    setSearchTerm,
    setSelectedDepartment,
    setSelectedStatus,
    setSelectedEmployees,
    setIsAddModalOpen,
    setIsCreateAccountsModalOpen,
    setFormData,
    handleSort,
    handleSelectEmployee,
    handleSelectAll,
    handleBulkDeactivate,
    handleBulkExport,
    handleBulkCreateAccounts,
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
    { label: t('employees.stats.total'), value: stats.total, icon: UsersIcon, color: 'bg-primary-400' },
    { label: t('employees.stats.active'), value: stats.active, icon: IdentificationIcon, color: 'bg-emerald-500' },
/*     { label: t('employees.stats.departments'), value: stats.departments, icon: BuildingOfficeIcon, color: 'bg-amber-500' },
 */  ], [stats, t]);

  const [accountModalEmployees, setAccountModalEmployees] = useState([]);

  const handleOpenCreateAccounts = useCallback((specificEmployee = null) => {
    const targets = specificEmployee
      ? [specificEmployee]
      : selectedEmployees.size > 0
        ? filteredEmployees.filter((emp) => selectedEmployees.has(emp._id))
        : filteredEmployees.filter((emp) => !emp.has_web_account);

    const eligible = targets.filter((emp) => !emp.has_web_account);
    if (eligible.length === 0) {
      toast.info(t('employees.createAccounts.noEligible'));
      return;
    }

    setAccountModalEmployees(targets);
    setIsCreateAccountsModalOpen(true);
  }, [filteredEmployees, selectedEmployees, setIsCreateAccountsModalOpen, toast, t]);

  const employeesWithoutAccount = useMemo(
    () => filteredEmployees.filter((emp) => !emp.has_web_account).length,
    [filteredEmployees],
  );

  if (hookLoading) return <div className="p-10"><SkeletonLoader /></div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(74,106,173,0.12),_transparent_32%),linear-gradient(135deg,_#f8f7fc_0%,_#f4f6fb_52%,_#f9fafb_100%)] px-3 py-4 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1600px] space-y-5 animate-in fade-in duration-700">
      
      {/* 1. CHIC HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary-900 via-primary-700 to-brand-blue px-5 py-5 text-white shadow-xl shadow-primary-900/15 md:px-7 md:py-6">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute right-16 -bottom-28 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
{/*             <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-black/15">
              <img src={dynLogo} alt="Dynamix Services" className="h-full w-full object-contain" />
            </div> */}
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-primary-100">
                {t('employees.workforceManagement')}
              </span>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {t('employees.title')}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/70 md:text-base">{t('employees.subtitle')}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60 md:flex">
            <span className="h-2 w-2 rounded-full bg-brand-green shadow-[0_0_0_4px_rgba(34,177,53,0.18)]" />
            {t('employees.stats.active')}
          </div>
        </div>
   {/*      
        <div className="flex items-center gap-3">
          <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-xl transition-all border border-slate-200 bg-white">
            <ArrowUpTrayIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateAccounts()}
            disabled={employeesWithoutAccount === 0}
            className="flex items-center gap-2 px-5 py-3 border-2 border-primary-200 text-primary-600 rounded-2xl font-bold hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary-600"
            title={employeesWithoutAccount === 0 ? t('employees.createAccounts.noEligible') : undefined}
          >
            <KeyIcon className="h-5 w-5 stroke-[2.5px]" />
            {t('employees.createAccounts.action')}
            {employeesWithoutAccount > 0 && (
              <span className="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-black text-primary-600">
                {employeesWithoutAccount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary hover:shadow-xl hover:shadow-primary-200 transition-all active:scale-95"
          >
            <PlusIcon className="h-5 w-5 stroke-[3px]" />
            {t('employees.addButton')}
          </button>
        </div> */}
      </div>

      {/* 2. DASHBOARD STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {statsConfig.map((s, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/45 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className={`absolute -right-4 -top-4 h-24 w-24 text-primary opacity-[0.06] transition-transform duration-500 group-hover:scale-125`}>
               <s.icon className="w-full h-full" />
            </div>
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.color} text-white shadow-lg shadow-primary-900/10`}>
              <s.icon className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{s.label}</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* 3. TABLE CONTROLS & TABS */}
      <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-xl shadow-slate-300/30">
        
        {/* Navigation & Search Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-brand-border bg-brand-surface/45 p-4 xl:flex-row">
          
          {/* Chic Tab Switcher */}
          <div className="flex w-full rounded-xl border border-brand-border bg-white/70 p-1 shadow-sm xl:w-auto">
            <button 
              onClick={() => setViewMode('directory')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-all xl:flex-none ${viewMode === 'directory' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}
            >
              <UserGroupIcon className="h-4 w-4" />
              {t('employees.tabs.directory')}
            </button>
            <button 
              onClick={() => setViewMode('vacation')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-all xl:flex-none ${viewMode === 'vacation' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}
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
                className="w-full rounded-xl border border-brand-border bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary">
              <FunnelIcon className="h-4 w-4" />
              {t('common.filters')}
            </button>
          </div>
        </div>

        {selectedEmployees.size > 0 && (
          <div className="px-6 pt-4">
            <BulkActions
              selectedCount={selectedEmployees.size}
              onDeactivate={handleBulkDeactivate}
              onExport={handleBulkExport}
              onCreateAccounts={() => handleOpenCreateAccounts()}
              onClearSelection={() => setSelectedEmployees(new Set())}
            />
          </div>
        )}

        {/* 4. THE UNIFIED TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="w-12 px-4 py-4 text-center">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded-md border-brand-border text-primary focus:ring-primary-400"
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
                  <tr key={emp._id} className="group hover:bg-primary-50/40 transition-all duration-200">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.has(emp._id)}
                        onChange={() => handleSelectEmployee(emp._id)}
                        className="rounded-lg border-slate-300 text-primary h-5 w-5"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-100 to-white flex items-center justify-center border border-primary-100 text-primary-600 font-black shadow-sm group-hover:scale-110 transition-transform">
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
                           <span className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${parseFloat(vac.balance) > 0 ? 'bg-primary text-white' : 'bg-rose-100 text-rose-600'}`}>
                              {vac.balance} {t('time.days')}
                           </span>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {emp.is_active ? t('employees.status.active') : t('employees.status.inactive')}
                        </span>
                        {viewMode === 'directory' && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                            emp.has_web_account
                              ? 'bg-primary-50 text-primary-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {emp.has_web_account
                              ? t('employees.account.hasAccount')
                              : t('employees.account.noAccount')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleViewDetails(emp)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
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
{/*       <EmployeeDrawer
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDrawer}
        employee={selectedEmployee}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onCreateAccount={handleOpenCreateAccounts}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateEmployee}
        companies={companies}
      />

      <CreateAccountsModal
        isOpen={isCreateAccountsModalOpen}
        onClose={() => {
          setIsCreateAccountsModalOpen(false);
          setAccountModalEmployees([]);
        }}
        employees={accountModalEmployees}
        onSubmit={handleBulkCreateAccounts}
      /> */}
    </div>
    </div>
  );
};

export default Employees;