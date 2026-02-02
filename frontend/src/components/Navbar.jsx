import React, { Fragment, useState, useEffect, createContext } from 'react'
import { Menu, Transition, Dialog } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useDirection } from '../hooks/useDirection'
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  BellIcon,
  XMarkIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  SwatchIcon,
  CheckIcon,
  TrashIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  MoonIcon,
  SunIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { 
  BellIcon as BellIconSolid,
  CheckCircleIcon as CheckCircleSolid
} from '@heroicons/react/24/solid'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import apiClient from '../services/api'
import { format } from 'date-fns'
import { fr, ar } from 'date-fns/locale'

export const NavbarContext = createContext({ fetchNotifications: () => {} })

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { isRTL } = useDirection()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const today = new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'fr-FR', {
    day: '2-digit', 
    month: 'short'
  })

  // ==========================================
  // NOTIFICATION FUNCTIONS - FULLY RESTORED
  // ==========================================
  const fetchNotifications = async () => {
    setIsLoading(true)
    console.log('[Navbar] Fetching notifications...')
    try {
      const response = await apiClient.get('/notifications', { withCredentials: true })
      console.log('[Navbar] API Response:', response.data)
      
      if (response.data && response.data.success && Array.isArray(response.data.notifications)) {
        console.log(`[Navbar] Setting ${response.data.notifications.length} notifications`)
        setNotifications(response.data.notifications)
      } else {
        console.log('[Navbar] No valid notifications found, setting empty array')
        setNotifications([])
      }
    } catch (error) {
      console.error('[Navbar] Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count', { withCredentials: true })
      console.log('[Navbar] Unread count response:', response.data)
      if (response.data && response.data.success) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('[Navbar] Failed to fetch notification count:', error)
    }
  }

  useEffect(() => {
    console.log('[Navbar] Initial load - fetching unread count')
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showNotifications) {
      console.log('[Navbar] Dropdown opened, fetching notifications')
      fetchNotifications()
    }
  }, [showNotifications])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  const markAsRead = async (notificationId) => {
    console.log(`[Navbar] Marking notification ${notificationId} as read`)
    try {
      await apiClient.post(`/notifications/${notificationId}/read`, {}, { withCredentials: true })
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    console.log('[Navbar] Marking all as read')
    try {
      const response = await apiClient.post('/notifications/read-all', {}, { withCredentials: true })
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    console.log(`[Navbar] Deleting notification ${notificationId}`)
    try {
      await apiClient.delete(`/notifications/${notificationId}`, { withCredentials: true })
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      const notification = notifications.find(n => n._id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch(type) {
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
    switch(type) {
      case 'leave_request':
        return 'from-blue-500/20 to-blue-500/5'
      case 'leave_status':
        return 'from-emerald-500/20 to-emerald-500/5'
      case 'salary_advance':
        return 'from-amber-500/20 to-amber-500/5'
      case 'salary_advance_status':
        return 'from-purple-500/20 to-purple-500/5'
      case 'project_assignment':
        return 'from-indigo-500/20 to-indigo-500/5'
      default:
        return 'from-slate-500/20 to-slate-500/5'
    }
  }

  const getNotificationBorder = (type) => {
    switch(type) {
      case 'leave_request': return 'border-l-blue-500'
      case 'leave_status': return 'border-l-emerald-500'
      case 'salary_advance': return 'border-l-amber-500'
      case 'salary_advance_status': return 'border-l-purple-500'
      case 'project_assignment': return 'border-l-indigo-500'
      default: return 'border-l-slate-500'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      
      if (diffInMinutes < 60) {
        return t('notifications.minutesAgo', { count: diffInMinutes })
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return t('notifications.hoursAgo', { count: hours })
      } else {
        return format(date, 'MMM d, yyyy', {
          locale: i18n.language === 'ar' ? ar : fr
        })
      }
    } catch (error) {
      return t('notifications.recently')
    }
  }

  const handleNotificationClick = (notification) => {
    console.log(`[Navbar] Clicked notification: ${notification._id}`, notification)
    markAsRead(notification._id)
    
    switch(notification.type) {
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

  // Notification Item Component - Restored with all functionality
  const NotificationItem = ({ notification }) => {
    const Icon = getNotificationIcon(notification.type)
    const bgColor = getNotificationColor(notification.type)
    const borderColor = getNotificationBorder(notification.type)
    
    return (
      <div 
        className={`flex items-start gap-3 p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
          !notification.is_read 
            ? `bg-gradient-to-r ${bgColor}` 
            : 'hover:bg-white/30 dark:hover:bg-white/5'
        } border-l-2 ${borderColor}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/50 dark:bg-white/5 flex items-center justify-center">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
              title={t('notifications.markAsRead')}
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => deleteNotification(notification._id, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          
          {/* Left: Brand & Date */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-400/80 uppercase tracking-[0.3em]">
                {today}
              </span>
              <h1 className="text-lg font-light text-slate-900 dark:text-white/90 tracking-tight">
                Welcome back, <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.first_name}</span>
              </h1>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-12 hidden lg:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-400/60 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 hover:scale-105 transition-all duration-300"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 text-amber-500" />
              ) : (
                <MoonIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="scale-90">
              <LanguageSwitcher />
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-300/30 to-transparent dark:via-white/10"></div>

            {/* NOTIFICATIONS - FULLY RESTORED */}
            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative h-12 w-12 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 hover:scale-105 transition-all duration-300"
                  >
                    <BellIcon className={`h-5 w-5 ${open ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'} transition-colors duration-300`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900 shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition duration-300 ease-out"
                    enterFrom="opacity-0 translate-y-4 scale-95"
                    enterTo="opacity-100 translate-y-0 scale-100"
                    leave="transition duration-200 ease-in"
                    leaveFrom="opacity-100 translate-y-0 scale-100"
                    leaveTo="opacity-0 translate-y-4 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-3 w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/50 dark:border-white/10 overflow-hidden">
                      {/* Header */}
                      <div className="p-6 border-b border-white/20 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {t('notifications.title')}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {unreadCount > 0 
                                ? t('notifications.unreadCount', { count: unreadCount })
                                : t('notifications.allRead')
                              }
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              {t('notifications.markAllAsRead')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="overflow-y-auto max-h-[480px]">
                        {isLoading ? (
                          <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500"></div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {t('notifications.loading')}
                            </p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                              <BellIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {t('notifications.emptyTitle')}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {t('notifications.empty')}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/20 dark:divide-white/10">
                            {notifications.map((notification) => (
                              <Menu.Item key={notification._id}>
                                {({ active }) => (
                                  <div className={active ? 'bg-white/30 dark:bg-white/5' : ''}>
                                    <NotificationItem notification={notification} />
                                  </div>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View All Link */}
                      {notifications.length > 0 && (
                        <div className="p-4 border-t border-white/20 dark:border-white/10">
                          <Link 
                            to="/notifications"
                            className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            onClick={() => setShowNotifications(false)}
                          >
                            {t('notifications.viewAll')}
                            <ChevronRightIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      )}
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>

            {/* Profile */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-3 px-1 py-1 rounded-2xl bg-gradient-to-r from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-white/50 dark:border-white/10 hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                    <div className="h-full w-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
                      {user?.first_name?.[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition duration-300 ease-out"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-200 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Menu.Items className="absolute right-0 mt-3 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/50 dark:border-white/10 overflow-hidden">
                  {/* User Info */}
                  <div className="p-6 border-b border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                        <div className="h-full w-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-lg font-bold">
                          {user?.first_name?.[0]?.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                            active 
                              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400' 
                              : 'text-slate-700 dark:text-slate-300'
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
                          className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                            active 
                              ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 dark:text-red-400' 
                              : 'text-red-600 dark:text-red-400'
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

      {/* Notification Detail Modal - Restored */}
      <Transition appear show={!!selectedNotification} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedNotification(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedNotification?.title}
                  </Dialog.Title>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                  {selectedNotification?.message}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <ClockIcon className="h-3 w-3" />
                  {selectedNotification && formatDate(selectedNotification.created_at)}
                </div>
                {selectedNotification?.related_id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('notifications.referenceId')}: </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      {selectedNotification.related_id}
                    </span>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Spacer */}
      <div className="h-20"></div>
    </NavbarContext.Provider>
  )
}