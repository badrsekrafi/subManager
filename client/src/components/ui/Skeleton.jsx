import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Skeleton({ className, variant = 'text' }) {
  const variantClasses = {
    text: 'h-4 rounded-md',
    card: 'h-32 rounded-xl',
    circle: 'h-10 w-10 rounded-full',
    row: 'h-12 rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        className
      )}
    />
  )
}

Skeleton.Card = function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3" />
          <Skeleton className="w-1/2" />
        </div>
      </div>
      <Skeleton className="w-full h-6" />
    </div>
  )
}

Skeleton.Table = function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="row" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

Skeleton.StatCard = function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton variant="circle" className="w-10 h-10" />
      </div>
      <Skeleton className="w-20 h-8" />
    </div>
  )
}
