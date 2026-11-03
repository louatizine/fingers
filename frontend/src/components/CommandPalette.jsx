import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import { avatarFor } from '../config/brand'
import { isMacPlatform } from '../utils/greeting'
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  FlagIcon,
  CogIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from './ui/icons'
import { CubeBar } from './ui/CubeBar'
import Kbd from './ui/Kbd'

const PAGES = [
  { id: 'dashboard', href: '/dashboard', icon: HomeIcon, labelKey: 'nav.dashboard', roles: ['admin', 'supervisor', 'employee'] },
  { id: 'employees', href: '/employees', icon: UsersIcon, labelKey: 'nav.employees', roles: ['admin', 'supervisor'] },
  { id: 'leaves', href: '/leaves', icon: CalendarIcon, labelKey: 'nav.leaves', roles: ['admin', 'supervisor', 'employee'] },
  { id: 'holidays', href: '/holidays', icon: FlagIcon, labelKey: 'nav.holidays', roles: ['admin', 'supervisor', 'employee'] },
  { id: 'advances', href: '/salary-advances', icon: CurrencyDollarIcon, labelKey: 'nav.salary_advances', roles: ['admin', 'supervisor', 'employee'] },
  { id: 'projects', href: '/projects', icon: BriefcaseIcon, labelKey: 'nav.projects', roles: ['admin', 'supervisor', 'employee'], employeeRequiresProjects: true },
  { id: 'attendance', href: '/attendance', icon: ClockIcon, labelKey: 'nav.attendance', roles: ['admin', 'supervisor'] },
  { id: 'settings', href: '/settings', icon: CogIcon, labelKey: 'nav.settings', roles: ['supervisor'] },
  { id: 'profile', href: '/profile', icon: UserCircleIcon, labelKey: 'nav.profile', roles: ['admin', 'supervisor', 'employee'] },
]

function matchesRole(item, user) {
  if (!item.roles.includes(user?.role)) return false
  if (user?.role === 'employee' && item.employeeRequiresProjects) return user?.has_projects === true
  return true
}

function Highlight({ text, query }) {
  if (!query) return text
  const hay = text.toLowerCase()
  const needle = query.toLowerCase()
  const index = hay.indexOf(needle)
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[2px] bg-brand-yellow/70 text-inherit">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

export default function CommandPalette({ open, onClose }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [people, setPeople] = useState([])
  const isMac = isMacPlatform()

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const id = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (user?.role !== 'admin' && user?.role !== 'supervisor') return
    let cancelled = false
    userAPI
      .getUsers()
      .then((res) => {
        if (!cancelled) setPeople(res.data?.users || [])
      })
      .catch(() => {
        if (!cancelled) setPeople([])
      })
    return () => {
      cancelled = true
    }
  }, [open, user?.role])

  const q = query.trim().toLowerCase()

  const pageItems = useMemo(() => {
    return PAGES.filter((item) => matchesRole(item, user))
      .map((item) => ({
        ...item,
        kind: 'page',
        label: t(item.labelKey),
        run: () => navigate(item.href),
      }))
      .filter((item) => !q || item.label.toLowerCase().includes(q))
  }, [user, t, navigate, q])

  const peopleItems = useMemo(() => {
    if (q.length < 2) return []
    return people
      .filter((person) => {
        const hay = `${person.first_name || ''} ${person.last_name || ''} ${person.email || ''} ${person.department || ''} ${person.employee_id || ''}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 8)
      .map((person) => ({
        kind: 'person',
        id: person._id,
        label: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
        hint: person.department || person.email,
        person,
        run: () => navigate('/employees'),
      }))
  }, [people, q, navigate])

  const actionItems = useMemo(() => {
    const actions = [
      {
        id: 'act-leave',
        label: t('command.requestLeave'),
        icon: CalendarIcon,
        run: () => navigate('/leaves'),
      },
      {
        id: 'act-advance',
        label: t('command.requestAdvance'),
        icon: CurrencyDollarIcon,
        run: () => navigate('/salary-advances'),
      },
      {
        id: 'act-profile',
        label: t('command.profile'),
        icon: UserCircleIcon,
        run: () => navigate('/profile'),
      },
      {
        id: 'act-logout',
        label: t('command.logout'),
        icon: ArrowRightOnRectangleIcon,
        danger: true,
        run: () => {
          logout()
          navigate('/login')
        },
      },
    ]
    return actions
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .map((item) => ({ ...item, kind: 'action' }))
  }, [t, navigate, logout, q])

  const groups = [
    { key: 'pages', label: t('command.pages'), items: pageItems },
    { key: 'people', label: t('command.people'), items: peopleItems },
    { key: 'actions', label: t('command.actions'), items: actionItems },
  ].filter((group) => group.items.length > 0)

  const flat = groups.flatMap((group) => group.items)

  useEffect(() => {
    setActive(0)
  }, [query])

  const run = (item) => {
    if (!item) return
    onClose()
    item.run()
  }

  const onKeyDown = (event) => {
    if (!flat.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + flat.length) % flat.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(flat.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(flat[active])
    }
  }

  let cursor = -1

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 pt-[12vh] sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 -translate-y-2 scale-[0.98]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 -translate-y-1 scale-[0.98]"
          >
            <Dialog.Panel className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.75} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t('command.placeholder')}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                  aria-autocomplete="list"
                  aria-controls="command-results"
                />
                <Kbd>esc</Kbd>
              </div>

              <div id="command-results" role="listbox" className="max-h-[min(420px,50vh)] overflow-y-auto py-2">
                {flat.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">{t('command.empty')}</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.key} className="px-2 pb-2">
                      <p className="kicker px-3 py-2">{group.label}</p>
                      <ul>
                        {group.items.map((item) => {
                          cursor += 1
                          const index = cursor
                          const selected = index === active
                          const Icon = item.icon
                          const tone = item.kind === 'person' ? avatarFor(item.label) : null
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => run(item)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors ${
                                  selected ? 'bg-slate-50' : ''
                                } ${item.danger ? 'text-brand-red' : 'text-slate-800'}`}
                              >
                                {item.kind === 'person' ? (
                                  <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-xs font-semibold"
                                    style={{ backgroundColor: tone.color, color: tone.on }}
                                  >
                                    {`${item.person.first_name?.[0] || ''}${item.person.last_name?.[0] || ''}`.toUpperCase()}
                                  </span>
                                ) : (
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                      selected ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold">
                                    <Highlight text={item.label} query={q} />
                                  </span>
                                  {item.hint && (
                                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.hint}</span>
                                  )}
                                </span>
                                {selected && <span className="kicker !text-[9px]">{t('command.open')}</span>}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
                <CubeBar width="w-3" height="h-[2px]" />
                <p className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span>{t('command.hint')}</span>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}K</Kbd>
                </p>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
