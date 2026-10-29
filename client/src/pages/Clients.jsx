import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Archive,
  Phone,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
} from 'lucide-react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Archive confirm
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/clients?search=${encodeURIComponent(search)}`)
      setClients(data?.data || [])
    } catch {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchClients])

  const openAddModal = () => {
    setEditingClient(null)
    setFirstName('')
    setLastName('')
    setPhone('')
    setNotes('')
    setModalOpen(true)
  }

  const openEditModal = (client) => {
    setEditingClient(client)
    setFirstName(client.firstName || '')
    setLastName(client.lastName || '')
    setPhone(client.phone || '')
    setNotes(client.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient._id}`, {
          firstName,
          lastName,
          phone,
          notes,
        })
        toast.success('Client modifié avec succès')
      } else {
        await api.post('/clients', {
          firstName,
          lastName,
          phone,
          notes,
        })
        toast.success('Nouveau client ajouté !')
      }
      setModalOpen(false)
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await api.patch(`/clients/${archiveTarget._id}/archive`)
      toast.success(
        archiveTarget.archived ? 'Client restauré' : 'Client archivé avec succès'
      )
      setArchiveTarget(null)
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’archivage')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            Gestion des clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consultez les coordonnées, encaissements et historiques de vos abonnés
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={openAddModal}>
          Ajouter un client
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding={false} className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone (+216...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              Effacer
            </Button>
          )}
        </div>
      </Card>

      {/* Table Card */}
      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client trouvé"
            description={
              search
                ? 'Aucun résultat ne correspond à votre recherche.'
                : 'Commencez par ajouter votre premier client.'
            }
            action={
              !search && (
                <Button variant="primary" icon={UserPlus} onClick={openAddModal}>
                  Ajouter un client
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Nom et Prénom</th>
                  <th className="px-4 py-3.5">Téléphone</th>
                  <th className="px-4 py-3.5">Abonnements</th>
                  <th className="px-4 py-3.5">Total facturé</th>
                  <th className="px-4 py-3.5">Total payé</th>
                  <th className="px-4 py-3.5">Reste à payer</th>
                  <th className="px-4 py-3.5">Dernière activité</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {clients.map((client) => {
                  const hasDebt = client.remaining > 0
                  return (
                    <tr
                      key={client._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                        <Link
                          to={`/clients/${client._id}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                        >
                          {client.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {client.phone ? (
                          <span className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {client.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {client.subscriptionCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(client.totalBilled)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(client.totalPaid)}
                      </td>
                      <td className="px-4 py-3.5">
                        {hasDebt ? (
                          <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                            {formatCurrency(client.remaining)}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Réglé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                        {formatDate(client.lastActivity)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/clients/${client._id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setArchiveTarget(client)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={client.archived ? 'Désarchiver' : 'Archiver'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Modifier le client' : 'Ajouter un nouveau client'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
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
                placeholder="Ex: Mohamed"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de famille *
              </label>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Ben Ali"
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
              placeholder="Ex: +216 22 108 267 ou 98123456"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes internes (facultatif)
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques, préférences du client, etc."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              {editingClient ? 'Enregistrer les modifications' : 'Ajouter le client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title={
          archiveTarget?.archived ? 'Désarchiver le client ?' : 'Archiver ce client ?'
        }
        message={`Êtes-vous sûr de vouloir ${
          archiveTarget?.archived ? 'désarchiver' : 'archiver'
        } ${archiveTarget?.fullName} ?`}
        confirmLabel={archiveTarget?.archived ? 'Désarchiver' : 'Archiver'}
        danger={!archiveTarget?.archived}
      />
    </div>
  )
}
