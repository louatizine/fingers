import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import { settingsAPI, companyAPI } from '../services/api'
import { useTranslation } from 'react-i18next'
import { 
  GlobeAltIcon, 
  CalendarIcon, 
  UsersIcon, 
  CalculatorIcon,
  CheckCircleIcon, 
  ArrowPathIcon, 
  InformationCircleIcon, 
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

/**
 * Settings Management Page - Modern Professional Design
 */
export default function Settings() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('holiday')
  const [settings, setSettings] = useState({
    language: 'english',
    monthlyVacationDays: 2.5,
    probationPeriodMonths: 3,
    includeWeekends: false,
    maxConsecutiveDays: 30
  })
  const [attendanceSettings, setAttendanceSettings] = useState({
    checkInStart: '08:00',
    checkOutEnd: '17:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  })
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [employeeVacations, setEmployeeVacations] = useState([])
  const [recalculating, setRecalculating] = useState(false)

  // --- Effects ---
  useEffect(() => {
    loadSettings()
    loadCompanies()
    loadEmployeeVacations()
    loadAttendanceSettings()
  }, [])

  // --- Data Loading Logic ---
  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings()
      const loadedSettings = response.data.settings
      setSettings({
        language: loadedSettings.language || 'english',
        monthlyVacationDays: parseFloat(loadedSettings.monthlyVacationDays) || 2.5,
        probationPeriodMonths: parseInt(loadedSettings.probationPeriodMonths) || 3,
        includeWeekends: Boolean(loadedSettings.includeWeekends),
        maxConsecutiveDays: parseInt(loadedSettings.maxConsecutiveDays) || 30
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error(t('settings.messages.loadFailed'))
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await companyAPI.getCompanies()
      setCompanies(response.data.companies || [])
    } catch (error) {
      console.error('Failed to load companies:', error)
    }
  }

  const loadEmployeeVacations = async () => {
    try {
      const response = await settingsAPI.getEmployeeVacations()
      setEmployeeVacations(response.data.vacations || [])
    } catch (error) {
      console.error('Failed to load employee vacations:', error)
    }
  }

  const loadAttendanceSettings = async () => {
    try {
      const response = await settingsAPI.getAttendanceSettings()
      if (response.data.success) {
        setAttendanceSettings(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load attendance settings:', error)
    }
  }

  // --- Handlers ---
  const handleSaveAttendanceSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await settingsAPI.updateAttendanceSettings(attendanceSettings)
      toast.success('Attendance settings updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update attendance settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await settingsAPI.updateSettings(settings)
      toast.success(t('settings.messages.saveSuccess'))
      
      // Recalculate all employee balances
      setRecalculating(true)
      await settingsAPI.recalculateAllBalances()
      toast.success(t('settings.messages.recalculateSuccess'))
      
      loadEmployeeVacations() // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.error || t('settings.messages.saveFailed'))
    } finally {
      setLoading(false)
      setRecalculating(false)
    }
  }

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : 
              type === 'select-one' ? value : value
    }))
  }

  const handleAttendanceSettingsChange = (e) => {
    const { name, value } = e.target
    setAttendanceSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleWorkingDayToggle = (day) => {
    setAttendanceSettings(prev => {
      const currentDays = [...prev.workingDays]
      if (currentDays.includes(day)) {
        return { ...prev, workingDays: currentDays.filter(d => d !== day) }
      } else {
        return { ...prev, workingDays: [...currentDays, day] }
      }
    })
  }

  // --- Calculation Logic ---
  const calculateVacationBalance = (employee) => {
    const {
      monthlyVacationDays,
      probationPeriodMonths
    } = settings
    
    if (!employee.hire_date) {
      return {
        earned: 0,
        used: 0,
        balance: 0,
        monthsService: 0,
        monthsAfterProbation: 0
      }
    }
    
    const startDate = new Date(employee.hire_date)
    const today = new Date()
    
    // Calculate months of service (excluding probation)
    const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                      (today.getMonth() - startDate.getMonth())
    const monthsAfterProbation = Math.max(0, monthsDiff - probationPeriodMonths)
    
    // Calculate earned days
    let earnedDays = monthsAfterProbation * monthlyVacationDays
    
    // Subtract used days
    const usedDays = employee.used_vacation_days || employee.vacation_used || 0
    const balance = earnedDays - usedDays
    
    return {
      earned: parseFloat(earnedDays.toFixed(2)),
      used: parseFloat(usedDays.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      monthsService: monthsDiff,
      monthsAfterProbation: monthsAfterProbation
    }
  }

  // --- UI Components ---
  const TabButton = ({ id, label, icon: Icon }) => (
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
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )

  const StatCard = ({ icon: Icon, label, value, color = 'indigo', unit = '' }) => {
    const colorClasses = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' }
    }
    const colors = colorClasses[color] || colorClasses.indigo
    
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-slate-800">{value}<span className="text-sm text-slate-500 ml-1">{unit}</span></p>
          </div>
        </div>
      </div>
    )
  }

  const SettingCard = ({ title, subtitle, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center">
          <div className={`h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-4`}>
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Cog6ToothIcon className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {t('settings.title')}
              </h1>
            </div>
            <p className={`text-slate-500 font-medium ${isRTL ? 'mr-1' : 'ml-1'}`}>
              {t('settings.subtitle') || 'Configure system settings and policies'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap gap-4">
            <StatCard 
              icon={BuildingOfficeIcon} 
              label="Companies" 
              value={companies.length} 
              color="indigo" 
            />
            <StatCard 
              icon={UserGroupIcon} 
              label="Employees Tracked" 
              value={employeeVacations.length} 
              color="emerald" 
            />
            <StatCard 
              icon={CalculatorIcon} 
              label="Monthly Vacation" 
              value={settings.monthlyVacationDays} 
              unit="days"
              color="blue" 
            />
          </div>
        </header>

        {/* --- TABS NAVIGATION --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
          <nav className="-mb-px flex space-x-8">
            <TabButton 
              id="holiday" 
              label={t('settings.tabs.holiday')} 
              icon={CalendarIcon}
            />
            <TabButton 
              id="attendance" 
              label={t('settings.attendance.title')} 
              icon={ClockIcon}
            />
          </nav>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === 'holiday' ? (
          <div className="space-y-6">
            {/* Holiday Settings Form */}
            <SettingCard
              title={t('settings.holiday.configTitle')}
              subtitle={t('settings.holiday.configSubtitle')}
              icon={CalculatorIcon}
            >
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language Setting */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.language.title')}
                    </label>
                    <div className="relative">
                      <GlobeAltIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                      <select
                        name="language"
                        value={settings.language}
                        onChange={handleSettingsChange}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium`}
                      >
                        <option value="english">English</option>
                        <option value="arabic">العربية</option>
                      </select>
                    </div>
                  </div>

                  {/* Monthly Vacation Days */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.monthlyVacationDays')}
                    </label>
                    <input
                      type="number"
                      name="monthlyVacationDays"
                      value={settings.monthlyVacationDays}
                      onChange={handleSettingsChange}
                      step="0.5"
                      min="0"
                      max="30"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {t('settings.holiday.daysPerMonthHint')}
                    </p>
                  </div>

                  {/* Probation Period */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.probationPeriodMonths')}
                    </label>
                    <input
                      type="number"
                      name="probationPeriodMonths"
                      value={settings.probationPeriodMonths}
                      onChange={handleSettingsChange}
                      min="0"
                      max="12"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  {/* Max Consecutive Days */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.maxConsecutiveDays')}
                    </label>
                    <input
                      type="number"
                      name="maxConsecutiveDays"
                      value={settings.maxConsecutiveDays}
                      onChange={handleSettingsChange}
                      min="1"
                      max="365"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Checkbox Options */}
                <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <input
                    type="checkbox"
                    id="includeWeekends"
                    name="includeWeekends"
                    checked={settings.includeWeekends}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <label htmlFor="includeWeekends" className={`text-sm font-medium text-slate-700 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    {t('settings.includeWeekends')}
                  </label>
                </div>

                {/* Information Note */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {t('settings.holiday.saveNote')}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {t('settings.holiday.recalculateNote')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <InformationCircleIcon className="h-4 w-4" />
                    <span>Changes affect all employees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => loadSettings()}
                      className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      {t('settings.actions.reset')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || recalculating}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {recalculating ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          {t('settings.actions.recalculating')}
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          {t('settings.actions.saveRecalculate')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </SettingCard>

            {/* Employee Vacation Balances Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mr-4">
                    <UsersIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t('settings.employeeBalances.title')}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {t('settings.employeeBalances.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className={`w-full border-collapse ${isRTL ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.name')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.hireDate')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.monthsService')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.earned')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.used')}</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.employeeBalances.balance')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeVacations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-16 text-center">
                          <div className="flex flex-col items-center text-slate-400">
                            <UsersIcon className="h-16 w-16 mb-4 opacity-50" />
                            <p className="font-medium">{t('settings.employeeBalances.noRecords')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      employeeVacations.map((employee, index) => {
                        const balance = calculateVacationBalance(employee)
                        const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee'
                        const initials = (employee.first_name?.charAt(0) || '') + (employee.last_name?.charAt(0) || '') || 'E'
                        return (
                          <tr key={index} className="group hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:from-indigo-100 group-hover:to-indigo-200 transition-all">
                                  {initials}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{fullName}</p>
                                  <p className="text-xs font-medium text-slate-500">{employee.email || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-700">
                                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: '2-digit', 
                                  year: 'numeric' 
                                }) : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-700">{balance.monthsService}</div>
                              <div className="text-xs text-slate-500 font-medium">
                                after probation: {balance.monthsAfterProbation}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-emerald-600">{balance.earned} days</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-amber-600">{balance.used} days</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`text-sm font-bold ${balance.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {balance.balance} days
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Attendance Settings Tab */
          <div className="space-y-6">
            <SettingCard
              title={t('settings.attendance.configTitle')}
              subtitle={t('settings.attendance.configSubtitle')}
              icon={ClockIcon}
            >
              <form onSubmit={handleSaveAttendanceSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Check-in Start Time */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.attendance.checkInStart')}
                    </label>
                    <div className="relative">
                      <ClockIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                      <input
                        type="time"
                        name="checkInStart"
                        value={attendanceSettings.checkInStart}
                        onChange={handleAttendanceSettingsChange}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium`}
                      />
                    </div>
                  </div>

                  {/* Check-out End Time */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.attendance.checkOutEnd')}
                    </label>
                    <div className="relative">
                      <ClockIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
                      <input
                        type="time"
                        name="checkOutEnd"
                        value={attendanceSettings.checkOutEnd}
                        onChange={handleAttendanceSettingsChange}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium`}
                      />
                    </div>
                  </div>

                  {/* Lunch Break Start */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.attendance.lunchBreakStart')}
                    </label>
                    <input
                      type="time"
                      name="lunchBreakStart"
                      value={attendanceSettings.lunchBreakStart}
                      onChange={handleAttendanceSettingsChange}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  {/* Lunch Break End */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                      {t('settings.attendance.lunchBreakEnd')}
                    </label>
                    <input
                      type="time"
                      name="lunchBreakEnd"
                      value={attendanceSettings.lunchBreakEnd}
                      onChange={handleAttendanceSettingsChange}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Working Days Selection */}
                <div>
                  <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {t('settings.attendance.workingDays')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleWorkingDayToggle(day)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          attendanceSettings.workingDays.includes(day)
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-medium">
                    Selected days: {attendanceSettings.workingDays.join(', ')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => loadAttendanceSettings()}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    {t('settings.actions.reset')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        {t('settings.actions.saving')}
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        {t('settings.actions.saveSettings')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SettingCard>
          </div>
        )}
    </div>
  )
}