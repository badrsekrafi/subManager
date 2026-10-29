import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Calendar,
  XCircle,
  Bell,
  Sparkles,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/shared/StatusBadge'
import ServiceIcon from '../components/shared/ServiceIcon'
import RenewalPeriod from '../components/shared/RenewalPeriod'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { DURATION_OPTIONS, PAYMENT_METHODS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Expirations() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // 'all' | 'soon' | 'expired'

  // Renewal Modal
  const [renewSub, setRenewSub] = useState(null)
  const [renewDuration, setRenewDuration] = useState(1)
  const [renewUnitPrice, setRenewUnitPrice] = useState('')
  const [renewQuantity, setRenewQuantity] = useState(1)
  const [renewInitialPayment, setRenewInitialPayment] = useState(0)
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Espèces')
  const [renewLoading, setRenewLoading] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch both active, expiring_soon, and expired
      const res = await api.get('/subscriptions')
      setSubscriptions(res.data?.data || [])
    } catch {
      toast.error('Erreur lors du chargement des abonnements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Filter subscriptions that are either expiring soon (within 30 days) or already expired
  const now = new Date()
  const listWithDays = subscriptions
    .filter((sub) => sub.status !== 'cancelled')
    .map((sub) => {
      const expDate = new Date(sub.expirationDate)
      const diffTime = expDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return {
        ...sub,
        daysRemaining: diffDays,
      }
    })
    .filter((sub) => sub.daysRemaining <= 30) // Only relevant for expirations view
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  const filteredList = listWithDays.filter((sub) => {
    if (filterType === 'soon') return sub.daysRemaining >= 0
    if (filterType === 'expired') return sub.daysRemaining < 0
    return true
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
        startDate: renewSub.expirationDate,
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

  const getUrgencyBadge = (days) => {
    if (days < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Expiré (il y a {Math.abs(days)} j)
        </span>
      )
    }
    if (days === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
          Expire AUJOURD'HUI
        </span>
      )
    }
    if (days === 1) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
          Expire DEMAIN
        </span>
      )
    }
    if (days <= 3) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
          Dans {days} jours
        </span>
      )
    }
    if (days <= 7) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          Dans {days} jours
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
        Dans {days} jours
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Gestion des expirations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Surveillez les échéances, relancez les clients et effectuez les renouvellements
          </p>
        </div>
        <Link to="/subscriptions/add">
          <Button variant="primary" icon={Sparkles}>
            Nouvel abonnement
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Card padding={false} className="p-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
            }`}
          >
            Tous ({listWithDays.length})
          </button>
          <button
            onClick={() => setFilterType('soon')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterType === 'soon'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
            }`}
          >
            Expire bientôt ({listWithDays.filter((s) => s.daysRemaining >= 0).length})
          </button>
          <button
            onClick={() => setFilterType('expired')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterType === 'expired'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
            }`}
          >
            Déjà expiré ({listWithDays.filter((s) => s.daysRemaining < 0).length})
          </button>
        </div>
      </Card>

      {/* Expirations Table */}
      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Aucune expiration imminente"
            description="Tous vos abonnements sont à jour pour les 30 prochains jours."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Date d'expiration</th>
                  <th className="px-4 py-3.5">Échéance</th>
                  <th className="px-4 py-3.5">Prix total</th>
                  <th className="px-4 py-3.5">Statut actuel</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredList.map((sub) => {
                  const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.trim()
                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {sub.clientId ? (
                          <Link
                            to={`/clients/${sub.clientId._id}`}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            {clientName}
                          </Link>
                        ) : (
                          'Client supprimé'
                        )}
                        {sub.clientId?.phone && (
                          <span className="block text-[11px] font-normal text-gray-400 font-mono">
                            {sub.clientId.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ServiceIcon service={sub.serviceId?.name} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200 font-medium">
                        {formatDate(sub.expirationDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getUrgencyBadge(sub.daysRemaining)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(sub.totalPrice)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={RotateCw}
                          onClick={() => openRenew(sub)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1"
                        >
                          Renouveler
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Renewal Modal */}
      <Modal
        isOpen={!!renewSub}
        onClose={() => setRenewSub(null)}
        title="Renouveler l'abonnement"
      >
        {renewSub && (
          <form onSubmit={handleRenew} className="space-y-4 text-xs">
            <RenewalPeriod expirationDate={renewSub.expirationDate} months={renewDuration} />
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
    </div>
  )
}
