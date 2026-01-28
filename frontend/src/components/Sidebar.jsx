import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import {
  HomeIcon, UsersIcon, CalendarIcon, CurrencyDollarIcon,
  BriefcaseIcon, CogIcon, Bars3Icon,
  ClockIcon, FingerPrintIcon
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
    { name: t('nav.leaves'), href: '/leaves', icon: CalendarIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.salary_advances'), href: '/salary-advances', icon: CurrencyDollarIcon, roles: ['admin', 'supervisor', 'employee'] },
    { name: t('nav.projects'), href: '/projects', icon: BriefcaseIcon, roles: ['admin', 'supervisor', 'employee'], employeeRequiresProjects: true },
    { name: t('nav.attendance'), href: '/attendance', icon: ClockIcon, roles: ['admin', 'supervisor'] },
    { name: t('nav.fingerprint'), href: '/fingerprint', icon: FingerPrintIcon, roles: ['admin', 'supervisor'] },
    { name: t('nav.settings'), href: '/settings', icon: CogIcon, roles: ['supervisor'] },
  ]

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

      <aside className={`fixed inset-y-0 z-50 flex w-80 flex-col glass border-r border-white/30 shadow-large transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
        } ${isRTL ? 'right-0' : 'left-0'}`}>

        {/* Premium Header with Gradient */}
        <div className="relative h-20 flex items-center px-6 bg-gradient-primary overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className={`relative flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-glow">
              <BriefcaseIcon className="h-6 w-6 text-white" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-lg font-bold text-white tracking-tight">{t('branding.title')}</h1>
              <p className="text-xs text-white/80 font-medium">{t('branding.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Navigation with modern styling */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : ''
                      } ${isActive
                        ? 'bg-gradient-primary text-white shadow-glow'
                        : 'text-neutral-charcoal hover:bg-white/60 hover:shadow-soft'
                      }`}
                  >
                    <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20' : 'bg-primary-50'
                      }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-primary-500'}`} />
                    </div>
                    <span className="flex-1">{item.name}</span>

                    {isActive && (
                      <div className="w-1.5 h-8 bg-white rounded-full"></div>
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
          className={`lg:hidden fixed bottom-6 z-40 p-4 rounded-2xl bg-gradient-primary text-white shadow-large hover:shadow-glow transition-all duration-200 hover:scale-105 ${isRTL ? 'left-6' : 'right-6'
            }`}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}
    </>
  )
}