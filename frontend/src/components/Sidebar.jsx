import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import { useShell } from '../context/ShellContext'
import {
  HomeIcon, UsersIcon, CalendarIcon, CurrencyDollarIcon,
  BriefcaseIcon, CogIcon, Bars3Icon, XMarkIcon,
  ClockIcon, FlagIcon, ChevronLeftIcon, ChevronRightIcon
} from './ui/icons'
import { CubeBar, CUBE_COLORS } from './ui/CubeBar'
import { CUBE, SECTION_COLORS, avatarFor } from '../config/brand'
import Kbd from './ui/Kbd'
import { isMacPlatform } from '../utils/greeting'

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const location = useLocation()
  const { collapsed, toggleCollapsed, setCommandOpen } = useShell()
  const isMac = isMacPlatform()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: HomeIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.employees'), href: '/employees', icon: UsersIcon, roles: ['admin', 'supervisor'] },
    { name: t('nav.leaves'), href: '/leaves', icon: CalendarIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.holidays'), href: '/holidays', icon: FlagIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.salary_advances'), href: '/salary-advances', icon: CurrencyDollarIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.projects'), href: '/projects', icon: BriefcaseIcon, roles: ['admin', 'supervisor', 'employee'], employeeRequiresProjects: true },
    { name: t('nav.attendance'), href: '/attendance', icon: ClockIcon, roles: ['admin', 'supervisor'] },
    { name: t('nav.settings'), href: '/settings', icon: CogIcon, roles: ['supervisor'] },
  ]

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles.includes(user?.role)) return false
    if (user?.role === 'employee' && item.employeeRequiresProjects) return user?.has_projects === true
    return true
  })

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
  const me = avatarFor(`${user?.first_name || ''} ${user?.last_name || ''}`)
  const CollapseIcon = (isRTL ? !collapsed : collapsed) ? ChevronRightIcon : ChevronLeftIcon

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 z-50 flex flex-col bg-paper-deep transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
          isRTL ? 'right-0 border-l' : 'left-0 border-r'
        } border-slate-200 ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'} ${
          collapsed ? 'w-64 lg:w-20' : 'w-64'
        }`}
      >
        <div className={`flex h-20 shrink-0 items-center gap-3 ${collapsed ? 'lg:justify-center lg:px-0' : ''} px-6`}>
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('nav.dashboard')}
            className="flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <img src="/cube.png" alt="" className="h-10 w-auto" />
            <div className={`leading-none ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="font-display text-[22px] font-medium tracking-tight text-primary">Dynamix</p>
              <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-brand-red">services</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ms-auto rounded-md p-1.5 text-slate-500 hover:bg-white lg:hidden"
            aria-label={t('nav.closeMenu')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {collapsed ? (
          <div className="hidden flex-col items-center gap-[3px] py-1 lg:flex" aria-hidden="true">
            {CUBE_COLORS.map((color) => (
              <span key={color} className="h-3 w-[3px] rounded-full" style={{ backgroundColor: color }} />
            ))}
          </div>
        ) : (
          <div className="px-6">
            <CubeBar width="w-4" className="opacity-90" />
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto py-6 ${collapsed ? 'lg:px-2' : 'px-3'}`} aria-label={t('nav.main')}>
          <ul className="space-y-0.5">
            {filteredNavigation.map((item, index) => {
              const isActive = location.pathname === item.href
              const tone = CUBE[SECTION_COLORS[item.href] || 'violet']
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.name : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    style={{ '--tone-tint': tone.tint }}
                    className={`group relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors duration-150 ${
                      collapsed ? 'lg:justify-center lg:px-0 lg:pe-0 lg:ps-0' : 'pe-3 ps-4'
                    } ${
                      isActive
                        ? 'bg-white font-semibold text-slate-900 shadow-soft ring-1 ring-slate-200'
                        : 'font-medium text-slate-600 hover:bg-[var(--tone-tint)] hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-2 start-0 w-[3px] rounded-full"
                        style={{ backgroundColor: tone.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`w-5 font-mono text-[10px] tabular-nums ${collapsed ? 'lg:hidden' : ''}`}
                      style={{ color: tone.ink, opacity: isActive ? 1 : 0.55 }}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <item.icon
                      className="h-[18px] w-[18px] shrink-0 transition-opacity"
                      style={{ color: tone.ink, opacity: isActive ? 1 : 0.6 }}
                      strokeWidth={1.75}
                    />
                    <span className={`flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className={`shrink-0 border-t border-slate-200 ${collapsed ? 'lg:p-2' : 'p-3'}`}>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            title={t('nav.searchJump')}
            className={`mb-2 hidden w-full items-center gap-2 rounded-lg border border-slate-200 bg-white/70 py-2 text-start text-xs text-slate-500 transition-colors hover:border-primary-200 hover:bg-white lg:flex ${
              collapsed ? 'lg:justify-center lg:px-0' : 'px-3'
            }`}
          >
            {collapsed ? (
              <Kbd>K</Kbd>
            ) : (
              <>
                <span className="flex-1 truncate">{t('nav.searchJump')}</span>
                <Kbd className="ms-auto">{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
              </>
            )}
          </button>

          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            title={collapsed ? `${user?.first_name} ${user?.last_name}` : undefined}
            className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/70 ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-semibold"
              style={{ backgroundColor: me.color, color: me.on }}
            >
              {initials}
            </span>
            <span className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-sm font-semibold text-slate-900">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="kicker mt-0.5 block !text-[10px]">
                {t(`roles.${user?.role}`, { defaultValue: user?.role })}
              </span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          className="absolute top-[4.75rem] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-primary-200 hover:text-primary lg:flex"
          style={isRTL ? { left: '-12px' } : { right: '-12px' }}
        >
          <CollapseIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </aside>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label={t('nav.openMenu')}
          className={`fixed bottom-6 z-40 rounded-lg bg-primary p-3.5 text-white shadow-lg transition-transform duration-150 hover:bg-primary-600 active:scale-95 lg:hidden ${isRTL ? 'left-6' : 'right-6'}`}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}
    </>
  )
}
