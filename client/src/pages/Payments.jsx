import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Edit2,
  Calendar,
  CheckCircle2,
  Download,
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

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Edit Payment Modal
  const [editPayment, setEditPayment] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMethod, setEditMethod] = useState('Espèces')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await api.get(`/payments?${params.toString()}`)
      setPayments(res.data?.data || [])
    } catch {
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Filter payments locally by client name & payment method
  const filteredPayments = payments.filter((p) => {
    const clientName = `${p.clientId?.firstName || ''} ${p.clientId?.lastName || ''}`.toLowerCase()
    const query = search.toLowerCase()
    const matchName = clientName.includes(query)
    const matchMethod = !methodFilter || p.paymentMethod === methodFilter
    return matchName && matchMethod
  })

  // Calculations for summary cards
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const count = filteredPayments.length

  const openEdit = (p) => {
    setEditPayment(p)
    setEditAmount(p.amount)
    setEditDate(format(new Date(p.paymentDate), 'yyyy-MM-dd'))
    setEditMethod(p.paymentMethod || 'Espèces')
    setEditNotes(p.notes || '')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editPayment) return
    setSaving(true)
    try {
      await api.put(`/payments/${editPayment._id}`, {
        amount: Number(editAmount),
        paymentDate: new Date(editDate).toISOString(),
        paymentMethod: editMethod,
        notes: editNotes,
      })
      toast.success('Paiement mis à jour avec succès')
      setEditPayment(null)
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification du paiement')
    } finally {
      setSaving(false)
    }
  }

  // Export CSV
  const exportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    const headers = ['Client', 'Telephone', 'Service', 'Montant (DT)', 'Date', 'Methode', 'Notes']
    const rows = filteredPayments.map((p) => [
      `"${p.clientId?.firstName || ''} ${p.clientId?.lastName || ''}"`,
      `"${p.clientId?.phone || ''}"`,
      `"${p.subscriptionId?.serviceId?.name || ''}"`,
      p.amount,
      formatDate(p.paymentDate),
      `"${p.paymentMethod || 'Espèces'}"`,
      `"${p.notes || ''}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `paiements_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Export CSV généré')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Historique des paiements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Traçabilité intégrale de tous les encaissements en dinar tunisien (DT)
          </p>
        </div>
        <Button variant="outline" icon={Download} onClick={exportCSV}>
          Exporter CSV
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Total sélectionné
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Nombre de transactions
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {count} versement(s)
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Moyenne par versement
            </span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(count > 0 ? totalAmount / count : 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by client */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Payment Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les modes</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Du"
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Au"
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Payments Table */}
      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Aucun versement enregistré"
            description="Aucun paiement ne correspond aux critères sélectionnés."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Service associé</th>
                  <th className="px-4 py-3.5">Montant encaissé</th>
                  <th className="px-4 py-3.5">Date du paiement</th>
                  <th className="px-4 py-3.5">Mode de règlement</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPayments.map((p) => {
                  const clientName = `${p.clientId?.firstName || ''} ${p.clientId?.lastName || ''}`.trim()
                  const serviceName = p.subscriptionId?.serviceId?.name || '-'
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                        {clientName || 'Client inconnu'}
                      </td>
                      <td className="px-4 py-3.5">
                        <ServiceIcon service={serviceName} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                          {p.paymentMethod || 'Espèces'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Modifier le paiement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={!!editPayment}
        onClose={() => setEditPayment(null)}
        title="Modifier l'encaissement"
      >
        {editPayment && (
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant encaissé (DT) *
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de versement *
              </label>
              <Input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mode de règlement
              </label>
              <Select
                value={editMethod}
                onChange={(e) => setEditMethod(e.target.value)}
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note interne
              </label>
              <textarea
                rows="2"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditPayment(null)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Sauvegarder
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
