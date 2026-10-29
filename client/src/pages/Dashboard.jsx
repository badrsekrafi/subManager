import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CreditCard,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowDownCircle,
  Calendar,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import api from '../api/axios'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/shared/StatusBadge'
import ServiceIcon from '../components/shared/ServiceIcon'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Skeleton from '../components/ui/Skeleton'
import { formatCurrency, formatDate } from '../utils/formatters'
import { DURATION_OPTIONS, PAYMENT_METHODS } from '../utils/constants'
import toast from 'react-hot-toast'

const PIE_COLORS = [
  '#4f46e5', // Indigo
  '#ef4444', // Red
  '#10b981', // Green
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#64748b', // Slate
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [expiringSubs, setExpiringSubs] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  // Renewal Modal State
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedSubToRenew, setSelectedSubToRenew] = useState(null)
  const [renewDuration, setRenewDuration] = useState(1)
  const [renewUnitPrice, setRenewUnitPrice] = useState('')
  const [renewQuantity, setRenewQuantity] = useState(1)
  const [renewInitialPayment, setRenewInitialPayment] = useState(0)
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Espèces')
  const [renewLoading, setRenewLoading] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, revRes, distRes, expRes, payRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get(`/dashboard/revenue?year=${selectedYear}`),
        api.get('/dashboard/service-distribution'),
        api.get('/dashboard/expiring'),
        api.get('/dashboard/recent-payments'),
      ])

      setStats(statsRes.data?.data || null)
      setRevenueData(revRes.data?.data || [])
      setDistributionData(distRes.data?.data || [])
      setExpiringSubs(expRes.data?.data || [])
      setRecentPayments(payRes.data?.data || [])
    } catch (err) {
      toast.error('Erreur lors du chargement des données du tableau de bord')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const openRenewModal = (sub) => {
    setSelectedSubToRenew(sub)
    setRenewDuration(sub.duration?.value || 1)
    setRenewUnitPrice(sub.unitPrice || '')
    setRenewQuantity(sub.quantity || 1)
    const total = (sub.unitPrice || 0) * (sub.quantity || 1)
    setRenewInitialPayment(total)
    setRenewModalOpen(true)
  }

  const handleRenewSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSubToRenew) return
    setRenewLoading(true)

    try {
      await api.post(`/subscriptions/${selectedSubToRenew._id}/renew`, {
        duration: { value: Number(renewDuration), unit: 'months' },
        unitPrice: Number(renewUnitPrice),
        quantity: Number(renewQuantity),
        startDate: new Date().toISOString(),
        initialPayment: Number(renewInitialPayment),
        paymentMethod: renewPaymentMethod,
      })
      toast.success('Abonnement renouvelé avec succès !')
      setRenewModalOpen(false)
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du renouvellement')
    } finally {
      setRenewLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="w-48 h-8" />
          <Skeleton variant="text" className="w-32 h-8" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="lg:col-span-2 h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue synthétique des activités, finances et expirations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchDashboardData}
          >
            Actualiser
          </Button>
          <Link to="/subscriptions/add">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Nouvel abonnement
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Clients enregistrés"
          value={stats?.totalClients ?? 0}
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          title="Abonnements actifs"
          value={stats?.activeSubscriptions ?? 0}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          title="Expire sous 7 jours"
          value={stats?.expiringSoon ?? 0}
          color="amber"
        />
        <StatCard
          icon={XCircle}
          title="Abonnements expirés"
          value={stats?.expiredSubscriptions ?? 0}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          title="CA encaissé (mois en cours)"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          color="emerald"
        />
        <StatCard
          icon={DollarSign}
          title="Total encaissé (à ce jour)"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          color="indigo"
        />
        <StatCard
          icon={AlertCircle}
          title="Total des impayés"
          value={formatCurrency(stats?.totalUnpaid ?? 0)}
          color="red"
        />
        <StatCard
          icon={ArrowDownCircle}
          title="Reste à encaisser"
          value={formatCurrency(stats?.remainingToCollect ?? 0)}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Chiffre d'affaires encaissé mensuel
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Basé sur les dates réelles de paiement (DT)
              </p>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Année {y}
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  formatter={(value) => [`${formatCurrency(value)}`, 'Encaissé']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Pie Chart (1 col) */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Répartition par service
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Abonnements actifs et en cours
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} abonnements`, name]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 text-xs">
                Aucune donnée d'abonnement actif
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Two Tables: Expiring Subscriptions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abonnements proches de l'expiration */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Expirations proches (30 jours)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Abonnements nécessitant un renouvellement
              </p>
            </div>
            <Link
              to="/expirations"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Expire le</th>
                  <th className="px-4 py-3">Jours</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expiringSubs.slice(0, 5).map((sub) => {
                  const clientName = `${sub.clientId?.firstName || ''} ${sub.clientId?.lastName || ''}`.trim()
                  const isUrgent = sub.daysRemaining <= 3
                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {clientName || 'Inconnu'}
                      </td>
                      <td className="px-4 py-3">
                        <ServiceIcon
                          service={sub.serviceId?.name}
                          size="sm"
                          showLabel
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatDate(sub.expirationDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            isUrgent
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {sub.daysRemaining} j
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openRenewModal(sub)}
                          className="text-xs py-1"
                        >
                          Renouveler
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {expiringSubs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400 text-xs">
                      Aucun abonnement expirant dans les 30 prochains jours
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Derniers paiements */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Derniers encaissements
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paiements récemment enregistrés
              </p>
            </div>
            <Link
              to="/payments"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Méthode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentPayments.slice(0, 5).map((pay) => {
                  const clientName = `${pay.clientId?.firstName || ''} ${pay.clientId?.lastName || ''}`.trim()
                  const serviceName = pay.subscriptionId?.serviceId?.name || '-'
                  return (
                    <tr
                      key={pay._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {clientName || 'Inconnu'}
                      </td>
                      <td className="px-4 py-3">
                        <ServiceIcon service={serviceName} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(pay.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-[11px]">
                          {pay.paymentMethod || 'Espèces'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400 text-xs">
                      Aucun paiement enregistré pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Renewal Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renouveler l'abonnement"
      >
        {selectedSubToRenew && (
          <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {selectedSubToRenew.clientId?.firstName} {selectedSubToRenew.clientId?.lastName}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Service : {selectedSubToRenew.serviceId?.name}
                </p>
              </div>
              <ServiceIcon service={selectedSubToRenew.serviceId?.name} size="md" />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenewModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={renewLoading}
              >
                Valider le renouvellement
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
