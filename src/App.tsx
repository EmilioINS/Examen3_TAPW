import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StudentProvider } from './contexts/StudentContext'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calificaciones from './pages/Calificaciones'
import Kardex from './pages/Kardex'
import Horario from './pages/Horario'
import ProtectedRoute from './components/ProtectedRoute'

// Redirects authenticated users to dashboard, others to login
function CatchAll() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calificaciones"
              element={
                <ProtectedRoute>
                  <Calificaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kardex"
              element={
                <ProtectedRoute>
                  <Kardex />
                </ProtectedRoute>
              }
            />
            <Route
              path="/horario"
              element={
                <ProtectedRoute>
                  <Horario />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<CatchAll />} />
          </Routes>
        </BrowserRouter>
      </StudentProvider>
    </AuthProvider>
  )
}
