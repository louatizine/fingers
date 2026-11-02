import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { departmentAPI, userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { UsersIcon, PlusIcon } from '../components/ui/icons'

export default function Departments() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const isAdmin = user?.role === 'admin'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', managerIds: [] })

  const load = async () => {
    setLoading(true)
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentAPI.getDepartments(),
        userAPI.getUsers(),
      ])
      setDepartments(deptRes.data.departments || [])
      setUsers((userRes.data.users || userRes.data || []).filter((item) => item.role === 'supervisor' || item.role === 'admin'))
    } catch (error) {
      toast.error(error.response?.data?.error || t('departments.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', managerIds: [] })
    setShowForm(true)
  }

  const openEdit = (department) => {
    setEditing(department)
    setForm({ name: department.name, managerIds: department.managerIds || [] })
    setShowForm(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await departmentAPI.updateDepartment(editing._id, form)
        toast.success(t('departments.updated'))
      } else {
        await departmentAPI.createDepartment(form)
        toast.success(t('departments.created'))
      }
      setShowForm(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('departments.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (department) => {
    const ok = await confirm({
      title: t('departments.delete'),
      message: t('departments.deleteConfirm'),
      type: 'danger',
    })
    if (!ok) return
    try {
      await departmentAPI.deleteDepartment(department._id)
      toast.success(t('departments.deleted'))
      await load()
    } catch (error) {
      toast.error(error.response?.data?.error || t('departments.saveFailed'))
    }
  }

  if (loading) return <LoadingSpinner message={t('departments.loading')} />

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={UsersIcon}
        kicker={t('departments.kicker')}
        title={t('departments.title')}
        subtitle={t('departments.subtitle')}
        actions={(
          <button type="button" className="btn-primary" onClick={openCreate}>
            <PlusIcon className="h-5 w-5" />
            <span>{t('departments.add')}</span>
          </button>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <article key={department._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="font-bold text-slate-900">{department.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('departments.managers')}: {(department.managerIds || []).length
                ? (department.managerIds || []).map((id) => {
                  const manager = users.find((item) => item._id === id)
                  return manager ? `${manager.first_name} ${manager.last_name}` : id
                }).join(', ')
                : t('departments.noManagers')}
            </p>
            <div className="mt-4 flex gap-3">
              <button type="button" className="text-xs font-bold text-primary" onClick={() => openEdit(department)}>{t('common.edit')}</button>
              {isAdmin && <button type="button" className="text-xs font-bold text-rose-600" onClick={() => remove(department)}>{t('common.delete')}</button>}
            </div>
          </article>
        ))}
        {!departments.length && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {t('departments.empty')}
          </p>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowForm(false)} />
          <form onSubmit={submit} className="relative w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">{editing ? t('departments.edit') : t('departments.add')}</h2>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder={t('departments.name')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
            <label className="block space-y-1 text-sm font-bold text-slate-600">
              {t('departments.managers')}
              <select
                multiple
                value={form.managerIds}
                onChange={(event) => setForm({
                  ...form,
                  managerIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                })}
                className="min-h-[8rem] w-full rounded-xl border border-slate-200 px-3 py-2 font-normal"
              >
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.first_name} {item.last_name} ({item.role})
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-slate-400">{t('departments.multiHint')}</span>
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
