import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient, { userAPI, attendanceAPI } from '../services/api';
import {
  getAttendanceLocale,
  translateWeekday,
  formatLocalizedLongDate,
  formatLocalizedShortDate,
  emptyAttendanceValue,
} from '../utils/attendanceI18n';
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
import dynLogo from '../assets/dynlogo.jpg';

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
    since2022: { startDate: '2022-01-01', endDate: formatDateInput(now) },
    last6Months: { startDate: formatDateInput(last6), endDate: formatDateInput(now) },
    last30Days: { startDate: formatDateInput(last30), endDate: formatDateInput(now) },
    thisMonth: { startDate: formatDateInput(startOfMonth), endDate: formatDateInput(now) },
    yearToDate: { startDate: formatDateInput(ytd), endDate: formatDateInput(now) },
  };
};

const getDefaultDateRange = () => getDatePresets().since2022;

const getSummaryDefaultDateRange = () => getDatePresets().since2022;

const getDayStatus = (day) => {
  if (!day) return 'no_data';
  if (day.status) return day.status;
  if (day.is_complete) return 'complete';
  if (day.has_records && day.pair_count > 0) return 'partial';
  if (day.has_records) return 'incomplete';
  return 'no_data';
};

const shiftDate = (dateStr, days) => {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

function DatePresetBar({ activePreset, onSelect, t }) {
  const presets = [
    { id: 'today', label: t('attendance:presets.today') },
    { id: 'since2022', label: t('attendance:presets.since2022') },
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
              ? 'bg-primary text-white shadow-md shadow-primary-200'
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
        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all font-medium appearance-none cursor-pointer`}
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
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';
  const displayLocale = getAttendanceLocale(i18n.language);
  const isAdmin = user?.role === 'admin';
  const canSelectEmployee = user?.role === 'admin' || user?.role === 'supervisor';
  const defaultDates = getDefaultDateRange();
  
  // --- State ---
  const [activeTab, setActiveTab] = useState('daily');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyLoadError, setDailyLoadError] = useState(null);
  const [dailyDate, setDailyDate] = useState(getLocalToday());
  const [dailySearch, setDailySearch] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('all');
  const [dailyLastFetched, setDailyLastFetched] = useState(null);
  const dailyAbortRef = useRef(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncInfo, setSyncInfo] = useState(null);
  const [activeDatePreset, setActiveDatePreset] = useState('since2022');
  const [summaryDatePreset, setSummaryDatePreset] = useState('since2022');
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryStatusFilter, setSummaryStatusFilter] = useState('all');
  const [userStatsSearch, setUserStatsSearch] = useState('');
  const [filters, setFilters] = useState({
    employeeId: '',
    ...defaultDates,
  });
  
  const [summaryFilters, setSummaryFilters] = useState({
    employeeId: '',
    ...getSummaryDefaultDateRange(),
  });

  // --- Effects ---
  useEffect(() => {
    const today = getLocalToday();
    setFilters((prev) => (prev.endDate < today ? { ...prev, endDate: today } : prev));
    setSummaryFilters((prev) => (prev.endDate < today ? { ...prev, endDate: today } : prev));
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (canSelectEmployee && !employees.length) {
      fetchEmployees();
    }
  }, [authLoading, user, canSelectEmployee, employees.length]);

  useEffect(() => {
    if (authLoading || !user) return;

    const resolvedEmployeeId = resolveAttendanceEmployeeId(user, employees);
    if (!resolvedEmployeeId) return;

    setSummaryFilters((prev) =>
      prev.employeeId ? prev : { ...prev, employeeId: resolvedEmployeeId }
    );
    setFilters((prev) =>
      prev.employeeId ? prev : { ...prev, employeeId: resolvedEmployeeId }
    );
  }, [authLoading, user, employees]);

  const fetchDailyAttendance = useCallback(async (date = dailyDate, options = {}) => {
    const { signal, silent = false } = options;

    if (dailyAbortRef.current && !signal) {
      dailyAbortRef.current.abort();
    }

    if (!silent) {
      setDailyLoading(true);
    }
    setDailyLoadError(null);

    try {
      const response = await attendanceAPI.getDailyAttendance(date, signal ? { signal } : undefined);

      if (response.data.success) {
        setDailyAttendance(response.data);
        setDailyLastFetched(new Date());
      } else {
        setDailyAttendance(null);
      }
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }
      console.error('Error fetching daily attendance:', error);
      setDailyLoadError(error);
      setDailyAttendance(null);
    } finally {
      setDailyLoading(false);
    }
  }, [dailyDate]);

  const loadDailyView = useCallback((date = dailyDate) => {
    if (dailyAbortRef.current) {
      dailyAbortRef.current.abort();
    }
    const controller = new AbortController();
    dailyAbortRef.current = controller;
    return fetchDailyAttendance(date, { signal: controller.signal });
  }, [dailyDate, fetchDailyAttendance]);

  useLayoutEffect(() => {
    if (authLoading || !user) return undefined;
    if (activeTab !== 'daily') return undefined;

    loadDailyView(dailyDate);

    return () => {
      if (dailyAbortRef.current) {
        dailyAbortRef.current.abort();
        dailyAbortRef.current = null;
      }
    };
  }, [authLoading, user, activeTab, dailyDate, location.pathname, loadDailyView]);

  // Ensure daily view loads immediately after auth completes
  useEffect(() => {
    if (authLoading || !user || activeTab !== 'daily') return;
    setDailyLoading(true);
    loadDailyView(dailyDate);
  }, [authLoading, user?.id, activeTab]);

  useEffect(() => {
    if (activeTab !== 'userStats') return;
    fetchUserStats();
  }, [activeTab, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (authLoading || !summaryFilters.employeeId) return;
    if (activeTab === 'summary') {
      fetchAttendanceSummary();
    }
  }, [authLoading, activeTab, summaryFilters.employeeId, summaryFilters.startDate, summaryFilters.endDate]);

  useEffect(() => {
    if (activeTab !== 'daily' || dailyDate !== getLocalToday()) return;

    const interval = setInterval(() => {
      fetchDailyAttendance(dailyDate, { silent: true });
      fetchSyncInfo();
    }, 180_000);

    return () => clearInterval(interval);
  }, [activeTab, dailyDate, fetchDailyAttendance, loadDailyView]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      fetchSyncInfo();
      if (activeTab === 'daily') {
        loadDailyView(dailyDate);
      } else if (activeTab === 'summary' && summaryFilters.employeeId) {
        fetchAttendanceSummary();
      } else if (activeTab === 'userStats') {
        fetchUserStats();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeTab, dailyDate, summaryFilters.employeeId, loadDailyView]);

  useEffect(() => {
    return () => {
      if (dailyAbortRef.current) {
        dailyAbortRef.current.abort();
      }
    };
  }, []);

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

  const fetchDailyAttendanceRef = useRef(loadDailyView);
  fetchDailyAttendanceRef.current = loadDailyView;

  const refreshActiveTab = useCallback(() => {
    fetchSyncInfo();
    if (activeTab === 'daily') {
      fetchDailyAttendanceRef.current(dailyDate);
    } else if (activeTab === 'summary' && summaryFilters.employeeId) {
      fetchAttendanceSummary();
    } else if (activeTab === 'userStats') {
      fetchUserStats();
    }
  }, [activeTab, dailyDate, summaryFilters.employeeId]);

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
                    refreshActiveTab();
                    fetchDailyAttendanceRef.current(dailyDate);
                  }, 1000);
                } else {
                  setSyncStatus({
                    type: 'error',
                    message: `${t('attendance:sync.failed')}: ${status.last_result.error || t('attendance:errors.unknown')}`,
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

  const applyDatePreset = (presetId, target = 'userStats') => {
    const presets = getDatePresets();
    const range = presets[presetId];
    if (!range) return;

    if (target === 'summary') {
      setSummaryDatePreset(presetId);
      setSummaryFilters((prev) => ({ ...prev, ...range }));
    } else {
      setActiveDatePreset(presetId);
      setFilters((prev) => ({ ...prev, ...range }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveDatePreset('');
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSummaryFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryDatePreset('');
    setSummaryFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetSummaryFilters = () => {
    setSummaryFilters({
      employeeId: canSelectEmployee ? '' : (user?.employee_id || ''),
      ...getSummaryDefaultDateRange(),
    });
    setSummaryDatePreset('since2022');
    setAttendanceSummary(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'daily') {
      setDailyLoading(true);
      loadDailyView(dailyDate);
    } else if (tabId === 'summary' && summaryFilters.employeeId) {
      fetchAttendanceSummary();
    } else if (tabId === 'userStats') {
      fetchUserStats();
    }
  };

  const handleDailyDateChange = (nextDate) => {
    setDailyDate(nextDate);
  };

  const filteredDailyRows = useMemo(() => {
    const rows = dailyAttendance?.attendance || [];
    const q = dailySearch.trim().toLowerCase();

    return rows.filter((row) => {
      if (dailyStatusFilter === 'present' && !row.has_records) return false;
      if (dailyStatusFilter === 'absent' && row.has_records) return false;

      if (!q) return true;
      return (
        (row.first_name || '').toLowerCase().includes(q) ||
        (row.last_name || '').toLowerCase().includes(q) ||
        (row.department || '').toLowerCase().includes(q) ||
        (row.employee_id || '').toLowerCase().includes(q)
      );
    });
  }, [dailyAttendance, dailySearch, dailyStatusFilter]);

  const emptyTime = emptyAttendanceValue(t);

  const formatAttendanceTime = (timestamp) => {
    const formatted = formatTime(timestamp);
    return formatted === 'N/A' ? emptyTime : formatted;
  };

  const getWeekdayLabel = (dateStr, dayCode) =>
    translateWeekday({ dateStr, dayCode, locale: displayLocale, t });

  const dailyTotals = dailyAttendance?.totals || null;
  const isViewingToday = dailyDate === getLocalToday();

  const formatWorkedHours = (hours) =>
    t('attendance:formats.hoursValue', { value: hours ?? 0 });

  const filteredDailySummaries = useMemo(() => {
    const rows = attendanceSummary?.daily_summaries || [];
    const q = summarySearch.trim().toLowerCase();

    return [...rows]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((day) => {
        const status = getDayStatus(day);

        if (summaryStatusFilter === 'complete' && status !== 'complete') return false;
        if (summaryStatusFilter === 'partial' && status !== 'partial' && status !== 'incomplete') return false;
        if (summaryStatusFilter === 'no_data' && day.has_records) return false;

        if (!q) return true;
        const weekday = translateWeekday({
          dateStr: day.date,
          dayCode: day.day_of_week,
          locale: displayLocale,
          t,
        }).toLowerCase();
        return day.date.includes(q) || weekday.includes(q);
      });
  }, [attendanceSummary, summarySearch, summaryStatusFilter, displayLocale, t]);

  const filteredUserStats = useMemo(() => {
    const q = userStatsSearch.trim().toLowerCase();
    if (!q) return userStats;

    return userStats.filter((stat) =>
      (stat.first_name || '').toLowerCase().includes(q) ||
      (stat.last_name || '').toLowerCase().includes(q) ||
      (stat.department || '').toLowerCase().includes(q) ||
      (stat.employee_id || '').toLowerCase().includes(q)
    );
  }, [userStats, userStatsSearch]);

  const userStatsAggregates = useMemo(() => ({
    employees: filteredUserStats.length,
    days: filteredUserStats.reduce((sum, s) => sum + s.days_with_records, 0),
    hours: filteredUserStats.reduce((sum, s) => sum + s.total_worked_hours, 0),
    events: filteredUserStats.reduce((sum, s) => sum + s.total_events, 0),
  }), [filteredUserStats]);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.employee_id] = `${emp.first_name} ${emp.last_name}`;
    });
    return map;
  }, [employees]);

  const exportSummaryToCSV = () => {
    if (!attendanceSummary) return;

    const headers = [
      t('attendance:exportCsv.date'),
      t('attendance:exportCsv.day'),
      t('attendance:exportCsv.checkIn'),
      t('attendance:exportCsv.lunchOut'),
      t('attendance:exportCsv.afternoonIn'),
      t('attendance:exportCsv.checkOut'),
      t('attendance:exportCsv.workedHours'),
      t('attendance:exportCsv.status'),
      t('attendance:exportCsv.records'),
    ];
    const csvData = attendanceSummary.daily_summaries.map((day) => {
      const status = getDayStatus(day) || 'no_data';
      return [
        day.date || '',
        getWeekdayLabel(day.date, day.day_of_week),
        day.check_in ? formatAttendanceTime(day.check_in) : emptyTime,
        day.lunch_out ? formatAttendanceTime(day.lunch_out) : emptyTime,
        day.afternoon_in ? formatAttendanceTime(day.afternoon_in) : emptyTime,
        day.check_out ? formatAttendanceTime(day.check_out) : emptyTime,
        formatWorkedHours(day.worked_hours || 0),
        t(`attendance:status.${status}`),
        day.total_records || 0,
      ];
    });

    const csvContent = [
      `${t('attendance:exportCsv.employee')}: ${attendanceSummary.employee_id}`,
      `${t('attendance:exportCsv.period')}: ${attendanceSummary.start_date} → ${attendanceSummary.end_date}`,
      '',
      headers.join(','),
      ...csvData.map((row) => row.join(',')),
      '',
      `${t('attendance:exportCsv.totalDays')}: ${attendanceSummary.totals?.total_days || attendanceSummary.daily_summaries.length}`,
      `${t('attendance:exportCsv.daysWithRecords')}: ${attendanceSummary.totals?.days_with_records || attendanceSummary.daily_summaries.filter((d) => d.total_records > 0).length}`,
      `${t('attendance:exportCsv.completeDays')}: ${attendanceSummary.totals?.complete_days || attendanceSummary.daily_summaries.filter((d) => d.is_complete).length}`,
      `${t('attendance:exportCsv.absentDays')}: ${attendanceSummary.totals?.absent_days || attendanceSummary.daily_summaries.filter((d) => !d.has_records).length}`,
      `${t('attendance:exportCsv.totalWorkedHours')}: ${attendanceSummary.totals?.worked_hours || attendanceSummary.daily_summaries.reduce((sum, d) => sum + (d.worked_hours || 0), 0)}`,
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
    return date.toLocaleString(displayLocale, {
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

  // --- UI Components ---
  const TabButton = ({ id, label, icon }) => (
    <button
      type="button"
      onClick={() => handleTabChange(id)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
        ${activeTab === id
          ? 'bg-primary text-white shadow-md shadow-primary-200'
          : 'text-slate-500 hover:bg-primary-50 hover:text-primary'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );

  const DailyStatusBadge = ({ status }) => {
    const styles = {
      complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      partial: 'bg-amber-50 text-amber-700 border-amber-200',
      incomplete: 'bg-orange-50 text-orange-700 border-orange-200',
      no_data: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const dots = {
      complete: 'bg-emerald-500',
      partial: 'bg-amber-500',
      incomplete: 'bg-orange-500',
      no_data: 'bg-slate-400',
    };
    const resolved = status || 'no_data';

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${styles[resolved] || styles.no_data}`}>
        <span className={`h-2 w-2 rounded-full ${dots[resolved] || dots.no_data}`} />
        {t(`attendance:status.${resolved}`)}
      </span>
    );
  };

  const StatusBadge = ({ type }) => {
    const isCheckIn = type === 'check_in';
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
        isCheckIn 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-primary-50 text-primary-600 border-primary-200'
      }`}>
        <div className={`h-2 w-2 rounded-full ${isCheckIn ? 'bg-emerald-500' : 'bg-primary'}`}></div>
        {isCheckIn ? t('attendance:filters.checkIn') : t('attendance:filters.checkOut')}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, color = 'indigo' }) => {
    const colorClasses = {
      indigo: { bg: 'bg-primary-50', text: 'text-primary' },
      emerald: { bg: 'bg-[#E7F6EA]', text: 'text-brand-green' },
      blue: { bg: 'bg-[#E7EEF8]', text: 'text-brand-blue' }
    };
    const colors = colorClasses[color] || colorClasses.indigo;
    
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/35 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl">
        <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-primary/[0.04] transition-transform group-hover:scale-125" />
        <div className="relative flex items-center gap-4">
          <div className={`h-11 w-11 rounded-xl ${colors.bg} flex items-center justify-center`}>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(74,106,173,0.12),_transparent_32%),linear-gradient(135deg,_#f8f7fc_0%,_#f4f6fb_52%,_#f9fafb_100%)] px-3 py-4 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1600px] space-y-5 pb-8 animate-in fade-in duration-700">
      
      {/* --- HEADER SECTION --- */}
      <header className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary-900 via-primary-700 to-brand-blue px-5 py-5 text-white shadow-xl shadow-primary-900/15 md:px-7 md:py-6">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute right-16 -bottom-28 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
{/*             <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg shadow-black/15">
              <img src={dynLogo} alt="Dynamix Services" className="h-full w-full object-contain" />
            </div> */}
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-primary-100" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-100">
                  {t('attendance:tabs.logs')}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                {t('attendance:title')}
              </h1>
              <p className="mt-1 text-sm text-white/70">{t('attendance:subtitle')}</p>
            {syncInfo?.last_sync ? (
              <p className="mt-1 text-xs text-white/55">
                {t('attendance:sync.lastSync', { time: formatSyncTime(syncInfo.last_sync) })}
              </p>
            ) : syncInfo?.sync_schedule_label ? (
              <p className="mt-1 text-xs text-white/55">
                {t('attendance:sync.scheduleHint', {
                  schedule: syncInfo.sync_schedule_label,
                })}
              </p>
            ) : null}
          </div>
          </div>

          {/* Stats */}
          <div className="relative flex flex-wrap gap-3">
            {canSelectEmployee && (
              <button
                onClick={triggerDeviceSync}
                disabled={syncLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  syncLoading 
                    ? 'bg-slate-400 text-white cursor-not-allowed' 
                    : 'border border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 hover:shadow-lg'
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
     
          </div>
        </div>
      </header>

        {/* Sync Status Alert */}
        {syncStatus && (
          <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${
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

        {/* Soft notice only when today's punch is missing AND auto-sync failed recently */}
        {stats.todayMissing && syncInfo?.last_success === false && (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-3 bg-amber-50 text-amber-900 border border-amber-200">
            <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">
                {t('attendance:sync.pendingToday', {
                  schedule:
                    syncInfo?.sync_schedule_label
                    || (syncInfo?.sync_times || []).join(', ')
                    || '08:00, 08:30, 09:00',
                })}
              </p>
              <p className="text-sm text-amber-800">
                {syncInfo?.last_sync
                  ? t('attendance:sync.lastSync', { time: formatSyncTime(syncInfo.last_sync) })
                  : t('attendance:sync.neverSynced')}
                {syncInfo?.last_error ? ` — ${syncInfo.last_error}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* --- TABS NAVIGATION --- */}
        <div className="rounded-2xl border border-white/80 bg-white/85 p-2 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
          <nav className="flex flex-wrap gap-2">
            <TabButton 
              id="daily" 
              label={t('attendance:tabs.logs')} 
              icon={<CalendarIcon className="h-5 w-5" />} 
            />
            <TabButton 
              id="summary" 
              label={t('attendance:tabs.summary')} 
              icon={<ChartBarIcon className="h-5 w-5" />} 
            />
            {/* <TabButton 
              id="userStats" 
              label={t('attendance:tabs.userStats')} 
              icon={<UsersIcon className="h-5 w-5" />} 
            /> */} 
          </nav>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === 'daily' ? (
          /* --- DAILY VIEW TAB --- */
          <div className="space-y-5">
            {/* Date picker toolbar */}
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
              <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-5 w-5 text-primary-400" />
                    <h2 className="text-lg font-bold text-slate-800">{t('attendance:daily.title')}</h2>
                  </div>
                  <p className="text-sm text-slate-500">{t('attendance:daily.subtitle')}</p>
                  {dailyLastFetched && (
                    <p className="text-xs text-slate-400 mt-2">
                      {t('attendance:daily.lastUpdated', { time: formatSyncTime(dailyLastFetched.toISOString()) })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDailyView(dailyDate)}
                    disabled={dailyLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${dailyLoading ? 'animate-spin' : ''}`} />
                    {t('attendance:refresh')}
                  </button>
                  {!isViewingToday && (
                    <button
                      type="button"
                      onClick={() => handleDailyDateChange(getLocalToday())}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all"
                    >
                      {t('attendance:daily.goToToday')}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-4 xl:flex-row xl:items-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDailyDateChange(shiftDate(dailyDate, -1))}
                    className="rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-all hover:bg-slate-200"
                    aria-label={t('attendance:daily.previousDay')}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="relative min-w-[220px]">
                    <CalendarIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none`} />
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => handleDailyDateChange(e.target.value)}
                      className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} w-full rounded-xl border border-brand-border bg-white py-2.5 text-sm font-medium transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDailyDateChange(shiftDate(dailyDate, 1))}
                    disabled={isViewingToday}
                    className="rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={t('attendance:daily.nextDay')}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>

              </div>

              <p className="text-sm font-semibold text-slate-700 mb-4">
                {formatLocalizedLongDate(dailyDate, displayLocale)}
              </p>

              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { id: 'all', label: t('attendance:daily.filterAll') },
                  { id: 'present', label: t('attendance:daily.filterPresent') },
                  { id: 'absent', label: t('attendance:daily.filterAbsent') },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setDailyStatusFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dailyStatusFilter === chip.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {dailyTotals && !dailyLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard icon={UsersIcon} label="attendance:daily.present" value={dailyTotals.present ?? 0} color="emerald" />
                <StatCard icon={XCircleIcon} label="attendance:daily.absent" value={dailyTotals.absent ?? 0} color="blue" />
{/*                 <StatCard icon={CheckCircleIcon} label="attendance:daily.complete" value={dailyTotals.complete ?? 0} color="indigo" />
 */}{/*                 <StatCard icon={ExclamationTriangleIcon} label="attendance:daily.partial" value={dailyTotals.partial ?? 0} color="blue" />
 */}{/*                 <StatCard icon={ClockIcon} label="attendance:daily.totalHours" value={dailyTotals.total_worked_hours ?? 0} color="emerald" />
 */}              </div>
            )}

            {/* Table */}
            {dailyLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-slate-500 font-medium animate-pulse">{t('attendance:daily.loading')}</p>
                </div>
              </div>
            ) : dailyAttendance ? (
              <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-lg shadow-slate-200/25">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {formatLocalizedShortDate(dailyAttendance.date, displayLocale)} ({getWeekdayLabel(dailyAttendance.date, dailyAttendance.day_of_week)})
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t('attendance:daily.showingCount', {
                      count: filteredDailyRows.length,
                      total: dailyAttendance.attendance?.length || 0,
                    })}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.employee')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.checkIn')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.lunchOut')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.afternoonIn')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.checkOut')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.workedHours')}</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('attendance:table.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDailyRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            {t('attendance:daily.noMatches')}
                          </td>
                        </tr>
                      ) : (
                        filteredDailyRows.map((row) => {
                          const status = row.status || (row.has_records ? 'partial' : 'no_data');
                          return (
                            <tr
                              key={row.employee_id}
                              className={`group transition-colors ${
                                row.has_records ? 'hover:bg-emerald-50/30' : 'hover:bg-slate-50/50 opacity-80'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">{row.first_name} {row.last_name}</p>
                                  <p className="text-xs text-slate-400">{row.employee_id}{row.department ? ` · ${row.department}` : ''}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(row.check_in)}
                                </div>
                              </td>
                              <td className="px-4 py-3" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(row.lunch_out)}
                                </div>
                              </td>
                              <td className="px-4 py-3" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(row.afternoon_in)}
                                </div>
                              </td>
                              <td className="px-4 py-3" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(row.check_out)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-bold ${(row.total_worked_minutes || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {row.worked_time_display || '00:00'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <DailyStatusBadge status={status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="text-center">
                  <CalendarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {dailyLoadError ? t('attendance:errors.loadFailed') : t('attendance:daily.noData')}
                  </h3>
                  <p className="text-slate-500 mb-6">{t('attendance:daily.noDataDesc')}</p>
                  <button
                    type="button"
                    onClick={() => loadDailyView(dailyDate)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-600 transition-all"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    {t('attendance:retry')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'summary' ? (
          /* --- ATTENDANCE SUMMARY TAB --- */
          <div className="space-y-5">
            {/* --- SUMMARY FILTERS TOOLBAR --- */}
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
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
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 font-medium`}
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
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={fetchAttendanceSummary}
                  disabled={!summaryFilters.employeeId || summaryLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200/50 hover:shadow-primary-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
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
                    <div className="absolute animate-ping h-8 w-8 rounded-full bg-primary-300 opacity-20"></div>
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                        {t('attendance:summary.period', {
                          start: formatLocalizedShortDate(attendanceSummary.start_date, displayLocale),
                          end: formatLocalizedShortDate(attendanceSummary.end_date, displayLocale),
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.totalDays')}</p>
                        <p className="text-2xl font-black text-primary">
                          {attendanceSummary.totals?.total_days || attendanceSummary.daily_summaries.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attendance:summary.daysWithRecords')}</p>
                        <p className="text-2xl font-black text-primary">
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
                  <div className="px-6 py-4 border-b border-slate-100 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{t('attendance:summary.detailedView')}</h3>
                        <p className="text-sm text-slate-500">
                          {t('attendance:summary.showingCount', {
                            count: filteredDailySummaries.length,
                            total: attendanceSummary.daily_summaries?.length || 0,
                          })}
                        </p>
                      </div>
                      <div className="relative w-full lg:max-w-xs">
                        <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                        <input
                          type="text"
                          value={summarySearch}
                          onChange={(e) => setSummarySearch(e.target.value)}
                          placeholder={t('attendance:summary.searchPlaceholder')}
                          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 transition-all`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: t('attendance:summary.filterAll') },
                        { id: 'complete', label: t('attendance:summary.filterComplete') },
                        { id: 'partial', label: t('attendance:summary.filterPartial') },
                        { id: 'no_data', label: t('attendance:summary.filterNoData') },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSummaryStatusFilter(chip.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            summaryStatusFilter === chip.id
                              ? 'bg-primary text-white shadow-md shadow-primary-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.date')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.day')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.checkIn')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.lunchOut')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.afternoonIn')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.checkOut')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.workedHours')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.status')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.records')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDailySummaries.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500">
                              {t('attendance:summary.noMatches')}
                            </td>
                          </tr>
                        ) : filteredDailySummaries.map((day, index) => {
                          const status = getDayStatus(day) || 'no_data';
                          return (
                            <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-slate-700">
                                  {formatLocalizedShortDate(day.date, displayLocale)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">
                                  {getWeekdayLabel(day.date, day.day_of_week)}
                                </div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(day.check_in)}
                                </div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(day.lunch_out || day.lunch_out_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(day.afternoon_in || day.afternoon_in_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4" dir="ltr">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatAttendanceTime(day.check_out || day.check_out_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-bold ${(day.total_worked_minutes || 0) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {day.worked_time_display || formatWorkedHours(day.worked_hours ?? day.total_worked_hours ?? 0)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <DailyStatusBadge status={status} />
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
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/30 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-800">{t('attendance:userStats.title')}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{t('attendance:userStats.subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchUserStats}
                  disabled={statsLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 font-bold disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  {t('attendance:userStats.refresh')}
                </button>
              </div>

              <div className="mb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('attendance:presets.title')}
                </p>
                <DatePresetBar
                  activePreset={activeDatePreset}
                  onSelect={(id) => applyDatePreset(id, 'userStats')}
                  t={t}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.startDate')}
                  </label>
                  <div className="relative">
                    <CalendarIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 transition-all font-medium`}
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
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 transition-all font-medium`}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {t('attendance:filters.activeRange', {
                  start: formatLocalizedShortDate(filters.startDate, displayLocale),
                  end: formatLocalizedShortDate(filters.endDate, displayLocale),
                })}
              </p>
            </div>

            {!statsLoading && userStats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UsersIcon} label="attendance:userStats.totalEmployees" value={userStatsAggregates.employees} color="indigo" />
                <StatCard icon={CalendarIcon} label="attendance:userStats.totalDaysAll" value={userStatsAggregates.days} color="blue" />
                <StatCard icon={ClockIcon} label="attendance:userStats.totalHoursAll" value={userStatsAggregates.hours.toFixed(1)} color="emerald" />
                <StatCard icon={ChartBarIcon} label="attendance:userStats.totalEventsAll" value={userStatsAggregates.events} color="indigo" />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-slate-500">
                  {t('attendance:userStats.showingCount', {
                    count: filteredUserStats.length,
                    total: userStats.length,
                  })}
                </p>
                <div className="relative w-full md:max-w-xs">
                  <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                  <input
                    type="text"
                    value={userStatsSearch}
                    onChange={(e) => setUserStatsSearch(e.target.value)}
                    placeholder={t('attendance:userStats.searchPlaceholder')}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 transition-all`}
                  />
                </div>
              </div>

            {statsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-slate-600">{t('attendance:userStats.loading')}</p>
              </div>
            ) : filteredUserStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.employee')}</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.department')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.daysWithRecords')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.totalHours')}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.totalEvents')}</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">{t('attendance:userStats.lastActivity')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUserStats.map((stat) => (
                        <tr key={stat.employee_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{stat.first_name} {stat.last_name}</p>
                              <p className="text-sm text-slate-500">{stat.employee_id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {stat.department || t('common:common.notAvailable')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-primary-100 text-primary-600">
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
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium bg-primary-50 text-primary-600">
                              <XCircleIcon className="h-4 w-4" />
                              {stat.total_events}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {stat.last_date
                                ? formatLocalizedShortDate(stat.last_date, displayLocale)
                                : t('common:common.notAvailable')}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            ) : userStats.length > 0 ? (
              <div className="p-12 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">{t('attendance:userStats.noMatches')}</p>
              </div>
            ) : (
              <div className="p-12">
                <div className="text-center">
                  <UsersIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('attendance:userStats.noStats')}</h3>
                  <p className="text-slate-500">{t('attendance:userStats.noStatsDesc')}</p>
                </div>
              </div>
            )}
            </div>
          </div>
        ) : null}
    </div>
    </div>
  );
}

export default Attendance;