import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PlusCircle,
  Wallet,
  AlertTriangle,
  Clock,
  Settings,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { clsx } from 'clsx'

const navItems = [
  { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Abonnements', path: '/subscriptions', icon: CreditCard },
  { name: 'Ajouter un abonnement', path: '/subscriptions/add', icon: PlusCircle },
  { name: 'Paiements', path: '/payments', icon: Wallet },
  { name: 'Impayés', path: '/unpaid', icon: AlertTriangle },
  { name: 'Expirations', path: '/expirations', icon: Clock },
  { name: 'Paramètres', path: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                SubManager
              </span>
              <span className="text-[10px] block font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                PRO EDITION
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-750'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Logout bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
