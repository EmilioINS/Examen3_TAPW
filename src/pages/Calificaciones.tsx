import { useState, useEffect, useMemo } from 'react'
import { getCalificaciones } from '../services/api'
import type { PeriodoCalificaciones, MateriaEntry, CalificacionItem } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ConstellationCanvas from '../components/ConstellationCanvas'
import Navbar from '../components/Navbar'
import './Calificaciones.css'

const DARK_PHOTOS = [
  'photo-1534796636912-3b95b3ab5986',
  'photo-1464802686167-b939a6910659',
  'photo-1419242902214-272b3f66ee7a',
  'photo-1446776811953-b23d57bd21aa',
  'photo-1509773896068-7fd415d91e2e',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGrade(grades: CalificacionItem[], parcial: number): string | null {
  return grades.find(g => g.numero_calificacion === parcial)?.calificacion ?? null
}

function calcPromedio(grades: CalificacionItem[]): number | null {
  const vals = grades
    .filter(g => g.calificacion !== null)
    .map(g => parseInt(g.calificacion!))
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

type GradeLevel = 'high' | 'mid' | 'low' | 'fail' | 'empty'

function gradeLevel(value: number | string | null): GradeLevel {
  if (value === null) return 'empty'
  const n = typeof value === 'string' ? parseInt(value) : value
  if (isNaN(n)) return 'empty'
  if (n >= 80) return 'high'
  if (n >= 70) return 'mid'
  if (n >= 60) return 'low'
  return 'fail'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string | null }) {
  const level = gradeLevel(grade)
  return (
    <span className={`grade-badge grade-badge--${level}`}>
      {grade ?? '—'}
    </span>
  )
}

function PromedioCell({ grades }: { grades: CalificacionItem[] }) {
  const prom = calcPromedio(grades)
  if (prom === null) return <span className="grade-badge grade-badge--empty">—</span>
  const display = prom.toFixed(1)
  const level = gradeLevel(prom)
  return <span className={`grade-badge grade-badge--${level} grade-badge--prom`}>{display}</span>
}

function MateriaRow({ entry }: { entry: MateriaEntry }) {
  const { materia, calificaiones } = entry
  const parciales = [1, 2, 3, 4] as const

  return (
    <tr className="cal-row">
      <td className="cal-td cal-td--name">
        <span className="mat-name">{materia.nombre_materia}</span>
      </td>
      <td className="cal-td cal-td--code">{materia.clave_materia}</td>
      <td className="cal-td cal-td--group">
        <span className="group-badge">{materia.letra_grupo}</span>
      </td>
      {parciales.map(p => (
        <td key={p} className="cal-td cal-td--grade">
          <GradeBadge grade={getGrade(calificaiones, p)} />
        </td>
      ))}
      <td className="cal-td cal-td--prom">
        <PromedioCell grades={calificaiones} />
      </td>
    </tr>
  )
}

function PeriodoSection({ periodo }: { periodo: PeriodoCalificaciones }) {
  return (
    <section className="periodo-section">
      {/* Period header */}
      <div className="periodo-header">
        <div className="periodo-info">
          <h2 className="periodo-title">{periodo.periodo.descripcion_periodo}</h2>
          <span className="periodo-clave">{periodo.periodo.clave_periodo}</span>
        </div>
        <span className="periodo-year">{periodo.periodo.anio}</span>
      </div>

      {/* Transparent borderless table */}
      <div className="glass cal-table-wrap">
        <table className="cal-table">
          <thead>
            <tr>
              <th className="cal-th cal-th--name">Materia</th>
              <th className="cal-th">Clave</th>
              <th className="cal-th">Grupo</th>
              <th className="cal-th cal-th--center">P1</th>
              <th className="cal-th cal-th--center">P2</th>
              <th className="cal-th cal-th--center">P3</th>
              <th className="cal-th cal-th--center">P4</th>
              <th className="cal-th cal-th--center">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {periodo.materias.map(m => (
              <MateriaRow key={m.materia.id_grupo} entry={m} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Calificaciones() {
  const { token } = useAuth()
  const [data, setData] = useState<PeriodoCalificaciones[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bgUrl = useMemo(() => {
    const id = DARK_PHOTOS[Math.floor(Math.random() * DARK_PHOTOS.length)]
    return `https://images.unsplash.com/${id}?w=1920&q=80&auto=format&fit=crop`
  }, [])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    getCalificaciones(token)
      .then(res => setData(res.data))
      .catch(() => setError('No se pudieron cargar las calificaciones.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="page-root">
      {/* Fixed dark background */}
      <div className="page-bg">
        <div className="page-bg__img" style={{ backgroundImage: `url(${bgUrl})` }} />
        <div className="page-bg__overlay" />
        <ConstellationCanvas
          options={{ starColor: 'rgba(255,255,255,0.35)', lineColor: 'rgba(255,255,255,0.15)', length: 80 }}
        />
      </div>

      <Navbar />

      <main className="page-content">
        {/* Page title */}
        <div className="page-heading">
          <h1 className="page-title">Calificaciones</h1>
          <p className="page-subtitle">Resultados del periodo académico actual</p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="cal-skeleton">
            {[200, 160, 160, 160].map((h, i) => (
              <div key={i} className="cal-skel-row" style={{ height: h }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass page-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          data.length === 0
            ? <p className="cal-empty">No hay calificaciones registradas para este periodo.</p>
            : data.map(p => (
                <PeriodoSection key={p.periodo.clave_periodo} periodo={p} />
              ))
        )}
      </main>
    </div>
  )
}
