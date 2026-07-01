import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient, { userAPI, attendanceAPI } from '../services/api';
import { 
  ClockIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalToday = () => formatDateInput(new Date());

const resolveAttendanceEmployeeId = (currentUser, employeeList = []) => {
  if (!currentUser) return '';

  // Admin/supervisor accounts without a device profile should pick an employee manually
  const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'supervisor';
  if (isPrivileged && !currentUser.device_user_id && !currentUser.has_fingerprint) {
    return '';
  }

  const preferredId =
    currentUser.attendance_employee_id ||
    currentUser.employee_id ||
    '';

  if (preferredId && employeeList.some((emp) => emp.employee_id === preferredId)) {
    return preferredId;
  }

  if (currentUser.device_user_id) {
    const byDevice = employeeList.find(
      (emp) => String(emp.device_user_id) === String(currentUser.device_user_id)
    );
    if (byDevice) return byDevice.employee_id;
  }

  if (currentUser.email) {
    const byEmail = employeeList.find(
      (emp) => emp.email?.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (byEmail) return byEmail.employee_id;
  }

  const byName = employeeList.find(
    (emp) =>
      emp.first_name === currentUser.first_name &&
      emp.last_name === currentUser.last_name
  );
  if (byName) return byName.employee_id;

  return preferredId;
};

const parseDeviceTimestamp = (timestamp) => {
  if (!timestamp) return null;
  const raw = String(timestamp).replace('Z', '').split('+')[0].split('.')[0];
  const [datePart, timePart = '00:00:00'] = raw.split('T');
  if (!datePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  return { year, month, day, hour, minute, second, datePart, timePart };
};

const formatTime = (timestamp) => {
  const parts = parseDeviceTimestamp(timestamp);
  if (!parts) return 'N/A';
  const hh = String(parts.hour).padStart(2, '0');
  const mm = String(parts.minute).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getLast6MonthsRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 6);
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(now),
  };
};

const getDatePresets = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const last6 = new Date(now);
  last6.setMonth(last6.getMonth() - 6);
  const ytd = new Date(now.getFullYear(), 0, 1);

  return {
    today: { startDate: formatDateInput(now), endDate: formatDateInput(now) },
    last6Months: { startDate: formatDateInput(last6), endDate: formatDateInput(now) },
    last30Days: { startDate: formatDateInput(last30), endDate: formatDateInput(now) },
    thisMonth: { startDate: formatDateInput(startOfMonth), endDate: formatDateInput(now) },
    yearToDate: { startDate: formatDateInput(ytd), endDate: formatDateInput(now) },
  };
};

const getDefaultDateRange = getLast6MonthsRange;

function DatePresetBar({ activePreset, onSelect, t }) {
  const presets = [
    { id: 'today', label: t('attendance:presets.today') },
    { id: 'last6Months', label: t('attendance:presets.last6Months') },
    { id: 'last30Days', label: t('attendance:presets.last30Days') },
    { id: 'thisMonth', label: t('attendance:presets.thisMonth') },
    { id: 'yearToDate', label: t('attendance:presets.yearToDate') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activePreset === preset.id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

function EmployeeSelect({
  value,
  onChange,
  employees,
  isRTL,
  t,
  name = 'employeeId',
  allowAll = true,
  required = false,
}) {
  return (
    <div className="relative">
      <UserGroupIcon
        className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none`}
      />
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none cursor-pointer`}
      >
        {allowAll && <option value="">{t('attendance:filters.allEmployees')}</option>}
        {!allowAll && <option value="">{t('attendance:filters.selectEmployee')}</option>}
        {employees.map((emp) => (
          <option key={emp.employee_id} value={emp.employee_id}>
            {emp.first_name} {emp.last_name}
            {emp.department ? ` (${emp.department})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Attendance Management Page - Modern Design
 */
function Attendance() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';
  const isAdmin = user?.role === 'admin';
  const canSelectEmployee = user?.role === 'admin' || user?.role === 'supervisor';
  const defaultDates = getDefaultDateRange();
  
  // --- State ---
  const [activeTab, setActiveTab] = useState('summary');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncInfo, setSyncInfo] = useState(null);
  const [activeDatePreset, setActiveDatePreset] = useState('last6Months');
  const [summaryDatePreset, setSummaryDatePreset] = useState('last6Months');
  const [filters, setFilters] = useState({
    employeeId: '',
    ...defaultDates,
  });
  
  const [summaryFilters, setSummaryFilters] = useState({
    employeeId: '',
    ...defaultDates,
  });

  // --- Effects ---
  useEffect(() => {
    const today = getLocalToday();
    setFilters((prev) => (prev.endDate < today ? { ...prev, endDate: today } : prev));
    setSummaryFilters((prev) => (prev.endDate < today ? { ...prev, endDate: today } : prev));
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const resolvedEmployeeId = resolveAttendanceEmployeeId(user, employees);

    if (canSelectEmployee) {
      if (!employees.length) {
        fetchEmployees();
      } else if (resolvedEmployeeId && !summaryFilters.employeeId) {
        setSummaryFilters((prev) => ({ ...prev, employeeId: resolvedEmployeeId }));
        setFilters((prev) => ({ ...prev, employeeId: resolvedEmployeeId }));
      }
    } else if (resolvedEmployeeId) {
      setFilters((prev) => ({ ...prev, employeeId: resolvedEmployeeId }));
      setSummaryFilters((prev) => ({ ...prev, employeeId: resolvedEmployeeId }));
    }
  }, [authLoading, user, canSelectEmployee, employees]);

  useEffect(() => {
    if (activeTab === 'userStats') {
      fetchUserStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (authLoading || !summaryFilters.employeeId) return;
    if (activeTab === 'summary') {
      fetchAttendanceSummary();
    }
  }, [authLoading, activeTab, summaryFilters.employeeId, summaryFilters.startDate, summaryFilters.endDate]);

  useEffect(() => {
    fetchSyncInfo();
    const interval = setInterval(fetchSyncInfo, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab !== 'summary' || !summaryFilters.employeeId) return;

    const today = getLocalToday();
    const todaySummary = attendanceSummary?.daily_summaries?.find((d) => d.date === today);
    const needsRefresh = !todaySummary?.has_records;

    if (!needsRefresh) return;

    const interval = setInterval(() => {
      fetchSyncInfo();
      fetchAttendanceSummary();
    }, 180_000);

    return () => clearInterval(interval);
  }, [activeTab, summaryFilters.employeeId, attendanceSummary?.daily_summaries]);

  // --- Logic ---
  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getUsers();
      const list = (response.data.users || []).filter((u) => u.is_active !== false);
      list.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      );
      setEmployees(list);

      const resolvedEmployeeId = resolveAttendanceEmployeeId(user, list);
      if (resolvedEmployeeId) {
        setSummaryFilters((prev) =>
          prev.employeeId ? prev : { ...prev, employeeId: resolvedEmployeeId }
        );
        setFilters((prev) =>
          prev.employeeId ? prev : { ...prev, employeeId: resolvedEmployeeId }
        );
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSyncInfo = async () => {
    try {
      const response = await apiClient.get('/device-sync/info');
      if (response.data.success) {
        setSyncInfo(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching sync info:', error);
    }
  };

  const fetchAttendanceSummary = async () => {
    if (!summaryFilters.employeeId) {
      return;
    }

    setSummaryLoading(true);
    try {
      const response = await attendanceAPI.getAttendanceSummary(
        summaryFilters.employeeId,
        summaryFilters.startDate,
        summaryFilters.endDate
      );

      if (response.data.success) {
        setAttendanceSummary(response.data.data);
      } else {
        setAttendanceSummary(null);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error.response?.data || error.message);
      setAttendanceSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const response = await apiClient.get('/attendance/user-stats', { params });

      if (response.data.success) {
        setUserStats(response.data.user_stats || []);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const triggerDeviceSync = async () => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const response = await apiClient.post('/device-sync/trigger');

      if (response.data.success) {
        setSyncStatus({ type: 'success', message: t('attendance:sync.started') });

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await apiClient.get('/device-sync/status');

            if (statusRes.data.success && statusRes.data.status) {
              const status = statusRes.data.status;

              if (!status.running && status.last_result) {
                clearInterval(pollInterval);
                setSyncLoading(false);

                if (status.last_result.success) {
                  setSyncStatus({
                    type: 'success',
                    message: t('attendance:sync.completed'),
                  });

                  setTimeout(() => {
                    fetchAttendanceSummary();
                    fetchSyncInfo();
                    if (activeTab === 'userStats') fetchUserStats();
                  }, 1000);
                } else {
                  setSyncStatus({
                    type: 'error',
                    message: `${t('attendance:sync.failed')}: ${status.last_result.error || 'Unknown error'}`,
                  });
                }
              }
            }
          } catch (err) {
            console.error('Error polling sync status:', err);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(pollInterval);
          setSyncLoading(false);
          setSyncStatus((prev) =>
            prev?.type === 'success' && prev?.message === t('attendance:sync.started')
              ? { type: 'warning', message: t('attendance:sync.timeout') }
              : prev
          );
        }, 300000);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      setSyncStatus({
        type: 'error',
        message: error.response?.data?.error || t('attendance:sync.failed'),
      });
      setSyncLoading(false);
    }
  };

  const applyDatePreset = (presetId, target = 'logs') => {
    const presets = getDatePresets();
    const range = presets[presetId];
    if (!range) return;

    if (target === 'summary') {
      setSummaryDatePreset(presetId);
      setSummaryFilters((prev) => ({ ...prev, ...range }));
    } else {
      setActiveDatePreset(presetId);
      setFilters((prev) => ({ ...prev, ...range }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveDatePreset('');
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSummaryFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryDatePreset('');
    setSummaryFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetSummaryFilters = () => {
    setSummaryFilters({
      employeeId: canSelectEmployee ? '' : (user?.employee_id || ''),
      ...getDefaultDateRange(),
    });
    setSummaryDatePreset('last6Months');
    setAttendanceSummary(null);
  };

  const displayedDailySummaries = useMemo(() => {
    const rows = attendanceSummary?.daily_summaries || [];
    return [...rows].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceSummary]);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.employee_id] = `${emp.first_name} ${emp.last_name}`;
    });
    return map;
  }, [employees]);

  const exportSummaryToCSV = () => {
    if (!attendanceSummary) return;
    
    const headers = ['Date', 'Day', 'Check-in', 'Check-out', 'Worked Hours', 'Status', 'Records'];
    const csvData = attendanceSummary.daily_summaries.map(day => {
      const status = getDayStatus(day) || 'no_data';
      return [
        day.date || '',
        day.day_of_week || '',
        day.check_in ? formatTime(day.check_in) : 'N/A',
        day.check_out ? formatTime(day.check_out) : 'N/A',
        `${day.worked_hours || 0} hours`,
        status.charAt(0).toUpperCase() + status.slice(1),
        day.total_records || 0
      ];
    });

    const csvContent = [
      `Employee: ${attendanceSummary.employee_id}`,
      `Period: ${attendanceSummary.start_date} to ${attendanceSummary.end_date}`,
      '',
      headers.join(','),
      ...csvData.map(row => row.join(',')),
      '',
      `Total Days: ${attendanceSummary.totals?.total_days || attendanceSummary.daily_summaries.length}`,
      `Days with Records: ${attendanceSummary.totals?.days_with_records || attendanceSummary.daily_summaries.filter(d => d.total_records > 0).length}`,
      `Complete Days: ${attendanceSummary.totals?.complete_days || attendanceSummary.daily_summaries.filter(d => d.is_complete).length}`,
      `Absent Days: ${attendanceSummary.totals?.absent_days || attendanceSummary.daily_summaries.filter(d => !d.has_records).length}`,
      `Total Worked Hours: ${attendanceSummary.totals?.worked_hours || attendanceSummary.daily_summaries.reduce((sum, d) => sum + (d.worked_hours || 0), 0)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_summary_${attendanceSummary.employee_id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // --- Statistics (full period, not just current page) ---
  const stats = useMemo(() => {
    const today = getLocalToday();
    const summaries = attendanceSummary?.daily_summaries || [];
    const todaySummary = summaries.find((d) => d.date === today);
    const todayHasCheckIn = todaySummary?.has_records && (todaySummary.check_in || todaySummary.check_in_at);

    return {
      total: attendanceSummary?.totals?.days_with_records ?? 0,
      totalHours: attendanceSummary?.totals?.worked_hours ?? 0,
      today: todayHasCheckIn
        ? (
            todaySummary.total_worked_minutes > 0
              ? todaySummary.worked_time_display
              : formatTime(todaySummary.check_in || todaySummary.check_in_at) || '—'
          )
        : '0',
      todayMissing: summaryFilters.endDate >= today && !todayHasCheckIn,
    };
  }, [attendanceSummary, summaryFilters.endDate]);

  const formatSyncTime = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- Helpers ---
const formatTimestamp = (timestamp) => {
  const parts = parseDeviceTimestamp(timestamp);
  if (!parts) return { date: 'N/A', time: 'N/A' };

  const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const date = new Date(parts.year, parts.month - 1, parts.day);
  const hh = String(parts.hour).padStart(2, '0');
  const mm = String(parts.minute).padStart(2, '0');

  return {
    date: date.toLocaleDateString(locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    time: `${hh}:${mm}`,
  };
};

  // --- Day Status Helper ---
  const getDayStatus = (day) => {
    if (!day) return 'no_data';
    if (day.status) return day.status;
    if (day.is_complete) return 'complete';
    if (day.has_records && day.pair_count > 0) return 'partial';
    if (day.has_records) return 'incomplete';
    return 'no_data';
  };

  // --- UI Components ---
  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-3 py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200
        ${activeTab === id 
          ? 'border-indigo-600 text-indigo-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );

  const StatusBadge = ({ type }) => {
    const isCheckIn = type === 'check_in';
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
        isCheckIn 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}>
        <div className={`h-2 w-2 rounded-full ${isCheckIn ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
        {isCheckIn ? t('attendance:filters.checkIn') : t('attendance:filters.checkOut')}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, color = 'indigo' }) => {
    const colorClasses = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' }
    };
    const colors = colorClasses[color] || colorClasses.indigo;
    
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(label)}</p>
            <p className="text-xl font-black text-slate-800">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {t('attendance:title')}
              </h1>
            </div>
            <p className={`text-slate-500 font-medium ${isRTL ? 'mr-1' : 'ml-1'}`}>
              {t('attendance:subtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            {canSelectEmployee && (
              <button
                onClick={triggerDeviceSync}
                disabled={syncLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  syncLoading 
                    ? 'bg-slate-400 text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {syncLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('attendance:sync.syncing')}
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    {t('attendance:sync.button')}
                  </>
                )}
              </button>
            )}
            <StatCard 
              icon={ClockIcon} 
              label="attendance:stats.today" 
              value={stats.today} 
              color="emerald" 
            />
            <StatCard 
              icon={ChartBarIcon} 
              label="attendance:stats.totalHours" 
              value={stats.totalHours} 
              color="blue" 
            />
            <StatCard 
              icon={DocumentArrowDownIcon} 
              label="attendance:stats.total" 
              value={stats.total} 
              color="indigo" 
            />
          </div>
        </header>

        {/* Sync Status Alert */}
        {syncStatus && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
            syncStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : syncStatus.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {syncStatus.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            ) : syncStatus.type === 'error' ? (
              <XCircleIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="font-medium">{syncStatus.message}</span>
            <button 
              onClick={() => setSyncStatus(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {stats.todayMissing && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-amber-50 text-amber-900 border border-amber-200">
            <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">
                {t('attendance:sync.pendingToday', {
                  minutes: syncInfo?.sync_interval_minutes || 5,
                })}
              </p>
              <p className="text-sm text-amber-800">
                {syncInfo?.last_sync
                  ? t('attendance:sync.lastSync', { time: formatSyncTime(syncInfo.last_sync) })
                  : t('attendance:sync.neverSynced')}
                {syncInfo?.last_success === false && syncInfo?.last_error
                  ? ` — ${syncInfo.last_error}`
                  : ''}
              </p>
            </div>
          </div>
        )}

        {/* --- TABS NAVIGATION --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
          <nav className="-mb-px flex space-x-8">
            <TabButton 
              id="summary" 
              label={t('attendance:tabs.summary')} 
              icon={<ChartBarIcon className="h-5 w-5" />} 
            />
            <TabButton 
              id="userStats" 
              label={t('attendance:tabs.userStats')} 
              icon={<UsersIcon className="h-5 w-5" />} 
            />
          </nav>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === 'summary' ? (
          /* --- ATTENDANCE SUMMARY TAB --- */
          <div className="space-y-6">
            {/* --- SUMMARY FILTERS TOOLBAR --- */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-800">{t('attendance:summary.title')}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetSummaryFilters}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {t('attendance:reset')}
                  </button>
                  {attendanceSummary && (
                    <button
                      onClick={exportSummaryToCSV}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>{t('attendance:summary.export')}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('attendance:presets.title')}
                </p>
                <DatePresetBar
                  activePreset={summaryDatePreset}
                  onSelect={(id) => applyDatePreset(id, 'summary')}
                  t={t}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.employee')}
                  </label>
                  {canSelectEmployee ? (
                    <EmployeeSelect
                      value={summaryFilters.employeeId}
                      onChange={handleSummaryFilterChange}
                      employees={employees}
                      isRTL={isRTL}
                      t={t}
                      allowAll={false}
                      required
                    />
                  ) : (
                    <div className="relative">
                      <UsersIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                      <input
                        type="text"
                        value={employeeMap[summaryFilters.employeeId] || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
                        readOnly
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-100 border-none rounded-xl text-sm font-medium text-slate-600`}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.startDate')}
                  </label>
                  <div className="relative">
                    <CalendarIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                    <input
                      type="date"
                      name="startDate"
                      value={summaryFilters.startDate}
                      onChange={handleSummaryFilterChange}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.endDate')}
                  </label>
                  <div className="relative">
                    <CalendarIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                    <input
                      type="date"
                      name="endDate"
                      value={summaryFilters.endDate}
                      onChange={handleSummaryFilterChange}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={fetchAttendanceSummary}
                  disabled={!summaryFilters.employeeId || summaryLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {summaryLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      {t('attendance:loading')}
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      {t('attendance:summary.getSummary')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* --- SUMMARY CONTENT --- */}
            {summaryLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute animate-ping h-8 w-8 rounded-full bg-indigo-400 opacity-20"></div>
                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-slate-500 font-medium animate-pulse">{t('attendance:summary.loading')}</p>
                </div>
              </div>
            ) : attendanceSummary ? (
              <div className="space-y-6">
                {/* --- SUMMARY HEADER --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {employeeMap[attendanceSummary.employee_id] || attendanceSummary.employee_id}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {t('attendance:summary.period', { start: attendanceSummary.start_date, end: attendanceSummary.end_date })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.totalDays')}</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {attendanceSummary.totals?.total_days || attendanceSummary.daily_summaries.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.daysWithRecords')}</p>
                        <p className="text-2xl font-black text-blue-600">
                          {attendanceSummary.totals?.days_with_records || attendanceSummary.daily_summaries.filter(d => d.total_records > 0).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.completeDays')}</p>
                        <p className="text-2xl font-black text-emerald-600">
                          {attendanceSummary.totals?.complete_days || attendanceSummary.daily_summaries.filter(d => d.is_complete).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.totalHours')}</p>
                        <p className="text-2xl font-black text-purple-600">
                          {attendanceSummary.totals?.worked_hours || attendanceSummary.daily_summaries.reduce((sum, d) => sum + (d.worked_hours || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- DETAILED TABLE VIEW --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">{t('attendance:summary.detailedView')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.date')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.day')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.checkIn')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.checkOut')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.workedHours')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.status')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.records')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedDailySummaries.map((day, index) => {
                          const status = getDayStatus(day) || 'no_data';
                          return (
                            <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-slate-700">{day.date}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">{day.day_of_week}</div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatTime(day.check_in) || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatTime(day.check_out || day.check_out_at) || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-bold ${(day.total_worked_minutes || 0) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {day.worked_time_display || `${day.worked_hours ?? day.total_worked_hours ?? 0}h`}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                  status === 'complete' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : status === 'partial'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  <div className={`h-2 w-2 rounded-full ${
                                    status === 'complete' ? 'bg-emerald-500' : 
                                    status === 'partial' ? 'bg-amber-500' : 
                                    'bg-slate-500'
                                  }`}></div>
                                  {t(`attendance:status.${status}`)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-slate-700">
                                  {day.total_records || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* --- EMPTY STATE --- */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="text-center">
                  <ChartBarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('attendance:summary.noSummary')}</h3>
                  <p className="text-slate-500 mb-6">{t('attendance:summary.noSummaryDesc')}</p>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <InformationCircleIcon className="h-4 w-4" />
                    <span>{t('attendance:summary.noSummaryHint')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'userStats' ? (
          <div className="space-y-6">
            {/* User Stats Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-800">{t('attendance:userStats.title')}</h2>
                </div>
                <button
                  onClick={fetchUserStats}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  {t('attendance:userStats.refresh')}
                </button>
              </div>

              {/* Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('attendance:filters.startDate')}</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={(e) => {
                      handleFilterChange(e);
                      if (activeTab === 'userStats') fetchUserStats();
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('attendance:filters.endDate')}</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={(e) => {
                      handleFilterChange(e);
                      if (activeTab === 'userStats') fetchUserStats();
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* User Stats Table */}
            {statsLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">{t('attendance:userStats.loading')}</p>
              </div>
            ) : userStats.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.employee')}</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.department')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.daysWithRecords')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.totalHours')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.totalEvents')}</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.lastActivity')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userStats.map((stat, index) => (
                        <tr key={stat.employee_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{stat.first_name} {stat.last_name}</p>
                              <p className="text-sm text-slate-500">{stat.employee_id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {stat.department || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-indigo-100 text-indigo-700">
                              {stat.days_with_records}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircleIcon className="h-4 w-4" />
                              {stat.total_worked_hours}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
                              <XCircleIcon className="h-4 w-4" />
                              {stat.total_events}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {stat.last_date || 'N/A'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600">{t('attendance:userStats.totalEmployees')}</p>
                      <p className="text-2xl font-bold text-slate-900">{userStats.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">{t('attendance:userStats.totalDaysAll')}</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {userStats.reduce((sum, s) => sum + s.days_with_records, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">{t('attendance:userStats.totalHoursAll')}</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {userStats.reduce((sum, s) => sum + s.total_worked_hours, 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">{t('attendance:userStats.totalEventsAll')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {userStats.reduce((sum, s) => sum + s.total_events, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-center">
                  <UsersIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('attendance:userStats.noStats')}</h3>
                  <p className="text-slate-500">{t('attendance:userStats.noStatsDesc')}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
    </div>
  );
}

export default Attendance;