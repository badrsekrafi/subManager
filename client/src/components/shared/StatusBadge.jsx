import Badge from '../ui/Badge'

const statusMap = {
  // Subscription statuses
  active: { label: 'Actif', variant: 'success' },
  expiring_soon: { label: 'Expire bientôt', variant: 'warning' },
  expired: { label: 'Expiré', variant: 'danger' },
  cancelled: { label: 'Annulé', variant: 'neutral' },
  
  // Payment statuses (French & English keys)
  Payé: { label: 'Payé', variant: 'success' },
  'Partiellement payé': { label: 'Partiellement payé', variant: 'warning' },
  Impayé: { label: 'Impayé', variant: 'danger' },
  paid: { label: 'Payé', variant: 'success' },
  partial: { label: 'Partiellement payé', variant: 'warning' },
  unpaid: { label: 'Impayé', variant: 'danger' },
}

export default function StatusBadge({ status }) {
  const config = statusMap[status] || { label: status, variant: 'neutral' }

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}
