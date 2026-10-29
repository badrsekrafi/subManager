import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Calendar,
  CreditCard,
  PlusCircle,
  FileText,
  DollarSign,
  Clock,
  Sparkles,
  Edit2,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/shared/StatusBadge'
import ServiceIcon from '../components/shared/ServiceIcon'
import Skeleton from '../components/ui/Skeleton'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('subscriptions') // 'subscriptions' | 'payments'

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clients/${id}`)
      setData(res.data?.data || null)
      if (res.data?.data?.client) {
        setFirstName(res.data.data.client.firstName || '')
        setLastName(res.data.data.client.lastName || '')
        setPhone(res.data.data.client.phone || '')
        setNotes(res.data.data.client.notes || '')
      }
    } catch {
      toast.error('Client introuvable ou erreur de chargement')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/clients/${id}`, { firstName, lastName, phone, notes })
      toast.success('Informations client mises à jour')
      setEditModalOpen(false)
      fetchClientData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="card" className="h-44" />
        <Skeleton variant="card" className="h-96" />
      </div>
    )
  }

  const { client, subscriptions = [], payments = [], totals } = data
  const clientName = `${client.firstName} ${client.lastName}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/clients">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Retour aux clients
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {clientName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inscrit le {formatDate(client.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => setEditModalOpen(true)}
          >
            Modifier coordonnées
          </Button>
          <Link to={`/subscriptions/add?clientId=${client._id}`}>
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Ajouter un abonnement
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Profile & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Contact info card */}
        <Card className="md:col-span-1">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Coordonnées
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-mono">
                {client.phone || <span className="italic text-gray-400">Non renseigné</span>}
              </span>
            </div>
            {client.notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                <span className="font-semibold block text-gray-500 mb-0.5">Note interne :</span>
                <p className="italic bg-gray-50 dark:bg-gray-750 p-2 rounded-lg">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Facturation Stats Cards (3 cols) */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Total facturé</span>
              <CreditCard className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {formatCurrency(totals?.totalBilled ?? 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {subscriptions.length} abonnement(s)
            </p>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Total encaissé</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(totals?.totalPaid ?? 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {payments.length} paiement(s)
            </p>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Reste dû</span>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-2">
              {formatCurrency(totals?.remaining ?? 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {totals?.remaining > 0 ? 'Paiement en attente' : 'Entièrement soldé'}
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs Section: Subscriptions vs Payments */}
      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Abonnements ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Historique des paiements ({payments.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Subscriptions list */}
        {activeTab === 'subscriptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Période</th>
                  <th className="px-4 py-3.5">Durée</th>
                  <th className="px-4 py-3.5">Expiration</th>
                  <th className="px-4 py-3.5">Montant total</th>
                  <th className="px-4 py-3.5">Payé</th>
                  <th className="px-4 py-3.5">Reste</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub._id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      <ServiceIcon service={sub.serviceId?.name} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                      {formatDate(sub.startDate)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">
                      {sub.duration?.value} mois ({sub.quantity} u.)
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 dark:text-gray-100 font-semibold">
                      {formatDate(sub.expirationDate)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(sub.totalPrice)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sub.totalPaid)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(sub.remaining)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={sub.paymentStatus} />
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-400 text-xs">
                      Aucun abonnement enregistré pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Payments list */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Service associé</th>
                  <th className="px-4 py-3.5">Date du versement</th>
                  <th className="px-4 py-3.5">Montant réglé</th>
                  <th className="px-4 py-3.5">Mode de paiement</th>
                  <th className="px-4 py-3.5">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      <ServiceIcon
                        service={p.subscriptionId?.serviceId?.name}
                        size="sm"
                        showLabel
                      />
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">
                        {p.paymentMethod || 'Espèces'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400 text-xs">
                      Aucun versement enregistré pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Client Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier les coordonnées du client"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom *
              </label>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de téléphone
            </label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes internes
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
