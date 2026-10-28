import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useDirection } from '../hooks/useDirection'
import { CUBE_COLORS } from './ui/CubeBar'
import { sectionFor } from '../config/brand'
import { ShellProvider, useShell } from '../context/ShellContext'

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

function Shell() {
  const { isRTL } = useDirection()
  const { t } = useTranslation()
  const location = useLocation()
  const section = sectionFor(location.pathname)
  const { collapsed } = useShell()

  const sectionKey = SECTION_KEYS[location.pathname]
  const pageTitle = sectionKey ? t(sectionKey) : t('branding.title')

  useEffect(() => {
    document.title = `${pageTitle} · Dynamix`
  }, [pageTitle])

  const pad = collapsed
    ? isRTL
      ? 'lg:pr-20'
      : 'lg:pl-20'
    : isRTL
      ? 'lg:pr-64'
      : 'lg:pl-64'

  return (
    <div
      className={`relative flex min-h-screen transition-[padding] duration-300 ease-out ${pad}`}
      style={{ '--section': section.color, '--section-ink': section.ink, '--section-tint': section.tint }}
    >
      <a href="#main-content" className="skip-link">
        {t('nav.skipToContent')}
      </a>

      {/* Soft wash of the current section colour — the page "knows where it is" */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background: `radial-gradient(900px 420px at ${isRTL ? '10%' : '90%'} -8%, ${section.tint}, transparent 62%)`,
        }}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-[3px]" aria-hidden="true">
        {CUBE_COLORS.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <Sidebar />
      <div className="relative z-[1] flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="w-full flex-1 px-4 pb-12 pt-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-[1400px] animate-fadeIn">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <ShellProvider>
      <Shell />
    </ShellProvider>
  )
}
