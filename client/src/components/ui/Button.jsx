import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const variants = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/25 focus:ring-primary-500',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-400',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/25 focus:ring-red-500',
  ghost:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-400',
  outline:
    'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : null}
      {children}
      {IconRight && !loading && (
        <IconRight className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      )}
    </button>
  )
}
