import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
  FingerPrintIcon, 
  TrashIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function FingerprintManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEnrolledUsers();
  }, []);

  const fetchEnrolledUsers = async () => {
    setLoading(true);
    try {
      console.log('[FingerprintManagement] Fetching all users from:', `${API_URL}/terminal/users`);
      const response = await axios.get(`${API_URL}/terminal/users`);
      console.log('[FingerprintManagement] Response:', response.data);
      
      if (response.data.data) {
        // Show ALL users, both enrolled and pending
        const users = response.data.data;
        console.log('[FingerprintManagement] Total users:', users.length);
        setEnrolledUsers(users);
        console.log(`[FingerprintManagement] Set ${users.length} users (both enrolled and pending)`);
      } else {
        console.warn('[FingerprintManagement] Response has no data:', response.data);
        setEnrolledUsers([]);
      }
    } catch (error) {
      console.error('[FingerprintManagement] Error fetching users:', error);
      console.error('[FingerprintManagement] Error details:', error.response?.data);
      setEnrolledUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = enrolledUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Debug logging
  console.log('[FingerprintManagement] Render state:', {
    enrolledUsersCount: enrolledUsers.length,
    filteredUsersCount: filteredUsers.length,
    currentUsersCount: currentUsers.length,
    loading,
    searchTerm
  });

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) endPage = maxPagesToShow;
      if (currentPage >= totalPages - 2) startPage = totalPages - maxPagesToShow + 1;
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handleRemoveFingerprint = async () => {
    if (!selectedUser) return;
    try {
      const response = await axios.delete(`${API_URL}/fingerprint/remove-template/${selectedUser.employee_id}`);
      if (response.data.success) {
        setShowRemoveModal(false);
        setSelectedUser(null);
        fetchEnrolledUsers();
      }
    } catch (error) {
      console.error('Error removing fingerprint:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <FingerPrintIcon className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {t('fingerprint:title')}
              </h1>
            </div>
            <p className={`text-slate-500 font-medium ${isRTL ? 'mr-1' : 'ml-1'}`}>
              {t('fingerprint:subtitle') || 'Biometric identity management and enrollment logs'}
            </p>
          </div>

          {/* Real-time Stat Badge */}
          <div className="flex gap-3">
            <div className={`flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm ${isRTL ? 'pl-6' : 'pr-6'}`}>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FingerPrintIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrolled</p>
                <p className="text-xl font-black text-slate-800">{enrolledUsers.filter(u => u.fingerprint_template_id).length}</p>
              </div>
            </div>
            <div className={`flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm ${isRTL ? 'pl-6' : 'pr-6'}`}>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                <p className="text-xl font-black text-slate-800">{enrolledUsers.filter(u => !u.fingerprint_template_id).length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* --- TOOLBAR: Search & Filters --- */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative w-full lg:max-w-md">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium`}
            />
          </div>
          
          <div className={`flex items-center gap-3 w-full lg:w-auto ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-3 rounded-xl">
              <FunnelIcon className="h-4 w-4" />
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent border-none p-0 focus:ring-0 text-indigo-600 font-bold cursor-pointer"
              >
                {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fingerprint:table.userIdentity')}</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fingerprint:table.department')}</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fingerprint:table.hardwareId')}</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('fingerprint:table.dateEnrolled')}</th>
                  <th className={`px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>{t('fingerprint:table.action')}</th>
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
                        <p className="mt-4 text-slate-500 font-medium animate-pulse">Syncing biometric data...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                          <FingerPrintIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">
                          {searchTerm ? 'No users found' : 'No enrolled fingerprints'}
                        </h3>
                        <p className="text-slate-500 font-medium">
                          {searchTerm 
                            ? `No users match "${searchTerm}". Try a different search term.`
                            : 'No users have enrolled their fingerprints yet. Use the desktop app to enroll users.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : currentUsers.map((user) => {
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  const hasFingerprint = !!user.fingerprint_template_id;
                  
                  return (
                  <tr key={user.employee_id} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:from-indigo-100 group-hover:to-indigo-200 transition-all">
                          {fullName.charAt(0) || 'U'}
                          {hasFingerprint ? (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <FingerPrintIcon className="h-2.5 w-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                              <ExclamationTriangleIcon className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{fullName || 'Unknown'}</p>
                          <p className="text-xs font-medium text-slate-500">ID: {user.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {user.department || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasFingerprint ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <DevicePhoneMobileIcon className="h-4 w-4 text-slate-400" />
                            {user.device_id || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <IdentificationIcon className="h-3 w-3" />
                            <span className="font-mono truncate max-w-[200px]" title={user.fingerprint_template_id}>
                              {user.fingerprint_template_id?.substring(0, 16)}...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          <span>Pending Enrollment</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hasFingerprint && user.enrolled_at ? (
                        <>
                          <div className="text-sm font-semibold text-slate-700">{formatDate(user.enrolled_at)}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">
                            at {new Date(user.enrolled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400 italic">Not enrolled yet</div>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                      {hasFingerprint ? (
                        <button
                          onClick={() => { setSelectedUser(user); setShowRemoveModal(true); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          title="Remove fingerprint"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No action</span>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION FOOTER --- */}
          <footer className="bg-slate-50/80 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-500">
              Showing <span className="text-slate-900">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)}</span> of {filteredUsers.length}
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              
              {getPageNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${
                    currentPage === num
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </footer>
        </div>

      {/* --- REFINED MODAL --- */}
      {showRemoveModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRemoveModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Revoke Enrollment?</h3>
              <p className="text-slate-500 font-medium mb-6">
                This will permanently delete the fingerprint data for <span className="text-slate-900 font-bold">{selectedUser.full_name}</span>. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Keep it
                </button>
                <button
                  onClick={handleRemoveFingerprint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95 transition-all"
                  aria-label={t('common.remove')}
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FingerprintManagement;