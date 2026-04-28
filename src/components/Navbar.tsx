import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faBookOpen, faScroll, faCalendarDays,
  faChevronDown, faUser, faArrowRightFromBracket,
  faBars, faXmark, faStar
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import { useStudent } from '../contexts/StudentContext'
import './Navbar.css'
import logo from '../assets/logo_itc.png'

const NAV_LINKS = [
  { to: '/dashboard',      icon: faHouse,        label: 'Inicio' },
  { to: '/calificaciones', icon: faBookOpen,     label: 'Calificaciones' },
  { to: '/kardex',         icon: faScroll,       label: 'Kardex' },
  { to: '/horario',        icon: faCalendarDays, label: 'Horario' },
  { to: '/resenas',        icon: faStar,         label: 'Reseñas' },
]

export default function Navbar() {
  const { logout } = useAuth()
  const { student } = useStudent()
  const navigate = useNavigate()

  const [scrolled, setScrolled]         = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Transparent ↔ solid
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function handleLogout() {
    setDropdownOpen(false)
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const photoSrc  = student?.foto ? `data:image/jpeg;base64,${student.foto}` : null
  const firstName = student?.persona.split(' ').at(0) ?? 'Usuario'
  const fullName  = student?.persona ?? 'Usuario'

  const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <div className={`navbar__avatar navbar__avatar--${size}`}>
      {photoSrc
        ? <img src={photoSrc} alt={firstName} />
        : <span>{firstName.charAt(0).toUpperCase()}</span>}
    </div>
  )

  return (
    <>
      {/* ── Sticky navbar ─────────────────────────────────────────── */}
      <nav className={`navbar ${scrolled ? 'navbar--solid' : 'navbar--transparent'}`}>
        <div className="navbar__inner">

          {/* Logo */}
          <img src={logo} alt="Logo TECNM" className="navbar__logo" />

          {/* Desktop nav links */}
          <ul className="navbar__links">
            {NAV_LINKS.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link--active' : ''}`
                  }
                >
                  <FontAwesomeIcon icon={icon} className="navbar__link-icon" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile "Consulta" toggle — hidden on desktop */}
          <button
            className="navbar__consulta-btn"
            onClick={() => { setMenuOpen(o => !o); setDropdownOpen(false) }}
            aria-expanded={menuOpen}
            aria-label="Menú de consulta"
          >
            <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
            <span>Consulta</span>
          </button>

          {/* Profile dropdown — always on the right */}
          <div className="navbar__user" ref={dropdownRef}>
            <button
              className="navbar__user-btn"
              onClick={() => { setDropdownOpen(o => !o); setMenuOpen(false) }}
              aria-expanded={dropdownOpen}
            >
              <Avatar size="sm" />
              <span className="navbar__username">{firstName}</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`navbar__chevron${dropdownOpen ? ' navbar__chevron--open' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="navbar__dropdown">
                {/* Full name header inside dropdown */}
                <div className="navbar__dropdown-header">
                  <Avatar size="md" />
                  <div className="navbar__dropdown-userinfo">
                    <span className="navbar__dropdown-name">{fullName}</span>
                    <span className="navbar__dropdown-email">{student?.email ?? ''}</span>
                  </div>
                </div>

                <NavLink
                  to="/dashboard"
                  className="navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FontAwesomeIcon icon={faUser} />
                  Ver datos completos
                </NavLink>
                <button
                  className="navbar__dropdown-item navbar__dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* ── Mobile full-height menu panel ─────────────────────────── */}
      {menuOpen && (
        <div className="mobile-nav" role="dialog" aria-label="Menú de navegación">
          {/* User info */}
          <div className="mobile-nav__user">
            <Avatar size="lg" />
            <div>
              <p className="mobile-nav__fullname">{fullName}</p>
              <p className="mobile-nav__email">{student?.email ?? ''}</p>
            </div>
          </div>

          <div className="mobile-nav__divider" />

          {/* Nav links */}
          <nav className="mobile-nav__links">
            {NAV_LINKS.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <span className="mobile-nav__link-icon">
                  <FontAwesomeIcon icon={icon} />
                </span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mobile-nav__spacer" />

          {/* Logout */}
          <button className="mobile-nav__logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            Cerrar sesión
          </button>
        </div>
      )}
    </>
  )
}
