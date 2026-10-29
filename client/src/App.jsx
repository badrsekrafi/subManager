import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Subscriptions from './pages/Subscriptions'
import AddSubscription from './pages/AddSubscription'
import Payments from './pages/Payments'
import Unpaid from './pages/Unpaid'
import Expirations from './pages/Expirations'
import Settings from './pages/Settings'

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { admin, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Force password change on first login
  if (admin?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return children
}

// Public Route Guard (Login)
function PublicRoute({ children }) {
  const { admin, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    if (admin?.mustChangePassword) {
      return <Navigate to="/change-password" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f8fafc',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f8fafc',
                },
              },
            }}
          />

          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Forced Password Change */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Protected SaaS Layout & Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="subscriptions/add" element={<AddSubscription />} />
              <Route path="payments" element={<Payments />} />
              <Route path="unpaid" element={<Unpaid />} />
              <Route path="expirations" element={<Expirations />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
