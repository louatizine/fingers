import { useState, useEffect, useCallback, useMemo } from 'react';
import { userAPI, companyAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useDebounce } from './useDebounce';
import { useAuth } from '../context/AuthContext';

function getInitialFormData(user) {
  return {
    employee_id: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    company_id: user?.company_id || '',
    department: '',
    position: '',
    phone: '',
    hire_date: '',
    employment_type: 'full_time',
    address: '',
    birthday: ''
  };
}

export const useEmployees = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  // State
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData(user));

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort when dependencies change
  useEffect(() => {
    filterAndSortEmployees();
  }, [employees, debouncedSearchTerm, selectedDepartment, selectedStatus, sortConfig]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [employeesRes, companiesRes] = await Promise.all([
        userAPI.getUsers(),
        companyAPI.getCompanies()
      ]);
      
      setEmployees(employeesRes.data.users);
      setCompanies(companiesRes.data.companies);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err);
      toast.error(err.response?.data?.error || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterAndSortEmployees = useCallback(() => {
    let filtered = [...employees];

    // Apply filters
    if (debouncedSearchTerm) {
      filtered = filtered.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(emp => 
        selectedStatus === 'active' ? emp.is_active : !emp.is_active
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'hire_date') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEmployees(filtered);
  }, [employees, debouncedSearchTerm, selectedDepartment, selectedStatus, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleSelectEmployee = useCallback((id) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp._id)));
    }
  }, [filteredEmployees, selectedEmployees.size]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedEmployees.size === 0) return;

    const confirmed = await confirm({
      title: 'Deactivate Employees',
      message: `Are you sure you want to deactivate ${selectedEmployees.size} employee(s)?`,
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const promises = Array.from(selectedEmployees).map(id => 
        userAPI.deactivateUser(id)
      );
      await Promise.all(promises);
      
      setSelectedEmployees(new Set());
      await loadData();
      toast.success(`${selectedEmployees.size} employee(s) deactivated successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate employees');
    }
  }, [selectedEmployees, confirm, loadData, toast]);

  const handleBulkExport = useCallback(async () => {
    if (selectedEmployees.size === 0) {
      toast.info('No employees selected for export');
      return;
    }

    try {
      const response = await userAPI.exportUsers(Array.from(selectedEmployees));
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export completed successfully');
    } catch (err) {
      toast.error('Failed to export employees');
    }
  }, [selectedEmployees, toast]);

  const handleCreateEmployee = useCallback(async (data) => {
    try {
      await userAPI.createUser(data);
      setIsAddModalOpen(false);
      setFormData(getInitialFormData(user));
      await loadData();
      toast.success('Employee created successfully');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create employee';
      toast.error(errorMessage);
      throw err;
    }
  }, [user, loadData, toast]);

  const handleDeactivate = useCallback(async (id) => {
    const confirmed = await confirm({
      title: 'Deactivate Employee',
      message: 'Are you sure you want to deactivate this employee?',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await userAPI.deactivateUser(id);
      await loadData();
      toast.success('Employee deactivated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate employee');
    }
  }, [confirm, loadData, toast]);

  const handleActivate = useCallback(async (id) => {
    const confirmed = await confirm({
      title: 'Activate Employee',
      message: 'Are you sure you want to activate this employee?',
      type: 'success'
    });

    if (!confirmed) return;

    try {
      await userAPI.activateUser(id);
      await loadData();
      toast.success('Employee activated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to activate employee');
    }
  }, [confirm, loadData, toast]);

  const handleViewDetails = useCallback((employee) => {
    setSelectedEmployee(employee);
    setIsDetailDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDetailDrawerOpen(false);
    setSelectedEmployee(null);
  }, []);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    departments: new Set(employees.map(e => e.department)).size,
    avgExperience: '4.2 years'
  }), [employees]);

  return {
    // State
    employees,
    filteredEmployees,
    companies,
    loading,
    error,
    searchTerm,
    selectedDepartment,
    selectedStatus,
    sortConfig,
    selectedEmployees,
    isDetailDrawerOpen,
    selectedEmployee,
    isAddModalOpen,
    formData,
    stats,

    // Setters
    setSearchTerm,
    setSelectedDepartment,
    setSelectedStatus,
    setSelectedEmployees,
    setIsAddModalOpen,
    setFormData,
    setSelectedEmployee,
    setIsDetailDrawerOpen,

    // Handlers
    handleSort,
    handleSelectEmployee,
    handleSelectAll,
    handleBulkDeactivate,
    handleBulkExport,
    handleCreateEmployee,
    handleDeactivate,
    handleActivate,
    handleViewDetails,
    handleCloseDrawer,
    loadData
  };
};

// Helper functions
export const getEmploymentTypeBadge = (type) => {
  const types = {
    full_time: { label: 'Full Time', color: 'bg-green-100 text-green-800' },
    part_time: { label: 'Part Time', color: 'bg-blue-100 text-blue-800' },
    contract: { label: 'Contract', color: 'bg-purple-100 text-purple-800' },
    intern: { label: 'Intern', color: 'bg-yellow-100 text-yellow-800' }
  };
  return types[type] || { label: 'Full Time', color: 'bg-green-100 text-green-800' };
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getDepartmentColor = (department) => {
  const colors = {
    'Engineering': 'bg-blue-500',
    'Sales': 'bg-green-500',
    'Marketing': 'bg-purple-500',
    'Human Resource': 'bg-pink-500',
    'Finance': 'bg-yellow-500',
    'Operations': 'bg-indigo-500',
    'Management': 'bg-red-500'
  };
  return colors[department] || 'bg-gray-500';
};

export const calculateYearsOfService = (hireDate) => {
  if (!hireDate) return 'N/A';
  const hire = new Date(hireDate);
  const today = new Date();
  const years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    return years - 1;
  }
  
  return `${years} ${years === 1 ? 'Year' : 'Years'}`;
};
