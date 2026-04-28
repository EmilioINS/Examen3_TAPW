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

// ─── Estudiante ───────────────────────────────────────────────────────────────

export interface EstudianteData {
  numero_control: string
  persona: string
  email: string
  semestre: number
  num_mat_rep_no_acreditadas: string
  creditos_acumulados: string
  promedio_ponderado: string
  promedio_aritmetico: string
  materias_cursadas: string
  materias_reprobadas: string
  materias_aprobadas: string
  creditos_complementarios: number
  porcentaje_avance: number
  num_materias_rep_primera: string | null
  num_materias_rep_segunda: string | null
  percentaje_avance_cursando: number
  foto: string
}

export interface EstudianteResponse {
  code: number
  message: string
  flag: boolean
  data: EstudianteData
}

export function getEstudiante(token: string) {
  return request<EstudianteResponse>('/movil/estudiante', { headers: authHeaders(token) })
}

// ─── Calificaciones ───────────────────────────────────────────────────────────

export interface CalificacionItem {
  id_calificacion: number
  numero_calificacion: number
  calificacion: string | null
}

export interface MateriaEntry {
  materia: {
    id_grupo: number
    nombre_materia: string
    clave_materia: string
    letra_grupo: string
  }
  // Note: the API has a typo — "calificaiones" (missing 'c')
  calificaiones: CalificacionItem[]
}

export interface PeriodoCalificaciones {
  periodo: {
    clave_periodo: string
    anio: number
    descripcion_periodo: string
  }
  materias: MateriaEntry[]
}

export interface CalificacionesResponse {
  code: number
  message: string
  flag: boolean
  data: PeriodoCalificaciones[]
}

export function getCalificaciones(token: string) {
  return request<CalificacionesResponse>('/movil/estudiante/calificaciones', { headers: authHeaders(token) })
}

// ─── Kardex ───────────────────────────────────────────────────────────────────

export interface KardexItem {
  nombre_materia: string
  clave_materia: string
  periodo: string
  creditos: string
  calificacion: string
  descripcion: string
  semestre: number
}

export interface KardexResponse {
  code: number
  message: string
  flag: boolean
  data: {
    porcentaje_avance: number
    kardex: KardexItem[]
  }
}

export function getKardex(token: string) {
  return request<KardexResponse>('/movil/estudiante/kardex', { headers: authHeaders(token) })
}

// ─── Horarios ─────────────────────────────────────────────────────────────────

export interface HorarioItem {
  id_grupo: number
  letra_grupo: string
  nombre_materia: string
  clave_materia: string
  clave_turno: string
  nombre_plan: string
  letra_nivel: string
  lunes: string | null
  lunes_clave_salon: string | null
  martes: string | null
  martes_clave_salon: string | null
  miercoles: string | null
  miercoles_clave_salon: string | null
  jueves: string | null
  jueves_clave_salon: string | null
  viernes: string | null
  viernes_clave_salon: string | null
  sabado: string | null
  sabado_clave_salon: string | null
}

export interface PeriodoHorario {
  periodo: {
    clave_periodo: string
    anio: number
    descripcion_periodo: string
  }
  horario: HorarioItem[]
}

export interface HorariosResponse {
  code: number
  message: string
  flag: boolean
  data: PeriodoHorario[]
}

export function getHorarios(token: string) {
  return request<HorariosResponse>('/movil/estudiante/horarios', { headers: authHeaders(token) })
}
