import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { isTokenExpired } from '../utils/jwt'
import { registerUnauthorizedHandler, resetInterceptor } from '../services/api'

const TOKEN_KEY = 'sii_token'

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  saveToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Reads sessionStorage, evicting the token immediately if it is expired. */
function readStoredToken(): string | null {
  const stored = sessionStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  if (isTokenExpired(stored)) {
    sessionStorage.removeItem(TOKEN_KEY)
    return null
  }
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Expiry check happens synchronously in the initializer — no flicker.
  const [token, setToken] = useState<string | null>(readStoredToken)

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const saveToken = useCallback((newToken: string) => {
    sessionStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    // Re-arm the interceptor so the new session can trigger it once
    resetInterceptor()
  }, [])

  // Register the global 401/403 handler once.
  // Uses window.location.replace so the full page reloads cleanly,
  // resetting all React state without needing navigate() outside Router.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      sessionStorage.removeItem(TOKEN_KEY)
      window.location.replace('/login?expired=1')
    })
  }, [])

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
