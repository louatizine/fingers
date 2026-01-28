import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import { UserCircleIcon, ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useDirection()

  const today = new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <nav className="sticky top-0 z-30 flex h-16 flex-shrink-0 border-b border-white/40 bg-white/80 backdrop-blur-lg shadow-[0_12px_40px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:backdrop-blur-lg">
      <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex flex-col leading-tight ${isRTL ? 'items-end text-right' : ''}`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t('dashboard.welcome', { name: user?.first_name || '' })}
            </span>
            <span className="text-sm font-medium text-neutral-charcoal">{today}</span>
          </div>
        </div>

        <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            className="relative inline-flex items-center justify-center rounded-full border border-white/70 bg-neutral-light/70 p-2 text-neutral-dark transition-all hover:-translate-y-0.5 hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            aria-label={t('nav.notifications', { defaultValue: 'Notifications' })}
          >
            <BellIcon className="h-5 w-5" />
            <span
              className={`absolute top-1.5 h-2 w-2 rounded-full bg-status-error ring-2 ring-white ${isRTL ? 'left-1.5' : 'right-1.5'}`}
            />
          </button>

          <div className="hidden h-7 w-px bg-neutral-medium/60 md:block" />

          <Menu as="div" className="relative">
            <Menu.Button className="group inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-2.5 py-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-light via-white to-neutral-light text-primary font-semibold shadow-inner">
                {user?.first_name?.[0] || '?'}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
              </div>
              <div className="hidden min-w-[120px] md:flex flex-col text-left leading-tight">
                <p className="text-sm font-semibold text-neutral-charcoal group-hover:text-primary transition-colors">{user?.first_name} {user?.last_name}</p>
                <span className="text-xs text-neutral-dark truncate">{user?.email}</span>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={`absolute mt-2 w-60 rounded-lg bg-white/95 shadow-2xl ring-1 ring-black/5 border border-neutral-medium/40 focus:outline-none backdrop-blur-xl ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}
              >
                <div className="px-4 py-3 border-b border-neutral-medium/50 bg-neutral-light/60">
                  <p className="text-sm font-semibold text-neutral-charcoal">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-neutral-dark truncate">{user?.email}</p>
                </div>

                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-neutral-light text-primary' : 'text-neutral-charcoal'} ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        {t('nav.profile')}
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-neutral-light text-status-error' : 'text-status-error'} ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        {t('nav.logout')}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  )
}