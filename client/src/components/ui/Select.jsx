import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Sélectionner...',
  className,
  containerClassName,
  id,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200',
          'text-sm py-2.5 px-4 appearance-none cursor-pointer',
          error
            ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-500',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
