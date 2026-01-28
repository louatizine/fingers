import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userAPI, settingsAPI } from '../services/api'
import { useToast } from '../components/Toast'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import { 
  UserIcon, 
  PencilSquareIcon, 
  XMarkIcon, 
  CheckIcon, 
  PhoneIcon, 
  BriefcaseIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function Profile() {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  
  const [editing, setEditing] = useState(false)
  const [vacationBalance, setVacationBalance] = useState(0)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || ''
  })

  useEffect(() => {
    if (user?.role === 'employee' && user?._id) {
      loadVacationBalance()
    }
  }, [user])

  const loadVacationBalance = async () => {
    try {
      const response = await settingsAPI.calculateEmployeeBalance(user._id)
      setVacationBalance(response.data.balance || 0)
    } catch (error) {
      setVacationBalance(user.vacation_balance || 0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await userAPI.updateUser(user._id, formData)
      await refreshUser()
      setEditing(false)
      toast.success(t('profile.messages.updateSuccess'))
    } catch (error) {
      toast.error(error.response?.data?.error || t('profile.messages.updateError'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('profile.title')}</h1>
          <p className="text-base text-slate-500 mt-2 font-medium">{t('profile.accountDetails')}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
            editing 
            ? 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300' 
            : 'bg-gradient-to-r from-azure to-azure-dark text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {editing ? (
            <><XMarkIcon className="h-5 w-5" /> {t('common.cancel')}</>
          ) : (
            <><PencilSquareIcon className="h-5 w-5" /> {t('profile.editButton')}</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl shadow-premium border border-white/60 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {t('profile.personalInfo')}
              </h3>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: t('profile.form.firstName'), key: 'first_name', type: 'text' },
                    { label: t('profile.form.lastName'), key: 'last_name', type: 'text' },
                    { label: t('profile.form.phone'), key: 'phone', type: 'tel' },
                    { label: t('profile.form.department'), key: 'department', type: 'text' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full border-2 border-slate-200 focus:border-azure focus:ring-2 focus:ring-azure/20 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium transition-all duration-200"
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('profile.form.position')}
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full border-2 border-slate-200 focus:border-azure focus:ring-2 focus:ring-azure/20 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-6">
                  <button type="submit" className="bg-gradient-to-r from-azure to-azure-dark text-white px-8 py-3 rounded-2xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" /> {t('profile.saveButton')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
                <ProfileDetail icon={UserIcon} label={t('profile.fields.fullName')} value={`${user?.first_name} ${user?.last_name}`} isRTL={isRTL} />
                <ProfileDetail icon={EnvelopeIcon} label={t('profile.fields.email')} value={user?.email} isRTL={isRTL} />
                <ProfileDetail icon={PhoneIcon} label={t('profile.fields.phone')} value={user?.phone || t('profile.notProvided')} isRTL={isRTL} />
                <ProfileDetail icon={BuildingOfficeIcon} label={t('profile.fields.department')} value={user?.department} isRTL={isRTL} />
                <ProfileDetail icon={BriefcaseIcon} label={t('profile.fields.position')} value={user?.position} isRTL={isRTL} />
                
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Status</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    user?.is_active ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-status-success ring-1 ring-status-success/20' : 'bg-gradient-to-r from-red-50 to-red-100 text-status-error ring-1 ring-status-error/20'
                  }`}>
                    <span className={`h-2 w-2 rounded-full mr-2 ${isRTL ? 'ml-2 mr-0' : 'mr-2'} ${user?.is_active ? 'bg-status-success' : 'bg-status-error'}`} />
                    {user?.is_active ? t('status.active') : t('status.inactive')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Balance Cards */}
        <div className="space-y-6">
          <BalanceCard 
            title={t('profile.leaveBalance.annual')} 
            value={vacationBalance.toFixed(2)} 
            color="from-azure to-azure-dark" 
            label={t('profile.leaveBalance.basedOnTenure')}
          />
          <BalanceCard 
            title={t('profile.leaveBalance.sick')} 
            value={user?.leave_balance?.sick || 0} 
            color="from-status-success to-emerald-600" 
            label={t('profile.leaveBalance.companyPolicy')}
          />
          <BalanceCard 
            title={t('profile.leaveBalance.unpaid')} 
            value={user?.leave_balance?.unpaid || 0} 
            color="from-status-warning to-amber-600" 
            label={t('profile.leaveBalance.companyPolicy')}
          />
        </div>
      </div>
    </div>
  )
}

function ProfileDetail({ icon: Icon, label, value, isRTL }) {
  return (
    <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <div className="overflow-hidden">
        <dt className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</dt>
        <dd className="text-sm font-bold text-slate-900 truncate mt-1.5">{value}</dd>
      </div>
    </div>
  )
}

function BalanceCard({ title, value, color, label }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl shadow-premium border border-white/60 rounded-2xl p-7 group hover:shadow-glow transition-all duration-300">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        <span className="text-sm text-slate-400 font-semibold">days</span>
      </div>
      {/* Premium Gradient Indicator */}
      <div className={`h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner`}>
        <div className={`h-full bg-gradient-to-r ${color} rounded-full shadow-sm transition-all duration-500 group-hover:scale-105`} style={{ width: '60%' }} />
      </div>
      <p className="text-xs text-slate-400 font-medium mt-3">{label}</p>
    </div>
  )
}