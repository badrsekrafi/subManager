import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import Button from '../components/ui/Button'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Mot de passe mis à jour avec succès !')
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white/10 dark:bg-gray-850/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Changement de mot de passe obligatoire</h1>
            <p className="text-xs text-gray-300 mt-1">
              Pour des raisons de sécurité, veuillez remplacer le mot de passe temporaire par un mot de passe personnalisé.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-2.5 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-200 mb-1.5">
                Mot de passe temporaire actuel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-200 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-200 mb-1.5">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Enregistrer et continuer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
