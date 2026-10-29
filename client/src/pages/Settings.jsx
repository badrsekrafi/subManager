import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Moon,
  Sun,
  Layers,
  Download,
  Plus,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react'
import api from '../api/axios'
import { downloadCSV } from '../utils/csv'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ServiceIcon from '../components/shared/ServiceIcon'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Settings() {
  const { admin, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Profile Form
  const [name, setName] = useState(admin?.name || '')
  const [email, setEmail] = useState(admin?.email || '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Services Management
  const [services, setServices] = useState([])
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceIcon, setNewServiceIcon] = useState('Package')
  const [addingService, setAddingService] = useState(false)

  useEffect(() => {
    if (admin) {
      setName(admin.name || '')
      setEmail(admin.email || '')
    }
  }, [admin])

  const fetchServices = async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data?.data || [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile({ name, email })
      toast.success('Profil administrateur mis à jour')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    setPasswordLoading(true)
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Mot de passe changé avec succès !')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
        'Échec du changement de mot de passe. Vérifiez le mot de passe actuel.'
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle Add Service
  const handleAddService = async (e) => {
    e.preventDefault()
    if (!newServiceName.trim()) return
    setAddingService(true)
    try {
      await api.post('/services', {
        name: newServiceName.trim(),
        icon: newServiceIcon || 'Package',
      })
      toast.success(`Service ${newServiceName} ajouté avec succès`)
      setNewServiceName('')
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’ajout du service')
    } finally {
      setAddingService(false)
    }
  }

  // Export full backups
  const exportAllData = async (type) => {
    try {
      toast.loading('Génération du fichier CSV...', { id: 'csv-export' })
      const res = await api.get(`/${type}`)
      const items = res.data?.data || []

      if (items.length === 0) {
        toast.dismiss('csv-export')
        toast.error(`Aucune donnée trouvée pour ${type}`)
        return
      }

      let headers = []
      let rows = []
      if (type === 'clients') {
        headers = ['Nom', 'Prenom', 'Telephone', 'Total facturé', 'Total payé', 'Reste à payer', 'Notes']
        rows = items.map((c) => [
          `${c.lastName}`,
          `${c.firstName}`,
          `${c.phone || ''}`,
          c.totalBilled || 0,
          c.totalPaid || 0,
          c.remaining || 0,
          `${c.notes || ''}`,
        ])
      } else if (type === 'subscriptions') {
        headers = ['Client', 'Service', 'Date achat', 'Date debut', 'Date expiration', 'Duree (mois)', 'Total', 'Statut']
        rows = items.map((s) => [
          `${s.clientId?.firstName || ''} ${s.clientId?.lastName || ''}`,
          `${s.serviceId?.name || ''}`,
          s.purchaseDate,
          s.startDate,
          s.expirationDate,
          s.duration?.value || 1,
          s.totalPrice,
          s.status,
        ])
      } else if (type === 'payments') {
        headers = ['Client', 'Service', 'Montant', 'Date paiement', 'Methode', 'Notes']
        rows = items.map((p) => [
          `${p.clientId?.firstName || ''} ${p.clientId?.lastName || ''}`,
          `${p.subscriptionId?.serviceId?.name || ''}`,
          p.amount,
          p.paymentDate,
          `${p.paymentMethod || 'Espèces'}`,
          `${p.notes || ''}`,
        ])
      }

      downloadCSV(headers, rows, `sauvegarde_${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`)

      toast.dismiss('csv-export')
      toast.success(`Export ${type} terminé avec succès`)
    } catch {
      toast.dismiss('csv-export')
      toast.error('Erreur lors de l’export')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
          Paramètres généraux
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configuration du compte administrateur, sécurité, thèmes et sauvegardes
        </p>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Profil Administrateur */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Profil Administrateur
            </h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom affiché
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                loading={profileLoading}
              >
                Mettre à jour le profil
              </Button>
            </div>
          </form>
        </Card>

        {/* Section 2: Sécurité et Mot de Passe */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Sécurité du mot de passe
            </h2>
          </div>

          {passwordError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/20 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe actuel
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 caractères"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={passwordLoading}
              >
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </Card>

        {/* Section 3: Apparence & Thème */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Apparence et Affichage
            </h2>
          </div>

          <div className="flex items-center justify-between text-xs py-2">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Thème de l'interface
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                Actuellement : {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
            >
              Basculer en {theme === 'dark' ? 'Clair' : 'Sombre'}
            </Button>
          </div>
        </Card>

        {/* Section 4: Sauvegarde & Export CSV */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Sauvegarde des données (CSV)
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              Téléchargez des copies de sauvegarde intégrales prêtes pour Excel ou Google Sheets :
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => exportAllData('clients')}
              >
                Exporter Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => exportAllData('subscriptions')}
              >
                Exporter Abonnements
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => exportAllData('payments')}
              >
                Exporter Paiements
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 5: Services Catalogue */}
      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Catalogue des services proposés
          </h2>
        </div>

        <div className="space-y-4">
          {/* Add new service */}
          <form onSubmit={handleAddService} className="flex gap-2">
            <Input
              type="text"
              placeholder="Nom du nouveau service (Ex: Canva Pro, Office 365...)"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="text-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Plus}
              loading={addingService}
              className="shrink-0"
            >
              Ajouter au catalogue
            </Button>
          </form>

          {/* List of services */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {services.map((s) => (
              <div
                key={s._id}
                className="p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3"
              >
                <ServiceIcon service={s.name} size="sm" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
