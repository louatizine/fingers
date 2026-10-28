import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userAPI, settingsAPI } from '../services/api'
import { useToast } from '../components/Toast'
import { useTranslation } from 'react-i18next'
import {
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon
} from '../components/ui/icons'
import PageHeader from '../components/ui/PageHeader'
import { BRAND, avatarFor } from '../config/brand'

export default function Profile() {
  const { t } = useTranslation()
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

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
  const me = avatarFor(`${user?.first_name || ''} ${user?.last_name || ''}`)

  const editableFields = [
    { label: t('profile.form.firstName'), key: 'first_name', type: 'text' },
    { label: t('profile.form.lastName'), key: 'last_name', type: 'text' },
    { label: t('profile.form.phone'), key: 'phone', type: 'tel' },
    { label: t('profile.form.department'), key: 'department', type: 'text' },
    { label: t('profile.form.position'), key: 'position', type: 'text', wide: true }
  ]

  const details = [
    { label: t('profile.fields.fullName'), value: `${user?.first_name} ${user?.last_name}` },
    { label: t('profile.fields.email'), value: user?.email },
    { label: t('profile.fields.phone'), value: user?.phone || t('profile.notProvided') },
    { label: t('profile.fields.department'), value: user?.department },
    { label: t('profile.fields.position'), value: user?.position }
  ]

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        icon={UserIcon}
        kicker={t('nav.profile')}
        title={t('profile.title')}
        subtitle={t('profile.accountDetails')}
        actions={
          <button
            onClick={() => setEditing(!editing)}
            className={editing ? 'btn-secondary' : 'btn-primary'}
          >
            {editing ? (
              <><XMarkIcon className="h-5 w-5" /> {t('common.cancel')}</>
            ) : (
              <><PencilSquareIcon className="h-5 w-5" /> {t('profile.editButton')}</>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity sheet */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <div className="flex items-center gap-5 border-b border-slate-200 px-6 py-6 md:px-8">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-medium"
              style={{ backgroundColor: me.color, color: me.on }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-medium text-slate-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${user?.is_active ? 'bg-brand-green' : 'bg-brand-red'}`}
                  aria-hidden="true"
                />
                {user?.is_active ? t('status.active') : t('status.inactive')}
                {user?.position && <span className="text-slate-300">/</span>}
                {user?.position}
              </p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {editableFields.map((field) => (
                  <div key={field.key} className={field.wide ? 'md:col-span-2' : ''}>
                    <label className="kicker mb-2 block">{field.label}</label>
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="field"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button type="submit" className="btn-primary">
                  <CheckIcon className="h-5 w-5" /> {t('profile.saveButton')}
                </button>
              </div>
            </form>
          ) : (
            <dl className="divide-y divide-slate-100">
              {details.map((item) => (
                <div key={item.label} className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-3 sm:gap-4 md:px-8">
                  <dt className="kicker self-center">{item.label}</dt>
                  <dd className="truncate text-[15px] font-medium text-slate-900 sm:col-span-2">{item.value || '—'}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Balances */}
        <div className="space-y-4">
          <BalanceCard
            title={t('profile.leaveBalance.annual')}
            value={Number(vacationBalance).toFixed(2)}
            accent={BRAND.violet}
            label={t('profile.leaveBalance.basedOnTenure')}
            unit={t('time.days')}
          />
          <BalanceCard
            title={t('profile.leaveBalance.sick')}
            value={user?.leave_balance?.sick || 0}
            accent={BRAND.green}
            label={t('profile.leaveBalance.companyPolicy')}
            unit={t('time.days')}
          />
          <BalanceCard
            title={t('profile.leaveBalance.unpaid')}
            value={user?.leave_balance?.unpaid || 0}
            accent={BRAND.yellow}
            label={t('profile.leaveBalance.companyPolicy')}
            unit={t('time.days')}
          />
        </div>
      </div>
    </div>
  )
}

function BalanceCard({ title, value, accent, label, unit }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <span className="absolute inset-y-0 start-0 w-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />
      <p className="kicker">{title}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-5xl font-light leading-none tabular-nums text-slate-900">{value}</span>
        <span className="font-display text-lg italic text-slate-400">{unit}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{label}</p>
    </div>
  )
}
