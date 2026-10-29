import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function StatCard({ icon: Icon, title, value, trend, color = 'blue', className }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    indigo: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      icon: 'text-primary-600 dark:text-primary-400',
    },
  }

  const colors = colorMap[color] || colorMap.blue

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200',
        'group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'group-hover:scale-110 transition-transform duration-200',
            colors.bg
          )}
        >
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {trend && (
        <p
          className={cn(
            'text-xs mt-1',
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          )}
        >
          {trend > 0 ? '+' : ''}
          {trend}% par rapport au mois dernier
        </p>
      )}
    </div>
  )
}
