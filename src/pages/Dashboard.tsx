import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logoTec from '../assets/logo_tec.png'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { logout, token } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  // Show a short preview of the token so the user can confirm it's stored
  const tokenPreview = token
    ? `${token.slice(0, 24)}…`
    : null

  return (
    <div className="dash-root">
      {/* ── Top navbar ─────────────────────────────────────────────── */}
      <header className="dash-navbar">
        <div className="dash-navbar__brand">
          <img src={logoTec} alt="TecNM" className="dash-navbar__logo" />
          <span className="dash-navbar__title">SII Celaya</span>
        </div>

        <nav className="dash-navbar__links">
          <a href="#" className="dash-navlink dash-navlink--active">Inicio</a>
          <a href="#" className="dash-navlink">Calificaciones</a>
          <a href="#" className="dash-navlink">Kardex</a>
          <a href="#" className="dash-navlink">Horario</a>
        </nav>

        <button className="dash-navbar__logout" onClick={handleLogout}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm11.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L15.586 11H9a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Cerrar sesión
        </button>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="dash-main">
        <div className="dash-welcome">
          <h1 className="dash-welcome__title">Sesión iniciada correctamente</h1>
          <p className="dash-welcome__subtitle">
            Tu token JWT fue almacenado en la sesión y está listo para autenticar
            las siguientes peticiones.
          </p>

          {tokenPreview && (
            <div className="dash-token-box">
              <span className="dash-token-box__label">Token activo</span>
              <code className="dash-token-box__value">{tokenPreview}</code>
            </div>
          )}

          <div className="dash-cards">
            {[
              { label: 'Calificaciones', desc: 'Ver resultados del periodo actual' },
              { label: 'Kardex',         desc: 'Historial académico completo' },
              { label: 'Horario',        desc: 'Clases del semestre actual' },
            ].map(c => (
              <button key={c.label} className="dash-card">
                <span className="dash-card__label">{c.label}</span>
                <span className="dash-card__desc">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
