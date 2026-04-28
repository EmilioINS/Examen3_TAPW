import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
  ResponsiveContainer,
} from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faGraduationCap, faLayerGroup, faStar,
  faBookOpen, faChartPie, faScroll, faCalendarDays,
} from '@fortawesome/free-solid-svg-icons'
import ConstellationCanvas from '../components/ConstellationCanvas'
import Navbar from '../components/Navbar'
import { useStudent } from '../contexts/StudentContext'
import type { EstudianteData } from '../services/api'
import './Dashboard.css'

// Curated dark Unsplash photos — no API key needed (CDN direct links)
const DARK_PHOTOS = [
  'photo-1534796636912-3b95b3ab5986', // galaxy
  'photo-1464802686167-b939a6910659', // nebula
  'photo-1419242902214-272b3f66ee7a', // space
  'photo-1446776811953-b23d57bd21aa', // earth from space
  'photo-1509773896068-7fd415d91e2e', // dark mountain night
]

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 58
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none"
        stroke="rgba(255,255,255,0.1)" strokeWidth="13" />
      <circle cx="80" cy="80" r={r} fill="none"
        stroke={color} strokeWidth="13" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x="80" y="73" textAnchor="middle"
        fill="white" fontSize="30" fontWeight="700" fontFamily="system-ui">
        {pct}%
      </text>
      <text x="80" y="96" textAnchor="middle"
        fill="rgba(255,255,255,0.55)" fontSize="12" fontFamily="system-ui">
        completado
      </text>
    </svg>
  )
}

function StatCard({ icon, label, value }: {
  icon: IconDefinition; label: string; value: string | number
}) {
  return (
    <div className="stat-card glass">
      <span className="stat-card__icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, desc, to, color }: {
  icon: IconDefinition; label: string; desc: string; to: string; color: string
}) {
  return (
    <Link to={to} className="action-btn glass">
      <span className="action-btn__icon" style={{ color }}>
        <FontAwesomeIcon icon={icon} size="2x" />
      </span>
      <span className="action-btn__label">{label}</span>
      <span className="action-btn__desc">{desc}</span>
    </Link>
  )
}

function DashSkeleton() {
  return (
    <div className="dash-skeleton-wrap">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skel-block" />
      ))}
    </div>
  )
}

const TOOLTIP_STYLE = {
  background: 'rgba(10,14,26,0.92)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
}

// ── Main component ────────────────────────────────────────────────────────────

function DashboardContent({ student }: { student: EstudianteData }) {
  const photoSrc = student.foto ? `data:image/jpeg;base64,${student.foto}` : null
  const initial = student.persona.charAt(0)

  const aprobadas  = parseInt(student.materias_aprobadas)
  const reprobadas = parseInt(student.materias_reprobadas)
  const cursadas   = parseInt(student.materias_cursadas)
  const pPond = parseFloat(student.promedio_ponderado)
  const pArit = parseFloat(student.promedio_aritmetico)

  const materiasData = [
    { name: 'Aprobadas',  value: aprobadas,  fill: '#22c55e' },
    { name: 'Reprobadas', value: reprobadas, fill: '#ef4444' },
  ]

  const promediosData = [
    { name: 'Ponderado', value: parseFloat(pPond.toFixed(2)),  fill: '#60a5fa' },
    { name: 'Aritmético', value: parseFloat(pArit.toFixed(2)), fill: '#818cf8' },
  ]

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="dash-hero glass">
        <div className="dash-hero__photo">
          {photoSrc
            ? <img src={photoSrc} alt={student.persona} />
            : <span>{initial}</span>}
        </div>
        <div className="dash-hero__info">
          <p className="dash-hero__control">{student.numero_control}</p>
          <h1 className="dash-hero__name">{student.persona}</h1>
          <p className="dash-hero__email">{student.email}</p>
          <div className="dash-hero__tags">
            <span className="dash-tag dash-tag--green">Activo</span>
            <span className="dash-tag">Semestre {student.semestre}</span>
            <span className="dash-tag">Avance {student.porcentaje_avance}%</span>
          </div>
        </div>
      </section>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <section className="dash-stats">
        <StatCard icon={faGraduationCap} label="Semestre actual"      value={student.semestre} />
        <StatCard icon={faStar}          label="Promedio ponderado"   value={pPond.toFixed(2)} />
        <StatCard icon={faStar}          label="Promedio aritmético"  value={pArit.toFixed(2)} />
        <StatCard icon={faLayerGroup}    label="Créditos acumulados"  value={student.creditos_acumulados} />
        <StatCard icon={faBookOpen}      label="Materias cursadas aprobadas"    value={`${aprobadas} / ${cursadas}`} />
        {/* <StatCard icon={faChartPie}      label="Avance de carrera"    value={`${student.porcentaje_avance}%`} /> */}
      </section>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <section className="dash-charts">

        {/* Donut: materias */}
        <div className="glass chart-card">
          <h3 className="chart-title">Distribución de materias</h3>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={materiasData} cx="50%" cy="50%"
                  innerRadius={58} outerRadius={85}
                  paddingAngle={3} dataKey="value" isAnimationActive>
                  {materiasData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center" aria-hidden="true">
              <strong>{cursadas}</strong>
              <small>materias</small>
            </div>
          </div>
          <div className="chart-legend">
            {materiasData.map(d => (
              <span key={d.name} className="legend-item">
                <i style={{ background: d.fill }} />
                {d.name}: <b>{d.value}</b>
              </span>
            ))}
          </div>
        </div>

        {/* Bar: promedios */}
        <div className="glass chart-card">
          <h3 className="chart-title">Comparativa de promedios</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={promediosData}
              margin={{ top: 20, right: 12, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <YAxis domain={[75, 100]}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
                {promediosData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                <LabelList dataKey="value" position="top"
                  formatter={(v: unknown) => Number(v).toFixed(1)}
                  style={{ fill: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }} />
              </Bar>
              <Tooltip
                cursor={false}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#fff', fontWeight: 700 }}
                labelStyle={{ display: 'none' }}
                formatter={(v: unknown) => [Number(v).toFixed(2)]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ring: avance de carrera */}
        <div className="glass chart-card chart-card--center">
          <h3 className="chart-title">Avance de carrera</h3>
          <ProgressRing pct={student.porcentaje_avance} color="#3b82f6" />
          <p className="avance-sub">
            Cursando: <strong>{student.percentaje_avance_cursando}%</strong>
          </p>
          <p className="avance-sub">
            Créditos complementarios: <strong>{student.creditos_complementarios}</strong>
          </p>
        </div>

      </section>

      {/* ── Quick actions ───────────────────────────────────────────── */}
      <section className="dash-actions">
        <ActionBtn icon={faBookOpen}     label="Calificaciones" desc="Resultados del periodo actual"   to="/calificaciones" color="#60a5fa" />
        <ActionBtn icon={faScroll}       label="Kardex"         desc="Historial académico completo"    to="/kardex"         color="#818cf8" />
        <ActionBtn icon={faCalendarDays} label="Horario"        desc="Clases del semestre actual"      to="/horario"        color="#34d399" />
      </section>
    </>
  )
}

export default function Dashboard() {
  const { student, loading, error } = useStudent()

  const bgUrl = useMemo(() => {
    const id = DARK_PHOTOS[Math.floor(Math.random() * DARK_PHOTOS.length)]
    return `https://images.unsplash.com/${id}?w=1920&q=80&auto=format&fit=crop`
  }, [])

  return (
    <div className="dash-root">
      {/* Fixed dark background */}
      <div className="dash-bg">
        <div className="dash-bg__img" style={{ backgroundImage: `url(${bgUrl})` }} />
        <div className="dash-bg__overlay" />
        <ConstellationCanvas options={{ starColor: 'rgba(255,255,255,0.35)', lineColor: 'rgba(255,255,255,0.15)', length: 80 }} />
      </div>

      {/* Sticky navbar */}
      <Navbar />

      {/* Scrollable content */}
      <main className="dash-content">
        {loading && <DashSkeleton />}

        {error && (
          <div className="dash-error glass">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && !error && student && (
          <DashboardContent student={student} />
        )}
      </main>
    </div>
  )
}
