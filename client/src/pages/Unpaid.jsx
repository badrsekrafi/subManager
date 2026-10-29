import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  Users,
  CreditCard,
  DollarSign,
  Search,
  ArrowUpDown,
  Download,
  Wallet,
  CheckCircle,
  PlusCircle,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import ServiceIcon from '../components/shared/ServiceIcon'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { PAYMENT_METHODS } from '../utils/constants'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Unpaid() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filters and sorting
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'

  // Instant Payment Modal
  const [paySub, setPaySub] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Espèces')
  const [payNotes, setPayNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUnpaid = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/dashboard/unpaid')
      setData(res.data?.data || null)
    } catch {
      toast.error('Erreur lors du chargement des impayés')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnpaid()
  }, [fetchUnpaid])

  const openPaymentModal = (sub) => {
    setPaySub(sub)
    setPayAmount(sub.remaining)
    setPayMethod('Espèces')
    setPayNotes('')
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!paySub) return

    const amountNum = parseFloat(payAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    if (amountNum > paySub.remaining) {
      toast.error('Le montant ne peut pas dépasser le reste à payer')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/payments', {
        subscriptionId: paySub._id,
        clientId: paySub.clientId?._id || paySub.clientId,
        amount: amountNum,
        paymentDate: new Date().toISOString(),
        paymentMethod: payMethod,
        notes: payNotes,
      })

      toast.success('Paiement enregistré avec succès !')
      setPaySub(null)
      fetchUnpaid()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’encaissement')
    } finally {
      setSubmitting(false)
    }
  }

  const list = data?.subscriptions || []

  // Filter & Sort
  const processedList = list
    .filter((sub) => {
      if (!search.trim()) return true
      const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.toLowerCase()
      const phone = (sub.clientId?.phone || '').toLowerCase()
      const query = search.toLowerCase()
      return clientName.includes(query) || phone.includes(query)
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.remaining - b.remaining
      return b.remaining - a.remaining
    })

  // Export CSV
  const exportCSV = () => {
    if (processedList.length === 0) {
      toast.error('Aucune créance à exporter')
      return
    }

    const headers = ['Client', 'Telephone', 'Service', 'Total (DT)', 'Paye (DT)', 'Reste du (DT)', 'Date achat']
    const rows = processedList.map((s) => [
      `"${s.clientId?.firstName || ''} ${s.clientId?.lastName || ''}"`,
      `"${s.clientId?.phone || ''}"`,
      `"${s.serviceId?.name || ''}"`,
      s.totalPrice,
      s.totalPaid,
      s.remaining,
      formatDate(s.purchaseDate),
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `impayes_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Fichier CSV des impayés téléchargé')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Suivi des impayés et créances
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Retrouvez tous les abonnements non soldés et enregistrez des règlements directs
          </p>
        </div>
        <Button variant="outline" icon={Download} onClick={exportCSV}>
          Exporter la liste (CSV)
        </Button>
      </div>

      {/* 3 Indicators Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Clients débiteurs
            </span>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data?.debtorClientsCount ?? 0}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Abonnements non soldés
            </span>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data?.unpaidCount ?? 0}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Montant total à recouvrer
            </span>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data?.totalRemaining ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Sorting bar */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer par nom de client ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              Trier par reste : {sortOrder === 'desc' ? 'Du plus élevé' : 'Du plus faible'}
            </span>
          </button>
        </div>
      </Card>

      {/* Unpaid Table */}
      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : processedList.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Aucun impayé !"
            description="Toutes les créances sont soldées. Votre trésorerie est à jour."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Téléphone</th>
                  <th className="px-4 py-3.5">Total facturé</th>
                  <th className="px-4 py-3.5">Déjà versé</th>
                  <th className="px-4 py-3.5">Reste à payer</th>
                  <th className="px-4 py-3.5">Date d'achat</th>
                  <th className="px-4 py-3.5 text-right">Action immédiate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {processedList.map((sub) => {
                  const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.trim()
                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {clientName}
                      </td>
                      <td className="px-4 py-3.5">
                        <ServiceIcon service={sub.serviceId?.name} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-mono">
                        {sub.clientId?.phone || <span className="italic text-gray-400">Non renseigné</span>}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(sub.totalPrice)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(sub.totalPaid)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2.5 py-1 rounded-md text-xs">
                          {formatCurrency(sub.remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {formatDate(sub.purchaseDate)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Wallet}
                          onClick={() => openPaymentModal(sub)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
                        >
                          Encaisser
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

      {/* Instant Payment Modal */}
      <Modal
        isOpen={!!paySub}
        onClose={() => setPaySub(null)}
        title="Enregistrer un encaissement"
      >
        {paySub && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl space-y-1">
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {paySub.clientId?.firstName} {paySub.clientId?.lastName}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                <span>Service : {paySub.serviceId?.name}</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  Reste dû : {formatCurrency(paySub.remaining)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant versé (DT) *
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                max={paySub.remaining}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mode de règlement
              </label>
              <Select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note de transaction (facultatif)
              </label>
              <Input
                type="text"
                placeholder="Ex: Reçu D17 #123456"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setPaySub(null)}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Confirmer l'encaissement
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
