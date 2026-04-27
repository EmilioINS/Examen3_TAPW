// In dev, Vite proxies /api → https://sii.celaya.tecnm.mx (avoids CORS).
// In production a server-level proxy or CORS headers are required.
const BASE_URL = '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ─── Global 401/403 interceptor ──────────────────────────────────────────────
// Registered once by AuthContext. Fires at most once per session to avoid
// triggering multiple redirects when concurrent requests all fail.
let unauthorizedHandler: (() => void) | null = null
let interceptorFired = false

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
  interceptorFired = false  // reset so the new session can trigger once
}

export function resetInterceptor(): void {
  interceptorFired = false
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  if (res.status === 401 || res.status === 403) {
    if (!interceptorFired) {
      interceptorFired = true
      unauthorizedHandler?.()
    }
    throw new ApiError(res.status, 'Sesión expirada o no autorizada.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = typeof body?.message === 'string'
      ? body.message
      : `Error ${res.status}`
    throw new ApiError(res.status, msg)
  }

  return res.json()
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ─── API endpoints ────────────────────────────────────────────────────────────

// Actual API response shape from POST /api/login
export interface LoginResponse {
  responseCodeTxt: string
  message: {
    login: {
      token: string
    }
  }
  status: number
  flag: string
  data: number
  type: string
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// Extracts the JWT from the nested response
export function extractToken(res: LoginResponse): string {
  return res.message.login.token
}

export function getEstudiante(token: string) {
  return request('/movil/estudiante', { headers: authHeaders(token) })
}

export function getCalificaciones(token: string) {
  return request('/movil/estudiante/calificaciones', { headers: authHeaders(token) })
}

export function getKardex(token: string) {
  return request('/movil/estudiante/kardex', { headers: authHeaders(token) })
}

export function getHorarios(token: string) {
  return request('/movil/estudiante/horarios', { headers: authHeaders(token) })
}
