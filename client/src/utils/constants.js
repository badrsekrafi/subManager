export const DURATION_OPTIONS = [
  { value: 1, label: '1 mois' },
  { value: 2, label: '2 mois' },
  { value: 3, label: '3 mois' },
  { value: 6, label: '6 mois' },
  { value: 12, label: '1 an' },
]

export const PAYMENT_METHODS = ['Espèces', 'Virement', 'D17', 'Autre']

export const SERVICE_ICONS = {
  Netflix: { icon: 'Play', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  Spotify: { icon: 'Music', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  Gemini: { icon: 'Sparkles', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  Claude: { icon: 'Bot', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ChatGPT: { icon: 'MessageSquare', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  'YouTube Premium': { icon: 'Youtube', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  'Disney+': { icon: 'Tv', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  default: { icon: 'Package', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' },
}

export const SUBSCRIPTION_STATUSES = {
  active: { label: 'Actif', color: 'success' },
  expiring_soon: { label: 'Expire bientôt', color: 'warning' },
  expired: { label: 'Expiré', color: 'danger' },
  cancelled: { label: 'Annulé', color: 'neutral' },
}

export const PAYMENT_STATUSES = {
  paid: { label: 'Payé', color: 'success' },
  partial: { label: 'Partiellement payé', color: 'warning' },
  unpaid: { label: 'Impayé', color: 'danger' },
}

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
