import { useEffect, useRef } from 'react'

interface ConstellationOptions {
  starColor?: string
  lineColor?: string
  starWidth?: number
  length?: number
  distance?: number
  velocity?: number
}

export default function ConstellationCanvas({ options = {} }: { options?: ConstellationOptions }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const el = canvasRef.current as HTMLCanvasElement
    const ctx = el.getContext('2d')!

    const cfg = {
      starColor: options.starColor ?? 'rgba(255,255,255,0.6)',
      lineColor: options.lineColor ?? 'rgba(255,255,255,0.4)',
      starWidth: options.starWidth ?? 2,
      length: options.length ?? 100,
      distance: options.distance ?? 120,
      velocity: options.velocity ?? 0.15,
      radius: window.innerWidth / 5,
    }

    interface Star { x: number; y: number; vx: number; vy: number; r: number }

    let stars: Star[] = []
    let mouse = { x: el.width * 0.5, y: el.height * 0.5 }
    let rafId: number

    function resize() {
      const oldW = el.width
      const oldH = el.height
      el.width = window.innerWidth
      el.height = window.innerHeight
      cfg.radius = el.width / 5
      if (oldW > 0) {
        const sx = el.width / oldW
        const sy = el.height / oldH
        for (const s of stars) { s.x *= sx; s.y *= sy }
      }
      mouse = { x: el.width * 0.5, y: el.height * 0.5 }
    }

    function initStars() {
      stars = Array.from({ length: cfg.length }, () => ({
        x: Math.random() * el.width,
        y: Math.random() * el.height,
        vx: cfg.velocity - Math.random() * cfg.velocity * 2,
        vy: cfg.velocity - Math.random() * cfg.velocity * 2,
        r: Math.random() * cfg.starWidth,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.fillStyle = cfg.starColor
      ctx.strokeStyle = cfg.lineColor
      ctx.lineWidth = 0.3

      for (const s of stars) {
        if (s.y < 0 || s.y > el.height) s.vy = -s.vy
        if (s.x < 0 || s.x > el.width) s.vx = -s.vx
        s.x += s.vx
        s.y += s.vy
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < cfg.length; i++) {
        for (let j = 0; j < cfg.length; j++) {
          const a = stars[i], b = stars[j]
          const dx = a.x - b.x, dy = a.y - b.y
          if (Math.abs(dx) < cfg.distance && Math.abs(dy) < cfg.distance) {
            const mx = a.x - mouse.x, my = a.y - mouse.y
            if (Math.abs(mx) < cfg.radius && Math.abs(my) < cfg.radius) {
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    function onMouseMove(e: MouseEvent) {
      mouse = { x: e.clientX, y: e.clientY }
    }

    resize()
    initStars()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
