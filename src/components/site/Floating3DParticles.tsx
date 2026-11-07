'use client'

import { useEffect, useRef, type CanvasHTMLAttributes } from 'react'

type Floating3DParticlesProps = Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  'width' | 'height'
> & {
  color?: string
  depth?: number
  drift?: number
  opacity?: number
  quantity?: number
  size?: number
}

type Particle = {
  angle: number
  angularSpeed: number
  opacity: number
  projectedScale: number
  radius: number
  screenX: number
  screenY: number
  size: number
  y: number
}

const MOBILE_BREAKPOINT = 768
const MAX_DPR = 2
const SPREAD_FACTOR = 1.2

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '').trim()
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : clean

  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(216,255,62,${alpha})`

  const value = Number.parseInt(full, 16)
  return `rgba(${(value >> 16) & 0xff},${(value >> 8) & 0xff},${value & 0xff},${alpha})`
}

function projectionFor(depth: number) {
  const normalizedDepth = Math.max(0, Math.min(1, depth))
  const fieldOfView = 800 - normalizedDepth * 600
  const perspectiveDistance = 100 + normalizedDepth * 700
  const depthRange =
    normalizedDepth * Math.min(400, fieldOfView + perspectiveDistance - 1)

  return { depthRange, fieldOfView, perspectiveDistance }
}

function createParticle(width: number, height: number, size: number, opacity: number): Particle {
  const sizeVariance = size * 0.4
  const opacityVariance = 0.2

  return {
    angle: Math.random() * Math.PI * 2,
    angularSpeed: 0.0015 + Math.random() * 0.001,
    opacity: Math.min(
      1,
      Math.max(0, opacity - opacityVariance + Math.random() * opacityVariance * 2),
    ),
    projectedScale: 1,
    radius: Math.random() * Math.max(width, height) * SPREAD_FACTOR,
    screenX: 0,
    screenY: 0,
    size: Math.max(0.5, size - sizeVariance + Math.random() * sizeVariance * 2),
    y: (Math.random() - 0.5) * height * 2,
  }
}

// Adapted from Magic UI's Floating 3D Particles registry component.
export function Floating3DParticles({
  className,
  color = '#d8ff3e',
  depth = 0.62,
  drift = 0.34,
  opacity = 0.28,
  quantity = 400,
  size = 4,
  style,
  ...canvasProps
}: Floating3DParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return
    const targetCanvas = canvas
    const renderingContext = context
    const cssVariable = color.match(/^var\((--[^)]+)\)$/)?.[1]
    const resolvedColor = cssVariable
      ? getComputedStyle(targetCanvas).getPropertyValue(cssVariable).trim()
      : color

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const { depthRange, fieldOfView, perspectiveDistance } = projectionFor(depth)
    let animationFrame: number | undefined
    let height = 1
    let isIntersecting = true
    let mounted = true
    let particles: Particle[] = []
    let width = 1

    function drawParticle(particle: Particle) {
      const radius = Math.max(0, particle.size * particle.projectedScale)
      if (radius <= 0) return

      renderingContext.beginPath()
      renderingContext.fillStyle = hexToRgba(resolvedColor, particle.opacity)
      renderingContext.arc(particle.screenX, particle.screenY, radius, 0, Math.PI * 2)
      renderingContext.fill()
    }

    function projectParticles(update: boolean) {
      renderingContext.clearRect(0, 0, width, height)
      const centerX = width / 2
      const centerY = height / 2

      for (const particle of particles) {
        if (update) {
          particle.angle += particle.angularSpeed
          particle.y -= drift

          if (particle.y < -height) {
            particle.y = height
            particle.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR
          } else if (particle.y > height) {
            particle.y = -height
            particle.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR
          }
        }

        const denominator = Math.max(
          1,
          fieldOfView +
            perspectiveDistance +
            (update ? Math.sin(particle.angle) * depthRange : 0),
        )
        const scale = fieldOfView / denominator
        particle.screenX = centerX + Math.cos(particle.angle) * particle.radius * scale
        particle.screenY = centerY + particle.y * scale
        particle.projectedScale = scale
      }

      particles.sort((first, second) => first.projectedScale - second.projectedScale)
      particles.forEach(drawParticle)
    }

    function shouldAnimate() {
      return mounted && isIntersecting && !document.hidden && !motionQuery.matches
    }

    function tick() {
      animationFrame = undefined
      if (!shouldAnimate()) return
      projectParticles(true)
      animationFrame = window.requestAnimationFrame(tick)
    }

    function syncAnimation() {
      if (!shouldAnimate()) {
        if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
        animationFrame = undefined
        if (motionQuery.matches) projectParticles(false)
        return
      }

      if (animationFrame === undefined) animationFrame = window.requestAnimationFrame(tick)
    }

    function resize() {
      const bounds = targetCanvas.getBoundingClientRect()
      width = Math.max(1, Math.round(bounds.width))
      height = Math.max(1, Math.round(bounds.height))
      const density = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR))

      targetCanvas.width = Math.round(width * density)
      targetCanvas.height = Math.round(height * density)
      renderingContext.setTransform(density, 0, 0, density, 0, 0)

      const particleCount =
        window.innerWidth < MOBILE_BREAKPOINT ? Math.round(quantity * 0.2) : quantity
      particles = Array.from({ length: Math.max(0, particleCount) }, () =>
        createParticle(width, height, size, opacity),
      )
      projectParticles(false)
      syncAnimation()
    }

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(
            ([entry]) => {
              if (!entry) return
              isIntersecting = entry.isIntersecting
              syncAnimation()
            },
            { threshold: 0 },
          )

    function handleMotionPreference() {
      syncAnimation()
    }

    resizeObserver?.observe(targetCanvas)
    if (!resizeObserver) window.addEventListener('resize', resize)
    intersectionObserver?.observe(targetCanvas)
    document.addEventListener('visibilitychange', syncAnimation)
    motionQuery.addEventListener('change', handleMotionPreference)
    resize()

    return () => {
      mounted = false
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      if (!resizeObserver) window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', syncAnimation)
      motionQuery.removeEventListener('change', handleMotionPreference)
    }
  }, [color, depth, drift, opacity, quantity, size])

  return (
    <canvas
      {...canvasProps}
      aria-hidden="true"
      className={['floating-3d-particles', className].filter(Boolean).join(' ')}
      ref={canvasRef}
      style={style}
    />
  )
}
