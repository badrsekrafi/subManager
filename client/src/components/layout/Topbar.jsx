import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitials } from '../../utils/formatters'
import api from '../../api/axios'
import { Link } from 'react-router-dom'

export default function Topbar({ onOpenSidebar }) {
  const { admin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [expiringCount, setExpiringCount] = useState(0)

  useEffect(() => {
    const fetchExpiring = async () => {
      try {
        const { data } = await api.get('/dashboard/expiring')
        if (data && data.subscriptions) {
          setExpiringCount(data.subscriptions.length)
        }
      } catch {
        // Silently handle if unauthenticated or error
      }
    }
    fetchExpiring()
    const interval = setInterval(fetchExpiring, 60000)
    return () => clearInterval(interval)
  }, [])

  // Format date in French
  const todayFormatted = new Intl.DateTimeFormat('fr-TN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Tunis',
  }).format(new Date())

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {todayFormatted}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Fuseau horaire : Africa/Tunis (TND)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Expirations alert notification */}
        <Link
          to="/expirations"
          title="Abonnements proches de l'expiration"
          className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {expiringCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
              {expiringCount}
            </span>
          )}
        </Link>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Admin profile snippet */}
        <Link
          to="/settings"
          className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-85 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-sm">
            {getInitials(admin?.name || 'Administrateur')}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
              {admin?.name || 'Administrateur'}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
              {admin?.email}
            </span>
          </div>
        </Link>
      </div>
    </header>
  )
}
