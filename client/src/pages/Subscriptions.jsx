import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  RotateCw,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusBadge from '../components/shared/StatusBadge'
import ServiceIcon from '../components/shared/ServiceIcon'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { DURATION_OPTIONS, PAYMENT_METHODS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('')

  // View Details Modal
  const [viewSub, setViewSub] = useState(null)

  // Renewal Modal
  const [renewSub, setRenewSub] = useState(null)
  const [renewDuration, setRenewDuration] = useState(1)
  const [renewUnitPrice, setRenewUnitPrice] = useState('')
  const [renewQuantity, setRenewQuantity] = useState(1)
  const [renewInitialPayment, setRenewInitialPayment] = useState(0)
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Espèces')
  const [renewLoading, setRenewLoading] = useState(false)

  // Cancel Confirmation
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchServices = async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data?.data || [])
    } catch {
      // ignore
    }
  }

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedService) params.append('serviceId', selectedService)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedDuration) params.append('duration', selectedDuration)

      const res = await api.get(`/subscriptions?${params.toString()}`)
      setSubscriptions(res.data?.data || [])
    } catch {
      toast.error('Erreur lors du chargement des abonnements')
    } finally {
      setLoading(false)
    }
  }, [selectedService, selectedStatus, selectedDuration])

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Filter subscriptions by client search locally
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!search.trim()) return true
    const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.toLowerCase()
    const phone = (sub.clientId?.phone || '').toLowerCase()
    const query = search.toLowerCase()
    return clientName.includes(query) || phone.includes(query)
  })

  // Open renew modal
  const openRenew = (sub) => {
    setRenewSub(sub)
    setRenewDuration(sub.duration?.value || 1)
    setRenewUnitPrice(sub.unitPrice || '')
    setRenewQuantity(sub.quantity || 1)
    setRenewInitialPayment((sub.unitPrice || 0) * (sub.quantity || 1))
    setRenewPaymentMethod('Espèces')
  }

  const handleRenew = async (e) => {
    e.preventDefault()
    if (!renewSub) return
    setRenewLoading(true)

    try {
      await api.post(`/subscriptions/${renewSub._id}/renew`, {
        duration: { value: Number(renewDuration), unit: 'months' },
        unitPrice: Number(renewUnitPrice),
        quantity: Number(renewQuantity),
        startDate: new Date().toISOString(),
        initialPayment: Number(renewInitialPayment),
        paymentMethod: renewPaymentMethod,
      })
      toast.success('Abonnement renouvelé avec succès !')
      setRenewSub(null)
      fetchSubscriptions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du renouvellement')
    } finally {
      setRenewLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.patch(`/subscriptions/${cancelTarget._id}/cancel`)
      toast.success('Abonnement résilié avec succès')
      setCancelTarget(null)
      fetchSubscriptions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la résiliation')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Tous les abonnements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les périodes de validité, services et états de facturation
          </p>
        </div>
        <Link to="/subscriptions/add">
          <Button variant="primary" icon={PlusCircle}>
            Ajouter un abonnement
          </Button>
        </Link>
      </div>

      {/* Filters bar */}
      <Card padding={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Service Filter */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les services</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="expiring_soon">Expire bientôt</option>
            <option value="expired">Expiré</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Duration Filter */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Toutes les durées</option>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Aucun abonnement trouvé"
            description="Aucun abonnement ne correspond à vos filtres actuels."
            action={
              <Link to="/subscriptions/add">
                <Button variant="primary" icon={PlusCircle}>
                  Créer un abonnement
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Début</th>
                  <th className="px-4 py-3.5">Durée</th>
                  <th className="px-4 py-3.5">Expiration</th>
                  <th className="px-4 py-3.5">Prix total</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Paiement</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSubscriptions.map((sub) => {
                  const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.trim()
                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                        {sub.clientId ? (
                          <Link
                            to={`/clients/${sub.clientId._id}`}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                          >
                            {clientName}
                          </Link>
                        ) : (
                          'Client supprimé'
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ServiceIcon service={sub.serviceId?.name} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">
                        {sub.duration?.value} mois ({sub.quantity} u.)
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100">
                        {formatDate(sub.expirationDate)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(sub.totalPrice)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sub.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewSub(sub)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRenew(sub)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Renouveler"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => setCancelTarget(sub)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Annuler"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewSub}
        onClose={() => setViewSub(null)}
        title="Détails de l'abonnement"
      >
        {viewSub && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {viewSub.clientId?.firstName} {viewSub.clientId?.lastName}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Tél : {viewSub.clientId?.phone || 'Non renseigné'}
                </p>
              </div>
              <ServiceIcon service={viewSub.serviceId?.name} size="md" showLabel />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
              <div>
                <span className="text-gray-400 block mb-0.5">Date d'achat :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(viewSub.purchaseDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Date de début :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(viewSub.startDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Durée :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {viewSub.duration?.value} mois
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Date d'expiration :</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatDate(viewSub.expirationDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Quantité :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {viewSub.quantity} unité(s)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Prix unitaire :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatCurrency(viewSub.unitPrice)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Montant total :</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(viewSub.totalPrice)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Encaissé :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(viewSub.totalPaid)}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Reste à payer :</span>
                <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                  {formatCurrency(viewSub.remaining)}
                </span>
              </div>
            </div>

            {viewSub.notes && (
              <div>
                <span className="text-gray-400 block mb-1">Notes :</span>
                <p className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl text-gray-700 dark:text-gray-300 italic">
                  {viewSub.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setViewSub(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Renewal Modal */}
      <Modal
        isOpen={!!renewSub}
        onClose={() => setRenewSub(null)}
        title="Renouveler l'abonnement"
      >
        {renewSub && (
          <form onSubmit={handleRenew} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {renewSub.clientId?.firstName} {renewSub.clientId?.lastName}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Service : {renewSub.serviceId?.name}
                </p>
              </div>
              <ServiceIcon service={renewSub.serviceId?.name} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouvelle durée
                </label>
                <Select
                  value={renewDuration}
                  onChange={(e) => setRenewDuration(Number(e.target.value))}
                  options={DURATION_OPTIONS}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantité
                </label>
                <Input
                  type="number"
                  min="1"
                  value={renewQuantity}
                  onChange={(e) => setRenewQuantity(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix unitaire de vente (DT)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={renewUnitPrice}
                onChange={(e) => {
                  setRenewUnitPrice(e.target.value)
                  setRenewInitialPayment(Number(e.target.value) * renewQuantity)
                }}
                required
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-gray-100">
                <span>Nouveau total à facturer :</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {formatCurrency((Number(renewUnitPrice) || 0) * renewQuantity)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Versement immédiat (DT)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={renewInitialPayment}
                  onChange={(e) => setRenewInitialPayment(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode de règlement
                </label>
                <Select
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                  options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRenewSub(null)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={renewLoading}>
                Valider le renouvellement
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelSubscription}
        loading={cancelling}
        title="Résilier l'abonnement ?"
        message="Êtes-vous sûr de vouloir annuler cet abonnement ? Son statut passera à 'Annulé' et il ne sera plus comptabilisé dans les actifs."
        confirmLabel="Résilier"
        danger
      />
    </div>
  )
}
