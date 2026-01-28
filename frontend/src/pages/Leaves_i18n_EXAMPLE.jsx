/**
 * EXAMPLE: Fully Refactored Leaves.jsx with i18n
 * 
 * This is a complete example showing how to refactor a page component
 * from using uiText to using react-i18next.
 * 
 * Key changes:
 * 1. Import useTranslation instead of uiText
 * 2. Use t() function for all text
 * 3. Use interpolation syntax for dynamic text
 * 4. All hardcoded strings removed
 */

import { useEffect, useState } from 'react'
import { leaveAPI, settingsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useTranslation } from 'react-i18next'  // ← Changed from uiText
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Leaves() {
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()  // ← Added translation hook
  
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [vacationBalance, setVacationBalance] = useState(0)
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    days: 1,
    reason: ''
  })

  useEffect(() => {
    loadLeaves()
    if (user.role === 'employee') {
      loadVacationBalance()
    }
  }, [])

  const loadLeaves = async () => {
    try {
      const response = await leaveAPI.getLeaves()
      setLeaves(response.data.leaves)
    } catch (error) {
      console.error('Failed to load leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVacationBalance = async () => {
    try {
      const response = await settingsAPI.calculateEmployeeBalance(user._id)
      setVacationBalance(response.data.balance || 0)
    } catch (error) {
      console.error('Failed to load vacation balance:', error)
      setVacationBalance(user.vacation_balance || 0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await leaveAPI.createLeave(formData)
      
      // Check if request was made with insufficient balance
      if (response.data.insufficient_balance === true) {
        // ✅ Using interpolation instead of .replace()
        toast.warning(
          t('leaves.messages.insufficient_warning', { 
            available: Number(response.data.current_balance || 0).toFixed(2),
            requested: response.data.requested_days
          }),
          { duration: 6000 }
        )
      } else {
        toast.success(t('leaves.messages.success'))  // ← Translation key
      }
      
      setShowModal(false)
      setFormData({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        days: 1,
        reason: ''
      })
      loadLeaves()
      loadVacationBalance()
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'))  // ← Translation key
    }
  }

  const handleApprove = async (id) => {
    if (!window.confirm(t('leaves.messages.confirm_approve'))) return  // ← Translation key
    
    try {
      await leaveAPI.approveLeave(id, '')
      loadLeaves()
      toast.success(t('leaves.messages.approved'))  // ← Translation key
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'))
    }
  }

  const handleReject = async (id) => {
    const comment = window.prompt(t('leaves.messages.rejection_reason'))  // ← Translation key
    if (comment === null) return
    
    try {
      await leaveAPI.rejectLeave(id, comment)
      loadLeaves()
      toast.success(t('leaves.messages.rejected'))  // ← Translation key
    } catch (error) {
      toast.error(error.response?.data?.error || t('leaves.messages.failed'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('leaves.title')}</h1>
          {/* ✅ Hardcoded French text removed, would need translation key */}
          <p className="text-sm text-gray-600 mt-1">{t('leaves.subtitle')}</p>
        </div>
        {user.role === 'employee' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:-translate-y-0.5"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('leaves.new_request')}  {/* ← Translation key */}
          </button>
        )}
      </div>

      {/* Leave Balance */}
      {user.role === 'employee' && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-[#323130] mb-6">
            {t('leaves.your_balance')}  {/* ← Translation key */}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Annual Leave Balance */}
            <div className={`p-6 rounded-xl border-2 shadow-md transition-all duration-200 ${
              vacationBalance <= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400'
            }`}>
              <p className="text-sm text-gray-700 font-semibold mb-2">
                🏖️ {t('leaves.annual_leave')}  {/* ← Translation key */}
              </p>
              <p className={`text-4xl font-bold ${vacationBalance <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {vacationBalance.toFixed(2)} {t('time.days')}  {/* ← Translation key */}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('leaves.calculated_from_settings')}  {/* ← Translation key */}
              </p>
              {vacationBalance <= 0 && (
                <p className="text-xs text-red-600 font-semibold mt-2">
                  ⚠️ {t('leaves.insufficient_balance')}  {/* ← Translation key */}
                </p>
              )}
            </div>
            
            {/* Sick Leave Balance */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-400 shadow-md">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                🤒 {t('leaves.sick_leave')}  {/* ← Translation key */}
              </p>
              <p className="text-4xl font-bold text-green-600">
                {user.leave_balance?.sick || 0} {t('time.days')}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('leaves.company_policy')}  {/* ← Translation key */}
              </p>
            </div>
            
            {/* Unpaid Leave */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-400 shadow-md">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                💼 {t('leaves.unpaid_leave')}  {/* ← Translation key */}
              </p>
              <p className="text-4xl font-bold text-orange-600">
                {user.leave_balance?.unpaid || 0} {t('time.days')}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('leaves.company_policy')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaves Table */}
      <div className="bg-white shadow-lg overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
              <tr>
                {user.role !== 'employee' && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('leaves.table.employee')}  {/* ← Translation key */}
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('leaves.table.type')}  {/* ← Translation key */}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('leaves.table.dates')}  {/* ← Translation key */}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('leaves.table.days')}  {/* ← Translation key */}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('leaves.table.reason')}  {/* ← Translation key */}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('leaves.table.status')}  {/* ← Translation key */}
                </th>
                {user.role !== 'employee' && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('leaves.table.actions')}  {/* ← Translation key */}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                  {user.role !== 'employee' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{leave.user_name}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* ✅ Dynamic translation key based on leave type */}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {t(`leaveTypes.${leave.leave_type}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {leave.days} {t('time.days')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* ✅ Dynamic translation for status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(`status.${leave.status}`)}
                    </span>
                  </td>
                  {user.role !== 'employee' && leave.status === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleApprove(leave._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {t('actions.approve')}  {/* ← Translation key */}
                      </button>
                      <button
                        onClick={() => handleReject(leave._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {t('actions.reject')}  {/* ← Translation key */}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900 opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('leaves.modal.title')}  {/* ← Translation key */}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('leaves.modal.leave_type')}  {/* ← Translation key */}
                  </label>
                  <select
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {/* ✅ Options with translated labels */}
                    <option value="annual">{t('leaveTypes.annual')}</option>
                    <option value="sick">{t('leaveTypes.sick')}</option>
                    <option value="unpaid">{t('leaveTypes.unpaid')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('leaves.modal.start_date')}  {/* ← Translation key */}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('leaves.modal.end_date')}  {/* ← Translation key */}
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('leaves.modal.number_of_days')}  {/* ← Translation key */}
                  </label>
                  <input
                    type="number"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('leaves.modal.reason')}  {/* ← Translation key */}
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {t('leaves.modal.submit')}  {/* ← Translation key */}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {t('leaves.modal.cancel')}  {/* ← Translation key */}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * KEY CHANGES MADE:
 * 
 * 1. Replaced: import { uiText } from '../config/uiText.fr'
 *    With:     import { useTranslation } from 'react-i18next'
 * 
 * 2. Added: const { t } = useTranslation()
 * 
 * 3. Replaced all: uiText.leaves.title
 *    With:         t('leaves.title')
 * 
 * 4. Changed interpolation from:
 *    uiText.leaves.messages.insufficient_warning
 *      .replace('{available}', balance)
 *      .replace('{requested}', days)
 *    
 *    To:
 *    t('leaves.messages.insufficient_warning', { 
 *      available: balance, 
 *      requested: days 
 *    })
 * 
 * 5. Dynamic translations:
 *    t(`leaveTypes.${leave.leave_type}`)
 *    t(`status.${leave.status}`)
 * 
 * 6. All hardcoded French strings removed
 * 
 * TESTING:
 * - Test in French (default)
 * - Switch to English - all text should change
 * - Switch to Arabic - text should change + RTL layout
 * - Verify form submissions still work
 * - Check toast notifications translate correctly
 */
