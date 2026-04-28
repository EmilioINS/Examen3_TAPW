
const BASE_URL = import.meta.env.VITE_REVIEWS_API_URL || '/api/v1'

export class LocalApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'LocalApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('local_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = typeof body?.error === 'string' ? body.error : `Error ${res.status}`
    throw new LocalApiError(res.status, msg)
  }

  return res.json()
}

// ─── AUTHENTICATION SYNC ──────────────────────────────────────────────────
// Se encarga de sincronizar el usuario del SII con el backend local

export async function syncWithLocalBackend(email: string) {
  const password = 'sii_synced_password_123!' // default dummy password for sync
  
  try {
    // Intentamos login
    const res = await request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    localStorage.setItem('local_token', res.token)
  } catch (error: any) {
    if (error.status === 401) {
      // Si falla por credenciales, lo registramos
      await request<{ user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: 'student' })
      })
      // Y luego login
      const res = await request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      localStorage.setItem('local_token', res.token)
    }
  }
}

// ─── PROFESORES ─────────────────────────────────────────────────────────────

export interface Teacher {
  id: string
  name: string
  department: string
}

export function getTeachers() {
  return request<Teacher[]>('/teachers')
}

// ─── RESEÑAS ────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  period_id: string
  rating: number
  comment: string
  status: string
  created_at: string
  subject_id: string
  subjects?: {
    name: string
    code: string
  }
}

export function getTeacherReviews(teacherId: string) {
  return request<Review[]>(`/teachers/${teacherId}/reviews`)
}

export function createReview(data: { teacher_id: string; subject_id: string; period_id: string; rating: number; comment: string }) {
  return request<{ message: string, review: any }>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// ─── MATERIAS (Opcional, para el form) ──────────────────────────────────────

export interface Subject {
  id: string
  name: string
  code: string
}

export function getSubjects() {
  return request<Subject[]>('/subjects')
}
