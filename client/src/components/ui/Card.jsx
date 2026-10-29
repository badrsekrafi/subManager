import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Card({ children, className, padding = true, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
        padding && 'p-6',
        hover && 'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className }) {
  return (
    <div className={cn('pb-4 border-b border-gray-200 dark:border-gray-700 mb-4', className)}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className }) {
  return <div className={cn('', className)}>{children}</div>
}

Card.Footer = function CardFooter({ children, className }) {
  return (
    <div className={cn('pt-4 border-t border-gray-200 dark:border-gray-700 mt-4', className)}>
      {children}
    </div>
  )
}
