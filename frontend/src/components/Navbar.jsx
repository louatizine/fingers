import { Fragment, useState, useEffect, createContext } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import { useShell } from '../context/ShellContext'
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from './ui/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { CubeLoader } from './ui/CubeBar'
import { sectionFor, avatarFor } from '../config/brand'
import apiClient from '../services/api'
import { format } from 'date-fns'
import { fr, ar } from 'date-fns/locale'
import LiveClock from './ui/LiveClock'
import Kbd from './ui/Kbd'
import { isMacPlatform } from '../utils/greeting'

export const NavbarContext = createContext({ fetchNotifications: () => {} })

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { isRTL } = useDirection()
  const { setCommandOpen } = useShell()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isMac = isMacPlatform()

  const SECTION_KEYS = {
    '/dashboard': 'nav.dashboard',
    '/employees': 'nav.employees',
    '/leaves': 'nav.leaves',
    '/holidays': 'nav.holidays',
    '/salary-advances': 'nav.salary_advances',
    '/projects': 'nav.projects',
    '/attendance': 'nav.attendance',
    '/settings': 'nav.settings',
    '/profile': 'nav.profile',
  }
  const section = sectionFor(location.pathname)
  const me = avatarFor(`${user?.first_name || ''} ${user?.last_name || ''}`)
  const sectionKey = SECTION_KEYS[location.pathname]
  const sectionTitle = sectionKey ? t(sectionKey) : t('branding.title')

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/notifications', { withCredentials: true })
      if (response.data && response.data.success && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count', { withCredentials: true })
      if (response.data && response.data.success) {
        setUnreadCount(response.data.count)
      }
    } catch {
      /* keep last known count */
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showNotifications) fetchNotifications()
  }, [showNotifications])

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`, {}, { withCredentials: true })
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.post('/notifications/read-all', {}, { withCredentials: true })
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await apiClient.delete(`/notifications/${notificationId}`, { withCredentials: true })
      const notification = notifications.find((n) => n._id === notificationId)
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request':
      case 'leave_status':
        return CalendarIcon
      case 'salary_advance':
      case 'salary_advance_status':
        return CurrencyDollarIcon
      case 'project_assignment':
        return BriefcaseIcon
      default:
        return BellIcon
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'leave_request':
        return 'bg-primary-50/70'
      case 'leave_status':
        return 'bg-[#EAF7EC]/70'
      case 'salary_advance':
        return 'bg-[#FDF6D6]/70'
      case 'salary_advance_status':
        return 'bg-primary-50/70'
      case 'project_assignment':
        return 'bg-primary-50/70'
      default:
        return 'bg-slate-50'
    }
  }

  const getNotificationBorder = (type) => {
    switch (type) {
      case 'leave_request':
        return 'border-l-primary'
      case 'leave_status':
        return 'border-l-emerald-500'
      case 'salary_advance':
        return 'border-l-amber-500'
      case 'salary_advance_status':
        return 'border-l-purple-500'
      case 'project_assignment':
        return 'border-l-primary-400'
      default:
        return 'border-l-slate-500'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))

      if (diffInMinutes < 60) {
        return t('notifications.minutesAgo', { count: diffInMinutes })
      }
      if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return t('notifications.hoursAgo', { count: hours })
      }
      return format(date, 'MMM d, yyyy', {
        locale: i18n.language === 'ar' ? ar : fr,
      })
    } catch {
      return t('notifications.recently')
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id)

    switch (notification.type) {
      case 'leave_request':
      case 'leave_status':
        navigate(`/leaves/${notification.related_id}`)
        break
      case 'salary_advance':
      case 'salary_advance_status':
        navigate(`/salary-advances/${notification.related_id}`)
        break
      case 'project_assignment':
        navigate(`/projects/${notification.related_id}`)
        break
      default:
        break
    }
    setShowNotifications(false)
  }

  const NotificationItem = ({ notification }) => {
    const Icon = getNotificationIcon(notification.type)
    const bgColor = getNotificationColor(notification.type)
    const borderColor = getNotificationBorder(notification.type)

    return (
      <div
        className={`flex cursor-pointer items-start gap-3 p-4 transition-colors duration-150 hover:bg-slate-50 ${
          !notification.is_read ? bgColor : ''
        } border-s-2 ${borderColor}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
            {notification.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{notification.message}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <ClockIcon className="h-3 w-3" />
            {formatDate(notification.created_at)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                markAsRead(notification._id)
              }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              title={t('notifications.markAsRead')}
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => deleteNotification(notification._id, e)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title={t('notifications.delete')}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <NavbarContext.Provider value={{ fetchNotifications }}>
      <nav className="sticky top-0 z-30 w-full border-b border-slate-200 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <span className="kicker hidden sm:inline">Dynamix</span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
              /
            </span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: section.color }} aria-hidden="true" />
            <span className="truncate text-sm font-semibold text-slate-900">{sectionTitle}</span>
            <span className="hidden border-s border-slate-200 ps-3 md:inline">
              <LiveClock variant="compact" />
            </span>
          </div>

          <div className="mx-8 hidden max-w-md flex-1 lg:block">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 text-start text-sm text-slate-400 transition-colors hover:border-primary-200 hover:bg-white hover:text-slate-600"
            >
              <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{t('nav.searchJump')}</span>
              <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary lg:hidden"
              aria-label={t('common.search')}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            <LanguageSwitcher />

            <div className="h-6 w-px bg-slate-200" />

            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:border-primary-200 hover:bg-primary-50 hover:text-primary"
                  >
                    <BellIcon
                      className={`h-5 w-5 ${open ? 'text-primary' : 'text-slate-600'} transition-colors duration-150`}
                      strokeWidth={1.5}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-red px-1 font-mono text-[10px] font-semibold text-white ring-2 ring-paper">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition duration-200 ease-out"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition duration-150 ease-in"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-1"
                  >
                    <Menu.Items className="absolute end-0 mt-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display text-xl font-medium text-slate-900">{t('notifications.title')}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {unreadCount > 0
                                ? t('notifications.unreadCount', { count: unreadCount })
                                : t('notifications.allRead')}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm font-medium text-primary transition-colors hover:text-primary-600"
                            >
                              {t('notifications.markAllAsRead')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-[480px] overflow-y-auto">
                        {isLoading ? (
                          <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <CubeLoader size="h-2.5 w-2.5" />
                            <p className="kicker">{t('notifications.loading')}</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-300">
                              <BellIcon className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-medium text-slate-700">{t('notifications.emptyTitle')}</p>
                            <p className="mt-1 text-sm text-slate-500">{t('notifications.empty')}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => (
                              <Menu.Item key={notification._id}>
                                {({ active }) => (
                                  <div className={active ? 'bg-white/30' : ''}>
                                    <NotificationItem notification={notification} />
                                  </div>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="border-t border-slate-100 p-3">
                          <Link
                            to="/notifications"
                            className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                            onClick={() => setShowNotifications(false)}
                          >
                            {t('notifications.viewAll')}
                            <ChevronRightIcon className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                          </Link>
                        </div>
                      )}
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1 pe-2.5 ps-1 transition-colors duration-150 hover:border-primary-200 hover:bg-primary-50">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md font-display text-sm font-semibold"
                  style={{ backgroundColor: me.color, color: me.on }}
                >
                  {user?.first_name?.[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-[180px] flex-col items-start leading-tight lg:flex">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="max-w-full truncate text-xs text-slate-500">{user?.email}</span>
                </span>
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-150 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
              >
                <Menu.Items className="absolute end-0 mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-lg font-semibold"
                        style={{ backgroundColor: me.color, color: me.on }}
                      >
                        {user?.first_name?.[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active ? 'bg-primary-50 text-primary' : 'text-slate-700'
                          }`}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                          {t('nav.profile')}
                        </Link>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active ? 'bg-[#FCEBEE] text-brand-red' : 'text-brand-red'
                          }`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
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
    </NavbarContext.Provider>
  )
}
