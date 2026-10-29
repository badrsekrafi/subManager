import { InboxIcon } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'Aucune donnée',
  description = "Il n'y a rien à afficher pour le moment.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
