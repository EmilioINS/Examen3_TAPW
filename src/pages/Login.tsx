import { useState, useEffect, useRef, type SubmitEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ConstellationCanvas from '../components/ConstellationCanvas'
import { login, extractToken, ApiError } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import logoTec from '../assets/logo_tec.png'
import logoLince from '../assets/logo_lince_login.png'
import slide1 from '../assets/bg/slide1.webp'
import slide2 from '../assets/bg/slide2.webp'
import slide3 from '../assets/bg/slide3.webp'
import slide4 from '../assets/bg/slide4.webp'
import slide5 from '../assets/bg/slide5.jpg'
import './Login.css'

const BG_IMAGES = [slide1, slide2, slide3, slide4, slide5]
const DISPLAY_MS = 10_000
const BG_OPACITY = 0.22

function preloadAll(srcs: string[]) {
  srcs.forEach(src => { const img = new Image(); img.src = src })
}

interface SlotState { idx: number; opacity: number }

/**
 * Cross-dissolve slideshow using an A/B slot pattern.
 *
 * Two divs always exist in the DOM — only their opacity changes via CSS
 * transition. We never create/destroy the element mid-transition (which would
 * skip the transition), so the browser always has a real opacity change to
 * animate on an existing element.
 *
 * Double rAF between the src-swap and the opacity-swap ensures the browser
 * has committed and painted the new backgroundImage at opacity-0 before we
 * trigger the transition.
 */
function BackgroundSlideshow() {
  const [slotA, setSlotA] = useState<SlotState>({ idx: 0, opacity: BG_OPACITY })
  const [slotB, setSlotB] = useState<SlotState>({ idx: 1, opacity: 0 })
  const activeRef = useRef<'a' | 'b'>('a')
  const imgIdxRef = useRef(0)

  useEffect(() => { preloadAll(BG_IMAGES) }, [])

  useEffect(() => {
    const tick = () => {
      imgIdxRef.current = (imgIdxRef.current + 1) % BG_IMAGES.length
      const nextImg = imgIdxRef.current

      if (activeRef.current === 'a') {
        // 1. Silently put next image on inactive slot B (opacity stays 0 → no pop)
        setSlotB({ idx: nextImg, opacity: 0 })
        // 2. After DOM commit + one paint, swap opacities → both CSS transitions fire
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setSlotA(prev => ({ ...prev, opacity: 0 }))
          setSlotB({ idx: nextImg, opacity: BG_OPACITY })
          activeRef.current = 'b'
        }))
      } else {
        setSlotA({ idx: nextImg, opacity: 0 })
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setSlotA({ idx: nextImg, opacity: BG_OPACITY })
          setSlotB(prev => ({ ...prev, opacity: 0 }))
          activeRef.current = 'a'
        }))
      }
    }

    const timer = setInterval(tick, DISPLAY_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-slideshow" aria-hidden="true">
      <div
        className="bg-slide"
        style={{ backgroundImage: `url(${BG_IMAGES[slotA.idx]})`, opacity: slotA.opacity }}
      />
      <div
        className="bg-slide"
        style={{ backgroundImage: `url(${BG_IMAGES[slotB.idx]})`, opacity: slotB.opacity }}
      />
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'
  const { saveToken, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => { emailRef.current?.focus() }, [])

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return }
    if (!password) { setError('Ingresa tu contraseña.'); return }

    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      saveToken(extractToken(res))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 422) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
        } else if (err.status >= 500) {
          setError('El servidor no está disponible. Intenta más tarde.')
        } else {
          setError(err.message)
        }
      } else {
        setError('No se pudo conectar con el servidor. Verifica tu conexión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-bg__color" />
        <BackgroundSlideshow />
        <ConstellationCanvas />
      </div>

      <div className="login-scene">
        <img src={logoLince} alt="" className="login-lince" aria-hidden="true" />

        <div className="login-card">
          <div className="login-logos">
            <img src={logoTec} alt="Tecnológico Nacional de México" className="login-logo" />
          </div>

          <h1 className="login-title">
            Plataforma <span>SII</span><br />Inicia sesión
          </h1>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {sessionExpired && (
              <div className="login-expired" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Tu sesión expiró. Inicia sesión nuevamente.
              </div>
            )}
            <div className="login-field">
              <input
                ref={emailRef}
                id="email"
                type="email"
                placeholder=" "
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
              <label htmlFor="email">Correo electrónico</label>
            </div>

            <div className="login-field">
              <input
                id="password"
                type="password"
                placeholder=" "
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <label htmlFor="password">Contraseña</label>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" aria-label="Cargando" /> : 'Entrar'}
            </button>
          </form>

          <p className="login-footer">
            ¿Olvidó su contraseña?&nbsp;
            <a href="https://sii.celaya.tecnm.mx" target="_blank" rel="noopener noreferrer">
              Ir al portal
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
