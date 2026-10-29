import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0.000 DT'
  return `${Number(amount).toFixed(3)} DT`
}

export function formatDate(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: fr })
}

export function formatDateTime(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr })
}

export function formatRelativeDate(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function getDaysRemaining(expirationDate) {
  if (!expirationDate) return null
  const d = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate
  return differenceInDays(d, new Date())
}
