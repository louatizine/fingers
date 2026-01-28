import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Attendance Management Page - Modern Design
 */
function Attendance() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // --- State ---
  const [activeTab, setActiveTab] = useState('logs');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    eventType: ''
  });
  
  // Dynamic dates - use current year
  const getCurrentYearDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
    };
  };
  
  const [summaryFilters, setSummaryFilters] = useState({
    employeeId: '',
    ...getCurrentYearDates()
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // --- Effects ---
  useEffect(() => {
    fetchAttendance();
  }, [pagination.page, filters]);

  // Don't auto-fetch summary, user should click button

  // --- Auth Helper ---
  const createAuthenticatedRequest = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  };

  // --- Logic ---
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await axios.get(`${API_URL}/attendance?${params}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setAttendanceLogs(response.data.data);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    if (!summaryFilters.employeeId) {
      console.log('No employee ID provided');
      return;
    }
    
    setSummaryLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const params = new URLSearchParams({
        employee_id: summaryFilters.employeeId,
        start_date: summaryFilters.startDate,
        end_date: summaryFilters.endDate
      });

      console.log('Fetching summary with params:', params.toString());
      console.log('Date range:', summaryFilters.startDate, 'to', summaryFilters.endDate);
      
      const response = await axios.get(`${API_URL}/attendance/summary?${params}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      console.log('Summary response:', response.data);
      
      if (response.data.success) {
        console.log('Daily summaries count:', response.data.data.daily_summaries?.length);
        setAttendanceSummary(response.data.data);
      } else {
        console.error('Summary fetch failed:', response.data);
        setAttendanceSummary(null);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error.response?.data || error.message);
      setAttendanceSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSummaryFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryFilters(prev => ({ ...prev, [name]: value }));
    // Don't auto-fetch, let user click the button
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );
      
      const response = await axios.get(`${API_URL}/attendance/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };

  const resetFilters = () => {
    setFilters({ employeeId: '', startDate: '', endDate: '', eventType: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetSummaryFilters = () => {
    setSummaryFilters({
      employeeId: '',
      ...getCurrentYearDates()
    });
    setAttendanceSummary(null);
  };

  const exportSummaryToCSV = () => {
    if (!attendanceSummary) return;
    
    const headers = ['Date', 'Day', 'Check-in', 'Check-out', 'Worked Hours', 'Status', 'Records'];
    const csvData = attendanceSummary.daily_summaries.map(day => {
      const status = getDayStatus(day) || 'no_data';
      return [
        day.date || '',
        day.day_of_week || '',
        day.check_in ? new Date(day.check_in).toLocaleTimeString() : 'N/A',
        day.check_out ? new Date(day.check_out).toLocaleTimeString() : 'N/A',
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

  // --- Statistics ---
  const stats = useMemo(() => {
    const checkIns = attendanceLogs.filter(log => log.event_type === 'check_in').length;
    const checkOuts = attendanceLogs.filter(log => log.event_type === 'check_out').length;
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = attendanceLogs.filter(log => 
      new Date(log.timestamp).toISOString().split('T')[0] === today
    ).length;
    
    return {
      total: attendanceLogs.length,
      checkIns,
      checkOuts,
      today: todayLogs
    };
  }, [attendanceLogs]);

  // --- Helpers ---
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (pagination.pages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.pages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, pagination.page - 2);
      let endPage = Math.min(pagination.pages, pagination.page + 2);
      
      if (pagination.page <= 3) endPage = maxPagesToShow;
      if (pagination.page >= pagination.pages - 2) startPage = pagination.pages - maxPagesToShow + 1;
      
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // --- Day Status Helper ---
  const getDayStatus = (day) => {
    if (!day) return 'no_data';
    if (day.status) return day.status;
    
    const hasCheckIn = !!day.check_in;
    const hasCheckOut = !!day.check_out;
    const hasRecords = (day.total_records && day.total_records > 0) || day.has_records;
    
    if (hasCheckIn && hasCheckOut) return 'complete';
    if (hasCheckIn || hasCheckOut) return 'partial';
    if (hasRecords) return 'absent';
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-slate-800">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  const SummaryDayCard = ({ day }) => {
    if (!day) return null;
    
    const status = getDayStatus(day);
    
    const getStatusClasses = (status) => {
      switch(status) {
        case 'complete': 
          return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' };
        case 'partial': 
          return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' };
        case 'absent': 
          return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800' };
        default: 
          return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' };
      }
    };
    
    const classes = getStatusClasses(status);
    
    return (
      <div className={`p-4 rounded-xl border ${classes.bg} ${classes.border} transition-all hover:shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-800">{day.date}</p>
            <p className="text-xs text-slate-500">{day.day_of_week}</p>
          </div>
          <div className="flex flex-col items-end">
            {status === 'complete' ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            ) : status === 'partial' ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            ) : status === 'absent' ? (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <QuestionMarkCircleIcon className="h-5 w-5 text-slate-400" />
            )}
            {(day.check_in_count > 1 || day.check_out_count > 1) && (
              <span className="text-xs text-slate-500 mt-1">
                {day.check_in_count || 0} in, {day.check_out_count || 0} out
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 font-medium">Check-in</p>
            <p className="font-semibold text-slate-700">
              {formatTime(day.check_in) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Check-out</p>
            <p className="font-semibold text-slate-700">
              {formatTime(day.check_out) || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-medium">Status</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${classes.badge}`}>
              {status ? status.toUpperCase() : 'NO DATA'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Worked Hours</span>
            <span className="text-sm font-bold text-slate-800">{day.worked_hours || 0} hrs</span>
          </div>
          {day.total_records > 2 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500 font-medium">Total Records</span>
              <span className="text-xs font-bold text-slate-700">{day.total_records}</span>
            </div>
          )}
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
              {t('attendance:subtitle') || 'Monitor and manage employee presence logs'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <StatCard 
              icon={ClockIcon} 
              label="Today's Logs" 
              value={stats.today} 
              color="emerald" 
            />
            <StatCard 
              icon={UserGroupIcon} 
              label="Check-ins" 
              value={stats.checkIns} 
              color="blue" 
            />
            <StatCard 
              icon={DocumentArrowDownIcon} 
              label="Total Logs" 
              value={stats.total} 
              color="indigo" 
            />
          </div>
        </header>

        {/* --- TABS NAVIGATION --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
          <nav className="-mb-px flex space-x-8">
            <TabButton 
              id="logs" 
              label={t('attendance:tabs.logs')} 
              icon={<span className="text-lg">📋</span>} 
            />
            <TabButton 
              id="summary" 
              label={t('attendance:tabs.summary')} 
              icon={<ChartBarIcon className="h-5 w-5" />} 
            />
          </nav>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === 'logs' ? (
          <div className="space-y-6">
            {/* --- FILTERS TOOLBAR --- */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-800">{t('attendance:filters.title')}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {t('attendance:reset')}
                  </button>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>{t('attendance:export')}</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.employeeId')}
                  </label>
                  <div className="relative">
                    <UserGroupIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                    <input
                      type="text"
                      name="employeeId"
                      value={filters.employeeId}
                      onChange={handleFilterChange}
                      placeholder={t('attendance:filters.placeholder_employee')}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
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
                      value={filters.startDate}
                      onChange={handleFilterChange}
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
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('attendance:filters.eventType')}
                  </label>
                  <select
                    name="eventType"
                    value={filters.eventType}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                  >
                    <option value="">{t('attendance:filters.all')}</option>
                    <option value="check_in">{t('attendance:filters.checkIn')}</option>
                    <option value="check_out">{t('attendance:filters.checkOut')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* --- ATTENDANCE TABLE --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.employeeId')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.timestamp')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.eventType')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.deviceId')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('attendance:table.matchScore')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-20 text-center">
                          <div className="flex flex-col items-center">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute animate-ping h-8 w-8 rounded-full bg-indigo-400 opacity-20"></div>
                              <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading attendance logs...</p>
                          </div>
                        </td>
                      </tr>
                    ) : attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-16 text-center">
                          <div className="flex flex-col items-center text-slate-400">
                            <div className="h-16 w-16 mb-4">
                              <ClockIcon className="h-full w-full opacity-50" />
                            </div>
                            <p className="font-medium">{t('attendance:noRecords')}</p>
                            {Object.values(filters).some(v => v !== '') && (
                              <p className="text-sm mt-1">Try adjusting your filters</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      attendanceLogs.map((log, index) => {
                        const formattedTime = formatTimestamp(log.timestamp);
                        return (
                          <tr key={index} className="group hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:from-indigo-100 group-hover:to-indigo-200 transition-all">
                                  {log.employee_id && log.employee_id.length > 0 ? log.employee_id.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{log.employee_id}</p>
                                  <p className="text-xs font-medium text-slate-500">Employee</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-700">{formattedTime.date}</div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">
                                {formattedTime.time}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge type={log.event_type} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                {log.device_id || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-bold ${
                                log.match_score > 0.8 
                                  ? 'text-emerald-600' 
                                  : log.match_score > 0.6 
                                  ? 'text-amber-600' 
                                  : 'text-slate-500'
                              }`}>
                                {log.match_score ? `${(log.match_score * 100).toFixed(1)}%` : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* --- PAGINATION FOOTER --- */}
              {attendanceLogs.length > 0 && (
                <footer className="bg-slate-50/80 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-500">
                    Showing <span className="text-slate-900">page {pagination.page}</span> of{' '}
                    <span className="text-slate-900">{pagination.pages}</span>
                    <span className={`text-slate-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>({pagination.total} records)</span>
                  </p>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button 
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      {isRTL ? <ChevronRightIcon className="h-5 w-5 text-slate-600" /> : <ChevronLeftIcon className="h-5 w-5 text-slate-600" />}
                    </button>
                    
                    {getPageNumbers().map(num => (
                      <button
                        key={num}
                        onClick={() => setPagination(prev => ({ ...prev, page: num }))}
                        className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${
                          pagination.page === num 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}

                    <button 
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      {isRTL ? <ChevronLeftIcon className="h-5 w-5 text-slate-600" /> : <ChevronRightIcon className="h-5 w-5 text-slate-600" />}
                    </button>
                  </div>
                </footer>
              )}
            </div>
          </div>
        ) : (
          /* --- ATTENDANCE SUMMARY TAB --- */
          <div className="space-y-6">
            {/* --- SUMMARY FILTERS TOOLBAR --- */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-800">Attendance Summary</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetSummaryFilters}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Reset
                  </button>
                  {attendanceSummary && (
                    <button
                      onClick={exportSummaryToCSV}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>Export Summary</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    Employee ID
                  </label>
                  <div className="relative">
                    <UsersIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                    <input
                      type="text"
                      name="employeeId"
                      value={summaryFilters.employeeId}
                      onChange={handleSummaryFilterChange}
                      placeholder="Enter Employee ID (e.g., EMP001)"
                      className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    Start Date
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
                    End Date
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

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                  Make sure Employee ID exists in the database
                </div>
                <button
                  onClick={fetchAttendanceSummary}
                  disabled={!summaryFilters.employeeId || summaryLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {summaryLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      Get Summary
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
                  <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading attendance summary...</p>
                </div>
              </div>
            ) : attendanceSummary ? (
              <div className="space-y-6">
                {/* --- SUMMARY HEADER --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{attendanceSummary.employee_id}</h3>
                      <p className="text-sm text-slate-500">
                        Period: {attendanceSummary.start_date} to {attendanceSummary.end_date}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Days</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {attendanceSummary.totals?.total_days || attendanceSummary.daily_summaries.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Days with Records</p>
                        <p className="text-2xl font-black text-blue-600">
                          {attendanceSummary.totals?.days_with_records || attendanceSummary.daily_summaries.filter(d => d.total_records > 0).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complete Days</p>
                        <p className="text-2xl font-black text-emerald-600">
                          {attendanceSummary.totals?.complete_days || attendanceSummary.daily_summaries.filter(d => d.is_complete).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Hours</p>
                        <p className="text-2xl font-black text-purple-600">
                          {attendanceSummary.totals?.worked_hours || attendanceSummary.daily_summaries.reduce((sum, d) => sum + (d.worked_hours || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- DAILY SUMMARIES GRID --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Daily Attendance</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span>Complete</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <span>Absent</span>
                      </div>
                    </div>
                  </div>
                  {attendanceSummary.daily_summaries.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">No attendance records found for this period</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {attendanceSummary.daily_summaries.map((day, index) => (
                        <SummaryDayCard key={index} day={day} />
                      ))}
                    </div>
                  )}
                </div>

                {/* --- DETAILED TABLE VIEW --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Detailed View</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Day</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Check-in</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Check-out</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Worked Hours</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Records</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceSummary.daily_summaries.map((day, index) => {
                          const status = getDayStatus(day) || 'no_data';
                          return (
                            <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-slate-700">{day.date}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">{day.day_of_week}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatTime(day.check_in) || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-800">
                                  {formatTime(day.check_out) || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-bold ${day.worked_hours > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {day.worked_hours || 0} hours
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
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Summary Available</h3>
                  <p className="text-slate-500 mb-6">Enter an employee ID and date range to view attendance summary</p>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <InformationCircleIcon className="h-4 w-4" />
                    <span>Enter Employee ID in the field above to get started</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* --- ITEMS PER PAGE SELECTOR (hidden on summary tab) --- */}
      {activeTab === 'logs' && (
        <div className="fixed bottom-6 right-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-lg shadow-slate-300/20">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <span>Show:</span>
            <select
              value={pagination.limit}
              onChange={(e) => { 
                setPagination(prev => ({ 
                  ...prev, 
                  limit: Number(e.target.value), 
                  page: 1 
                })); 
              }}
              className="bg-transparent border-none p-0 focus:ring-0 text-indigo-600 font-bold cursor-pointer"
            >
              {[10, 25, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;