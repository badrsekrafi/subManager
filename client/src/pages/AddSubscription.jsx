import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  User,
  CreditCard,
  Calculator,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { formatCurrency, formatDate } from '../utils/formatters'
import { DURATION_OPTIONS, PAYMENT_METHODS } from '../utils/constants'
import { addMonths, format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function AddSubscription() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')

  const [clientMode, setClientMode] = useState(preselectedClientId ? 'existing' : 'existing')
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newClientNotes, setNewClientNotes] = useState('')

  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [customServiceName, setCustomServiceName] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [durationMonths, setDurationMonths] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  const [initialPayment, setInitialPayment] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Espèces')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/services'),
        ])
        const loadedClients = clientsRes.data?.data || []
        setClients(loadedClients)

        if (preselectedClientId) {
          setSelectedClientId(preselectedClientId)
          setClientMode('existing')
        } else if (loadedClients.length > 0) {
          setSelectedClientId(loadedClients[0]._id)
        } else {
          setClientMode('new')
        }

        const loadedServices = servicesRes.data?.data || []
        setServices(loadedServices)
        if (loadedServices.length > 0) {
          setSelectedServiceId(loadedServices[0]._id)
        }
      } catch (err) {
        toast.error('Erreur lors du chargement des données')
      }
    }
    fetchData()
  }, [preselectedClientId])

  const expirationDateFormatted = useMemo(() => {
    try {
      const start = parseISO(startDate)
      return addMonths(start, Number(durationMonths) || 1)
    } catch {
      return new Date()
    }
  }, [startDate, durationMonths])

  const totalPrice = useMemo(() => {
    const p = parseFloat(unitPrice) || 0
    const q = parseInt(quantity, 10) || 1
    return Math.round(p * q * 1000) / 1000
  }, [unitPrice, quantity])

  const remaining = useMemo(() => {
    const paid = parseFloat(initialPayment) || 0
    return Math.max(0, Math.round((totalPrice - paid) * 1000) / 1000)
  }, [totalPrice, initialPayment])

  const paymentStatus = useMemo(() => {
    const paid = parseFloat(initialPayment) || 0
    if (paid >= totalPrice && totalPrice > 0) return 'Payé'
    if (paid > 0) return 'Partiellement payé'
    return 'Impayé'
  }, [totalPrice, initialPayment])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (clientMode === 'existing' && (!selectedClientId || clients.length === 0)) {
      toast.error('Veuillez sélectionner un client ou créer un nouveau client')
      return
    }

    if (clientMode === 'new' && (!newFirstName.trim() || !newLastName.trim())) {
      toast.error('Le prénom et le nom du nouveau client sont obligatoires')
      return
    }

    if (!selectedServiceId) {
      toast.error('Veuillez sélectionner un service')
      return
    }

    if (selectedServiceId === 'other' && !customServiceName.trim()) {
      toast.error('Veuillez saisir le nom du service personnalisé')
      return
    }

    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      toast.error('Veuillez saisir un prix unitaire valide en DT')
      return
    }

    const paidNum = parseFloat(initialPayment) || 0
    if (paidNum < 0) {
      toast.error('Le montant payé ne peut pas être négatif')
      return
    }

    if (paidNum > totalPrice) {
      toast.error(`Le montant payé (${paidNum} DT) ne peut pas dépasser le montant total (${totalPrice} DT)`)
      return
    }

    setLoading(true)

    try {
      let finalClientId = selectedClientId

      if (clientMode === 'new') {
        const clientRes = await api.post('/clients', {
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          phone: newPhone.trim(),
          notes: newClientNotes.trim(),
        })
        finalClientId = clientRes.data?.data?._id
      }

      let finalServiceId = selectedServiceId
      if (selectedServiceId === 'other') {
        const sRes = await api.post('/services', {
          name: customServiceName.trim(),
          icon: 'Package',
        })
        finalServiceId = sRes.data?.data?._id
      }

      await api.post('/subscriptions', {
        clientId: finalClientId,
        serviceId: finalServiceId,
        purchaseDate: new Date(purchaseDate).toISOString(),
        startDate: new Date(startDate).toISOString(),
        duration: Number(durationMonths),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        unitCost: unitCost ? Number(unitCost) : undefined,
        notes: internalNotes.trim(),
        initialPayment: paidNum,
        paymentMethod: paidNum > 0 ? paymentMethod : undefined,
      })

      toast.success('Abonnement enregistré avec succès !')
      navigate('/subscriptions')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création de l’abonnement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
          Ajouter un abonnement
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Attribuez une formule à un client existant ou enregistrez un nouvel abonné
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Client */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              1. Sélection du client
            </h2>
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
              <input
                type="radio"
                name="clientMode"
                value="existing"
                checked={clientMode === 'existing'}
                onChange={() => setClientMode('existing')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Client existant ({clients.length})
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
              <input
                type="radio"
                name="clientMode"
                value="new"
                checked={clientMode === 'new'}
                onChange={() => setClientMode('new')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Nouveau client
            </label>
          </div>

          {clientMode === 'existing' ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Choisir un client enregistré
              </label>
              {clients.length > 0 ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Aucun client existant. Sélectionnez « Nouveau client » ci-dessus.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <Input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ex: Mohamed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <Input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Ex: Ben Ali"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Numéro de téléphone
                  </label>
                  <Input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+216 22 108 267"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes client
                  </label>
                  <Input
                    type="text"
                    value={newClientNotes}
                    onChange={(e) => setNewClientNotes(e.target.value)}
                    placeholder="Remarques éventuelles"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Section 2 : Abonnement */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              2. Informations sur l'abonnement
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de service / Plateforme *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
              >
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
                <option value="other">Autre (Saisie personnalisée...)</option>
              </select>
            </div>

            {selectedServiceId === 'other' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du service personnalisé *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: NordVPN, Coursera..."
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date d'achat
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value)
                    setStartDate(e.target.value)
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durée de l'abonnement
                </label>
                <Select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  options={DURATION_OPTIONS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantité *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix de vente unitaire (DT) *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Ex: 45.000"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value)
                    const total = (Number(e.target.value) || 0) * (Number(quantity) || 1)
                    setInitialPayment(total)
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix d'achat unitaire (facultatif DT)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Marge bénéficiaire"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note interne (facultatif)
              </label>
              <textarea
                rows="2"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Identifiants de profil, etc."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </Card>

        {/* Section 3 : Récapitulatif et règlement */}
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-800 dark:to-gray-850 border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-100 dark:border-gray-700">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              3. Récapitulatif et règlement immédiat
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">Date d'expiration :</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {formatDate(expirationDateFormatted)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Montant total :</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Reste à payer :</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                {formatCurrency(remaining)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Statut paiement :</span>
              <span
                className={`font-bold inline-block px-2 py-0.5 rounded-full text-[11px] ${
                  paymentStatus === 'Payé'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : paymentStatus === 'Partiellement payé'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                {paymentStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant encaissé immédiatement (DT)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
              />
            </div>

            {parseFloat(initialPayment) > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode de règlement
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                />
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => navigate('/subscriptions')}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={Sparkles}
            className="px-8 cursor-pointer"
          >
            Enregistrer l'abonnement
          </Button>
        </div>
      </form>
    </div>
  )
}
