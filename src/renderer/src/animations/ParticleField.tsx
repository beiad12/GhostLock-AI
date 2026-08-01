import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'

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

const TARGET_FPS = 30
const FRAME_BUDGET_MS = 1000 / TARGET_FPS

/**
 * Canvas particle field that drifts continuously and subtly repels away
 * from the mouse cursor, rendered behind the HUD panels.
 *
 * Capped to ~30fps (animation this subtle doesn't need 60) and scaled down
 * by the "Animation Intensity" setting to keep idle CPU usage low — this
 * component is mounted on nearly every screen, so its cost adds up.
 */
export function ParticleField({
  density = 70,
  className
}: ParticleFieldProps): React.JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const intensity = useSettingsStore((s) => s.settings.animationIntensity)

  const effectiveDensity =
    intensity === 'low' ? 0 : intensity === 'balanced' ? Math.round(density * 0.5) : density

  useEffect(() => {
    if (effectiveDensity === 0) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const particles: Particle[] = Array.from({ length: effectiveDensity }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.6 + 0.4
    }))

    const accentColor =
      getComputedStyle(document.documentElement).getPropertyValue('--gl-accent').trim() || '#00ff9c'

    let raf = 0
    let lastFrameTime = 0
    const render = (now: number): void => {
      raf = requestAnimationFrame(render)
      if (now - lastFrameTime < FRAME_BUDGET_MS) return
      lastFrameTime = now

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
  }, [effectiveDensity])

  if (effectiveDensity === 0) return null

  return <canvas ref={canvasRef} className={className} />
}
