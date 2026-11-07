'use client'

import { useEffect, useRef } from 'react'

type MorphingTextProps = {
  className?: string
  holdDuration?: number
  morphDuration?: number
  texts: readonly string[]
}

// Dependency-free adaptation of Magic UI's Morphing Text interaction model.
export function MorphingText({
  className,
  holdDuration = 1.25,
  morphDuration = 1.05,
  texts,
}: MorphingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstTextRef = useRef<HTMLSpanElement>(null)
  const secondTextRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const firstText = firstTextRef.current
    const secondText = secondTextRef.current
    if (!container || !firstText || !secondText || !texts.length) return
    const target = container
    const currentText = firstText
    const nextText = secondText

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame: number | undefined
    let elapsed = 0
    let index = 0
    let isIntersecting = true
    let lastTime = performance.now()
    let phase: 'hold' | 'morph' = 'hold'

    function showStaticText() {
      currentText.textContent = texts[0] || ''
      currentText.style.filter = 'none'
      currentText.style.opacity = '1'
      nextText.textContent = ''
      nextText.style.opacity = '0'
    }

    function showCurrentText() {
      currentText.textContent = texts[index % texts.length] || ''
      nextText.textContent = texts[(index + 1) % texts.length] || ''
      currentText.style.filter = 'none'
      currentText.style.opacity = '1'
      nextText.style.filter = 'blur(18px)'
      nextText.style.opacity = '0'
    }

    function morph(fraction: number) {
      const progress = Math.max(0, Math.min(1, fraction))
      const inverse = 1 - progress
      currentText.style.filter = `blur(${Math.min(18, (18 * progress) / Math.max(0.08, inverse))}px)`
      currentText.style.opacity = String(Math.pow(inverse, 0.45))
      nextText.style.filter = `blur(${Math.min(18, (18 * inverse) / Math.max(0.08, progress))}px)`
      nextText.style.opacity = String(Math.pow(progress, 0.45))
    }

    function canAnimate() {
      return texts.length > 1 && isIntersecting && !document.hidden && !motionQuery.matches
    }

    function tick(time: number) {
      animationFrame = undefined
      if (!canAnimate()) return

      const delta = Math.min(0.08, Math.max(0, (time - lastTime) / 1000))
      lastTime = time
      elapsed += delta

      if (phase === 'hold') {
        if (elapsed >= holdDuration) {
          phase = 'morph'
          elapsed = 0
        }
      } else {
        const progress = elapsed / Math.max(0.1, morphDuration)
        morph(progress)
        if (progress >= 1) {
          index = (index + 1) % texts.length
          phase = 'hold'
          elapsed = 0
          showCurrentText()
        }
      }

      animationFrame = window.requestAnimationFrame(tick)
    }

    function syncAnimation() {
      if (!canAnimate()) {
        if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
        animationFrame = undefined
        if (motionQuery.matches) showStaticText()
        return
      }

      lastTime = performance.now()
      if (animationFrame === undefined) animationFrame = window.requestAnimationFrame(tick)
    }

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

    showCurrentText()
    intersectionObserver?.observe(target)
    document.addEventListener('visibilitychange', syncAnimation)
    motionQuery.addEventListener('change', syncAnimation)
    syncAnimation()

    return () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
      intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', syncAnimation)
      motionQuery.removeEventListener('change', syncAnimation)
    }
  }, [holdDuration, morphDuration, texts])

  if (!texts.length) return null

  return (
    <div
      aria-label={texts.join(' ')}
      className={['morphing-text', className].filter(Boolean).join(' ')}
      ref={containerRef}
    >
      <span aria-hidden="true" className="morphing-text-layer" ref={firstTextRef}>
        {texts[0]}
      </span>
      <span aria-hidden="true" className="morphing-text-layer" ref={secondTextRef}>
        {texts[1] || texts[0]}
      </span>
    </div>
  )
}
