import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)
      if (data?.admin?.mustChangePassword || data?.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Échec de connexion. Veuillez vérifier vos identifiants ou réessayer plus tard.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-gray-100">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-scale-in">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SubManager</h1>
          <p className="text-sm text-indigo-200 mt-1">
            Gestion sécurisée des abonnements numériques
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 dark:bg-gray-850/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Espace Administrateur</h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3 text-red-200 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-200 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-200 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white font-semibold"
              >
                Se connecter
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-400">
              Protection anti-bruteforce activée • Session protégée par JWT HttpOnly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
