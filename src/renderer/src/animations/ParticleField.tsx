import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface ParticleFieldProps {
  density?: number
  className?: string
}

/**
 * Canvas particle field that drifts continuously and subtly repels away
 * from the mouse cursor, rendered behind the HUD panels.
 */
export function ParticleField({ density = 70, className }: ParticleFieldProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const particles: Particle[] = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.6 + 0.4
    }))

    const accentColor =
      getComputedStyle(document.documentElement).getPropertyValue('--gl-accent').trim() || '#00ff9c'

    let raf = 0
    const render = (): void => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        const dx = p.x - mouseRef.current.x
        const dy = p.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 90) {
          const force = (90 - dist) / 90
          p.x += (dx / (dist || 1)) * force * 1.4
          p.y += (dy / (dist || 1)) * force * 1.4
        }
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = accentColor
        ctx.globalAlpha = 0.5
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    const handleResize = (): void => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    const handleMouseMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [density])

  return <canvas ref={canvasRef} className={className} />
}
