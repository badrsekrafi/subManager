import {
  Play,
  Music,
  Sparkles,
  Bot,
  MessageSquare,
  Video,
  Tv,
  Package,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const iconMap = {
  Netflix: { Icon: Play, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  Spotify: { Icon: Music, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  Gemini: { Icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  Claude: { Icon: Bot, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ChatGPT: { Icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  'YouTube Premium': { Icon: Video, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  'Disney+': { Icon: Tv, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
}

const defaultIcon = { Icon: Package, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' }

export default function ServiceIcon({ service, size = 'md', showLabel = false, className }) {
  const config = iconMap[service] || defaultIcon
  const { Icon, color, bg } = config

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('rounded-lg flex items-center justify-center', sizeClasses[size], bg)}>
        <Icon className={cn(iconSizes[size], color)} />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{service}</span>
      )}
    </div>
  )
}
