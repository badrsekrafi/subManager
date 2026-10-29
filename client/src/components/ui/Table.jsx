import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Table({ headers, children, className }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {children}
        </tbody>
      </table>
    </div>
  )
}

Table.Row = function TableRow({ children, className, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  )
}

Table.Cell = function TableCell({ children, className }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}
