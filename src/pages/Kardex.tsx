import { useState, useEffect, useMemo } from 'react'
import { getKardex } from '../services/api'
import type { KardexItem } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ConstellationCanvas from '../components/ConstellationCanvas'
import Navbar from '../components/Navbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartArea } from '@fortawesome/free-solid-svg-icons'
import { faFolderOpen } from '@fortawesome/free-regular-svg-icons'
import '../styles/page.css'
import './Kardex.css'

const DARK_PHOTOS = [
  'photo-1534796636912-3b95b3ab5986',
  'photo-1464802686167-b939a6910659',
  'photo-1419242902214-272b3f66ee7a',
  'photo-1446776811953-b23d57bd21aa',
  'photo-1509773896068-7fd415d91e2e',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

type GradeLevel = 'high' | 'mid' | 'low' | 'fail' | 'empty'

function gradeLevel(value: string | number | null): GradeLevel {
  if (value === null || value === '') return 'empty'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(n)) return 'empty'
  if (n >= 80) return 'high'
  if (n >= 70) return 'mid'
  if (n >= 60) return 'low'
  return 'fail'
}

function semesterAvg(items: KardexItem[]): string {
  const vals = items.map(i => parseFloat(i.calificacion)).filter(n => !isNaN(n))
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function semesterCredits(items: KardexItem[]): number {
  return items.reduce((sum, i) => sum + (parseInt(i.creditos) || 0), 0)
}

function groupBySemester(items: KardexItem[]): [number, KardexItem[]][] {
  const map = new Map<number, KardexItem[]>()
  for (const item of items) {
    const bucket = map.get(item.semestre) ?? []
    bucket.push(item)
    map.set(item.semestre, bucket)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a - b)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GradeBadge({ value }: { value: string }) {
  const level = gradeLevel(value)
  return (
    <span className={`grade-badge grade-badge--${level}`}>{value || '—'}</span>
  )
}

function SummaryBar({ avance, total, promedio, materias }: {
  avance: number; total: number; promedio: string; materias: number
}) {
  return (
    <div className="kdx-summary glass">
      <div className="kdx-summary__item">
        <span className="kdx-summary__val">{avance.toFixed(1)}%</span>
        <span className="kdx-summary__lbl">Avance de carrera</span>
      </div>
      <div className="kdx-summary__divider" />
      <div className="kdx-summary__item">
        <span className="kdx-summary__val">{promedio}</span>
        <span className="kdx-summary__lbl">Promedio general</span>
      </div>
      <div className="kdx-summary__divider" />
      <div className="kdx-summary__item">
        <span className="kdx-summary__val">{total}</span>
        <span className="kdx-summary__lbl">Créditos acumulados</span>
      </div>
      <div className="kdx-summary__divider" />
      <div className="kdx-summary__item">
        <span className="kdx-summary__val">{materias}</span>
        <span className="kdx-summary__lbl">Materias cursadas</span>
      </div>
    </div>
  )
}

function SemesterSection({ num, items }: { num: number; items: KardexItem[] }) {
  const avg = semesterAvg(items)
  const credits = semesterCredits(items)
  const avgLevel = gradeLevel(avg === '—' ? null : avg)

  return (
    <section className="kdx-semester">
      {/* Semester header */}
      <div className="kdx-semester__header">
        <div className="kdx-semester__label">
          <span className="kdx-sem-badge">S{num}</span>
          <h3 className="kdx-sem-title">Semestre {num}</h3>
          <span className="kdx-sem-count">{items.length} {items.length === 1 ? 'materia' : 'materias'}</span>
        </div>
        <div className="kdx-semester__stats">
          <span className="kdx-stat-chip">
            <FontAwesomeIcon icon={faFolderOpen} /> {credits} créditos
          </span>
          <span className={`kdx-stat-chip kdx-stat-chip--grade grade-badge--${avgLevel}`}>
            <FontAwesomeIcon icon={faChartArea} /> Promedio: {avg}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="glass kdx-table-wrap">
        <table className="kdx-table">
          <thead>
            <tr>
              <th className="kdx-th kdx-th--name">Materia</th>
              <th className="kdx-th">Clave</th>
              <th className="kdx-th kdx-th--center">Período</th>
              <th className="kdx-th kdx-th--center">Créditos</th>
              <th className="kdx-th kdx-th--type">Tipo</th>
              <th className="kdx-th kdx-th--center">Calificación</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.clave_materia}-${idx}`} className="kdx-row">
                <td className="kdx-td kdx-td--name">{item.nombre_materia}</td>
                <td className="kdx-td kdx-td--code">{item.clave_materia}</td>
                <td className="kdx-td kdx-td--center">
                  <span className="period-chip">{item.periodo}</span>
                </td>
                <td className="kdx-td kdx-td--center">{item.creditos}</td>
                <td className="kdx-td kdx-td--type">
                  <span className="desc-text">{item.descripcion}</span>
                </td>
                <td className="kdx-td kdx-td--center">
                  <GradeBadge value={item.calificacion} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Kardex() {
  const { token } = useAuth()
  const [avance, setAvance] = useState<number>(0)
  const [items, setItems]   = useState<KardexItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const bgUrl = useMemo(() => {
    const id = DARK_PHOTOS[Math.floor(Math.random() * DARK_PHOTOS.length)]
    return `https://images.unsplash.com/${id}?w=1920&q=80&auto=format&fit=crop`
  }, [])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    getKardex(token)
      .then(res => { setAvance(res.data.porcentaje_avance); setItems(res.data.kardex) })
      .catch(() => setError('No se pudo cargar el kardex.'))
      .finally(() => setLoading(false))
  }, [token])

  // Derived stats
  const totalCredits = useMemo(
    () => items?.reduce((s, i) => s + (parseInt(i.creditos) || 0), 0) ?? 0,
    [items]
  )
  const promedioGeneral = useMemo(() => {
    if (!items?.length) return '—'
    const vals = items.map(i => parseFloat(i.calificacion)).filter(n => !isNaN(n))
    return vals.length
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
      : '—'
  }, [items])

  const semesterGroups = useMemo(
    () => items ? groupBySemester(items) : [],
    [items]
  )

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
        {/* Page heading */}
        <div className="page-heading">
          <h1 className="page-title">Kardex</h1>
          <p className="page-subtitle">Historial académico completo por semestre</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="kdx-skeleton">
            {[80, 240, 240, 240].map((h, i) => (
              <div key={i} className="skel-shimmer" style={{ height: h }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass page-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && items && (
          <>
            <SummaryBar
              avance={avance}
              total={totalCredits}
              promedio={promedioGeneral}
              materias={items.length}
            />

            {semesterGroups.length === 0
              ? <p className="kdx-empty">No hay materias registradas en el kardex.</p>
              : semesterGroups.map(([num, semItems]) => (
                  <SemesterSection key={num} num={num} items={semItems} />
                ))
            }
          </>
        )}
      </main>
    </div>
  )
}
