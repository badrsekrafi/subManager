import { addMonths } from 'date-fns'
import { formatDate } from '../../utils/formatters'

export default function RenewalPeriod({ expirationDate, months }) {
  const end = addMonths(new Date(expirationDate), Number(months) || 1)
  return (
    <p className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
      Période renouvelée : <strong>{formatDate(expirationDate)}</strong> au <strong>{formatDate(end)}</strong>.
      {' '}La durée est ajoutée à l’ancienne date d’expiration.
    </p>
  )
}
