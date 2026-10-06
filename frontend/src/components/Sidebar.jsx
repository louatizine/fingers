import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import dynLogo from '../assets/logo-dynamix 2.png'
import {
  HomeIcon, UsersIcon, CalendarIcon, CurrencyDollarIcon,
  BriefcaseIcon, CogIcon, Bars3Icon,
  ClockIcon, FingerPrintIcon, FlagIcon
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const location = useLocation()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: HomeIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.employees'), href: '/employees', icon: UsersIcon, roles: ['admin', 'supervisor'] },
/*     { name: t('nav.leaves'), href: '/leaves', icon: CalendarIcon, roles: ['admin', 'supervisor', 'employee'] },
 */    { name: t('nav.holidays'), href: '/holidays', icon: FlagIcon, roles: ['admin', 'supervisor', 'employee'] },
/*     { name: t('nav.salary_advances'), href: '/salary-advances', icon: CurrencyDollarIcon, roles: ['admin', 'supervisor', 'employee'] },
 */    { name: t('nav.projects'), href: '/projects', icon: BriefcaseIcon, roles: ['admin', 'supervisor', 'employee'], employeeRequiresProjects: true },
    { name: t('nav.attendance'), href: '/attendance', icon: ClockIcon, roles: ['admin', 'supervisor'] },
/*     { name: t('nav.fingerprint'), href: '/fingerprint', icon: FingerPrintIcon, roles: ['admin', 'supervisor'] },
 */    
/* { name: t('nav.settings'), href: '/settings', icon: CogIcon, roles: ['supervisor'] },
 */  ]

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles.includes(user?.role)) return false
    if (user?.role === 'employee' && item.employeeRequiresProjects) return user?.has_projects === true
    return true
  })

  return (
    <>
      {/* Mobile Overlay with blur */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`fixed inset-y-0 z-50 flex w-72 flex-col border-r border-brand-border bg-white/95 shadow-[8px_0_30px_rgba(59,33,118,0.08)] backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
        } ${isRTL ? 'right-0' : 'left-0'}`}>

        <div className="relative flex h-24 items-center overflow-hidden border-b border-brand-border bg-white px-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-blue to-brand-green" />
          <img
            src={dynLogo}
            alt="Dynamix Services"
            className="h-auto w-full max-w-[220px] object-contain"
          />
        </div>

        {/* Navigation with modern styling */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : ''
                      } ${isActive
                        ? 'bg-gradient-to-r from-primary to-brand-blue text-white shadow-lg shadow-primary-200/40'
                        : 'text-neutral-charcoal hover:bg-primary-50/80 hover:text-primary'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`rounded-xl p-2 transition-transform group-hover:scale-105 ${isActive ? 'bg-white/15' : 'bg-primary-50'
                      }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-primary-500'}`} />
                    </div>
                    <span className="flex-1">{item.name}</span>

                    {isActive && (
                      <div className="h-7 w-1 rounded-full bg-white"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile Card - Glass Effect */}
      {/*   <div className="p-3 border-t border-white/20">
          <div className={`flex items-center gap-3 p-3 rounded-2xl glass-dark hover:bg-white/10 transition-all cursor-pointer group ${isRTL ? 'flex-row-reverse text-right' : ''
            }`}>
            <div className="relative">
              <div className="h-11 w-11 rounded-full bg-gradient-purple flex items-center justify-center text-white font-bold text-sm shadow-glow-purple">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-status-success border-2 border-white"></div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-white/70 capitalize">{user?.role}</p>
            </div>
          </div>
        </div> */}
      </aside>

      {/* Floating Mobile Toggle Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed bottom-6 z-40 rounded-xl bg-primary p-3.5 text-white shadow-large transition-all duration-200 hover:scale-105 hover:bg-primary-600 lg:hidden ${isRTL ? 'left-6' : 'right-6'
            }`}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}
    </>
  )
}