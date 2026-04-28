import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faBookOpen, faScroll, faCalendarDays,
  faChevronDown, faUser, faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import { useStudent } from '../contexts/StudentContext'
import './Navbar.css'
import logo from '../assets/logo_itc.png'

const NAV_LINKS = [
  { to: '/dashboard',       icon: faHouse,        label: 'Inicio' },
  { to: '/calificaciones',  icon: faBookOpen,     label: 'Calificaciones' },
  { to: '/kardex',          icon: faScroll,       label: 'Kardex' },
  { to: '/horario',         icon: faCalendarDays, label: 'Horario' },
]

export default function Navbar() {
  const { logout } = useAuth()
  const { student } = useStudent()
  const navigate = useNavigate()

  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Transparent ↔ solid based on scroll position
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleLogout() {
    setDropdownOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const photoSrc = student?.foto ? `data:image/jpeg;base64,${student.foto}` : null
  const firstName = student?.persona.split(' ').at(-1) ?? 'Usuario'

  return (
    <nav className={`navbar ${scrolled ? 'navbar--solid' : 'navbar--transparent'}`}>
      <div className="navbar__inner">

        {/* Logo TECNM  */}
        <img src={logo} sizes='' alt="Logo TECNM" style={{ width: '60px' , padding: '10px', marginRight: '20px' }} />
        

        {/* Brand */}
        {/*<NavLink to="/dashboard" className="navbar__brand">
          SII Celaya
        </NavLink> */}

        {/* Nav links */}
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

        {/* User dropdown */}
        <div className="navbar__user" ref={dropdownRef} style={{ paddingTop: '7px', paddingBottom: '5px' }}>
          <button
            className="navbar__user-btn"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
          >
            <div className="navbar__avatar">
              {photoSrc
                ? <img src={photoSrc} alt={firstName} />
                : <span>{firstName.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="navbar__username">{firstName}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`navbar__chevron${dropdownOpen ? ' navbar__chevron--open' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="navbar__dropdown">
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
  )
}
