import { useState, useEffect, useMemo } from 'react'
import { getHorarios } from '../services/api'
import type { HorarioItem, PeriodoHorario } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ConstellationCanvas from '../components/ConstellationCanvas'
import Navbar from '../components/Navbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faCalendarWeek, faClock, faBook,
  faLayerGroup, faChalkboard,
} from '@fortawesome/free-solid-svg-icons'
import '../styles/page.css'
import './Horario.css'

const DARK_PHOTOS = [
  'photo-1534796636912-3b95b3ab5986',
  'photo-1464802686167-b939a6910659',
  'photo-1419242902214-272b3f66ee7a',
  'photo-1446776811953-b23d57bd21aa',
  'photo-1509773896068-7fd415d91e2e',
]

// ── Day definitions ───────────────────────────────────────────────────────────

type DayKey    = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
type SalonKey  = `${DayKey}_clave_salon`

const ALL_DAYS: { key: DayKey; salonKey: SalonKey; label: string; color: string }[] = [
  { key: 'lunes',     salonKey: 'lunes_clave_salon',     label: 'Lunes',      color: '#60a5fa' },
  { key: 'martes',    salonKey: 'martes_clave_salon',    label: 'Martes',     color: '#a78bfa' },
  { key: 'miercoles', salonKey: 'miercoles_clave_salon', label: 'Miércoles',  color: '#34d399' },
  { key: 'jueves',    salonKey: 'jueves_clave_salon',    label: 'Jueves',     color: '#9177df' },
  { key: 'viernes',   salonKey: 'viernes_clave_salon',   label: 'Viernes',    color: '#29b17f' },
  { key: 'sabado',    salonKey: 'sabado_clave_salon',    label: 'Sábado',     color: '#f472b6' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseHours(time: string): number {
  const [start, end] = time.split('-')
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

function totalWeeklyHours(items: HorarioItem[]): number {
  return items.reduce((sum, item) =>
    sum + ALL_DAYS.reduce((d, day) => {
      const t = item[day.key]
      return d + (t ? parseHours(t) : 0)
    }, 0), 0)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DayCell({ time, salon, color }: { time: string | null; salon: string | null; color: string }) {
  if (!time) return <span className="hor-empty">—</span>
  return (
    <div className="hor-cell" style={{ '--day-color': color } as React.CSSProperties}>
      <span className="hor-cell__time">
        <FontAwesomeIcon icon={faClock} className="hor-cell__icon" />
        {time}
      </span>
      {salon && (
        <span className="hor-cell__salon">
          <FontAwesomeIcon icon={faChalkboard} className="hor-cell__icon" />
          {salon}
        </span>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: IconDefinition; label: string; value: string | number }) {
  return (
    <div className="hor-stat glass">
      <span className="hor-stat__icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <p className="hor-stat__label">{label}</p>
        <p className="hor-stat__value">{value}</p>
      </div>
    </div>
  )
}

function PeriodoSchedule({ periodo }: { periodo: PeriodoHorario }) {
  const { horario } = periodo

  // Only render columns for days that have at least one class
  const activeDays = ALL_DAYS.filter(d =>
    horario.some(item => item[d.key] !== null)
  )

  const horasTotal  = totalWeeklyHours(horario)
  const diasActivos = activeDays.length

  return (
    <section className="hor-section">
      {/* Period header */}
      <div className="hor-period-header">
        <div className="hor-period-info">
          <h2 className="hor-period-title">{periodo.periodo.descripcion_periodo}</h2>
          <span className="hor-period-clave">{periodo.periodo.clave_periodo}</span>
        </div>
        <span className="hor-period-year">{periodo.periodo.anio}</span>
      </div>

      {/* Summary stats */}
      <div className="hor-stats">
        <StatCard icon={faBook}         label="Materias inscritas"  value={horario.length} />
        <StatCard icon={faClock}        label="Horas por semana"    value={`${horasTotal}h`} />
        <StatCard icon={faLayerGroup}   label="Días con clases"     value={diasActivos} />
      </div>

      {/* Schedule table */}
      <div className="glass hor-table-wrap">
        <table className="hor-table">
          <thead>
            <tr>
              <th className="hor-th hor-th--name">Materia</th>
              <th className="hor-th hor-th--code">Clave</th>
              {activeDays.map(d => (
                <th
                  key={d.key}
                  className="hor-th hor-th--day"
                  style={{ color: d.color }}
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horario.map(item => (
              <tr key={item.id_grupo} className="hor-row">
                <td className="hor-td hor-td--name">
                  <span className="hor-materia">{item.nombre_materia}</span>
                  <span className="hor-grupo">Grupo {item.letra_grupo}</span>
                </td>
                <td className="hor-td hor-td--code">
                  <span className="hor-clave">{item.clave_materia}</span>
                </td>
                {activeDays.map(d => (
                  <td key={d.key} className="hor-td hor-td--day">
                    <DayCell
                      time={item[d.key]}
                      salon={item[d.salonKey]}
                      color={d.color}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Horario() {
  const { token } = useAuth()
  const [data, setData]     = useState<PeriodoHorario[] | null>(null)
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
    getHorarios(token)
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar el horario.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="page-root">
      <div className="page-bg">
        <div className="page-bg__img" style={{ backgroundImage: `url(${bgUrl})` }} />
        <div className="page-bg__overlay" />
        <ConstellationCanvas
          options={{ starColor: 'rgba(255,255,255,0.35)', lineColor: 'rgba(255,255,255,0.15)', length: 80 }}
        />
      </div>

      <Navbar />

      <main className="page-content">
        <div className="page-heading">
          <h1 className="page-title">
            <FontAwesomeIcon icon={faCalendarWeek} className="hor-title-icon" />
            Horario
          </h1>
          <p className="page-subtitle">Clases del semestre actual</p>
        </div>

        {loading && (
          <div className="hor-skeleton">
            {[80, 130, 320].map((h, i) => (
              <div key={i} className="skel-shimmer" style={{ height: h }} />
            ))}
          </div>
        )}

        {error && (
          <div className="glass page-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && !error && data && (
          data.length === 0
            ? <p className="hor-empty-msg">No hay horario registrado para este periodo.</p>
            : data.map(p => (
                <PeriodoSchedule key={p.periodo.clave_periodo} periodo={p} />
              ))
        )}
      </main>
    </div>
  )
}
