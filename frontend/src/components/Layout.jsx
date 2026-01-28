import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useDirection } from '../hooks/useDirection'

export default function Layout() {
  const { isRTL } = useDirection()

  return (
    <div className={`relative flex min-h-screen bg-slate-50 ${isRTL ? 'lg:pr-80' : 'lg:pl-80'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
