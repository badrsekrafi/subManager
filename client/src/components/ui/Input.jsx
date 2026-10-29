import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Input({
  label,
  error,
  icon: Icon,
  className,
  containerClassName,
  type = 'text',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200',
            'text-sm py-2.5',
            Icon ? 'pl-10 pr-4' : 'px-4',
            error
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
