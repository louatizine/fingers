import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useEmployees } from '../hooks/useEmployees';
import { useDirection } from '../hooks/useDirection';

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

  const {
    filteredEmployees = [],
    companies = [],
    loading,
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

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedStatus('all');
  }, [setSearchTerm, setSelectedDepartment, setSelectedStatus]);

  const handleClearSelection = useCallback(() => {
    setSelectedEmployees(new Set());
  }, [setSelectedEmployees]);

  const hasFilters = useMemo(
    () => searchTerm || selectedDepartment !== 'all' || selectedStatus !== 'all',
    [searchTerm, selectedDepartment, selectedStatus]
  );

  const isAllSelected = useMemo(
    () => selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0,
    [selectedEmployees.size, filteredEmployees.length]
  );

  const statsConfig = useMemo(() => [
    { icon: UserGroupIcon, label: t('employees.stats.total'), value: stats.total, color: 'text-blue-600 bg-blue-50' },
    { icon: BuildingOfficeIcon, label: t('employees.stats.active'), value: stats.active, color: 'text-emerald-600 bg-emerald-50' },
    { icon: BriefcaseIcon, label: t('employees.stats.departments'), value: stats.departments, color: 'text-slate-600 bg-slate-100' },
    { icon: ClockIcon, label: t('employees.stats.avgExperience'), value: stats.avgExperience, color: 'text-amber-600 bg-amber-50' }
  ], [stats, t]);

  if (loading && filteredEmployees.length === 0) {
    return <div className="p-8"><SkeletonLoader /></div>;
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {t('employees.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t('employees.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-gradient-to-r from-blue-600 to-blue-700
              text-white text-sm font-semibold
              rounded-xl shadow-sm
              hover:shadow-md hover:-translate-y-0.5
              active:scale-95
              transition-all duration-200
            "
          >
            <PlusIcon className="h-5 w-5" />
            {t('employees.addButton')}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsConfig.map((stat, index) => (
          <div
            key={index}
            className="
              bg-white rounded-2xl border border-slate-200
              shadow-sm p-5
              hover:shadow-md hover:-translate-y-0.5
              transition-all duration-300
              flex items-center gap-4
            "
          >
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* SEARCH */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <MagnifyingGlassIcon
              className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} my-auto h-4 w-4 text-slate-400`}
            />
            <input
              type="text"
              placeholder={t('employees.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full ${isRTL ? 'pr-11' : 'pl-11'} py-2.5
                bg-slate-50 border border-slate-300
                rounded-xl text-sm font-medium
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all
              `}
            />
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedEmployees.size > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <BulkActions
              selectedCount={selectedEmployees.size}
              onDeactivate={handleBulkDeactivate}
              onExport={handleBulkExport}
              onClearSelection={handleClearSelection}
            />
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          {filteredEmployees.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onResetFilters={handleResetFilters} />
          ) : (
            <table className={`w-full table-auto ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-16 px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                    />
                  </th>

                  <SortableHeader
                    className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500"
                    label={t('employees.table.employee')}
                    sortKey="last_name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />

                  <th className="hidden md:table-cell px-4 py-4 text-xs font-bold uppercase text-slate-500">
                    {t('employees.table.department')}
                  </th>

                  <th className="hidden lg:table-cell px-4 py-4 text-xs font-bold uppercase text-slate-500">
                    {t('employees.table.contact')}
                  </th>

                  <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500 text-center">
                    {t('employees.table.status')}
                  </th>

                  <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500 text-center">
                    {t('employees.table.actions')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(employee => (
                  <EmployeeTableRow
                    key={employee._id}
                    employee={employee}
                    isSelected={selectedEmployees.has(employee._id)}
                    onSelect={handleSelectEmployee}
                    onViewDetails={handleViewDetails}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DRAWER & MODALS */}
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
