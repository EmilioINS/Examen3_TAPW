import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getEstudiante, type EstudianteData } from '../services/api'
import { useAuth } from './AuthContext'

interface StudentContextValue {
  student: EstudianteData | null
  loading: boolean
  error: string | null
}

const StudentContext = createContext<StudentContextValue>({
  student: null,
  loading: true,
  error: null,
})

export function StudentProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [student, setStudent] = useState<EstudianteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStudent(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getEstudiante(token)
      .then(res => setStudent(res.data))
      .catch(() => setError('No se pudo cargar la información del estudiante.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <StudentContext.Provider value={{ student, loading, error }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  return useContext(StudentContext)
}
