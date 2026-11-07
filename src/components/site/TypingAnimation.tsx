'use client'

import { useEffect, useRef, useState } from 'react'

type TypingAnimationProps = {
  children: string
  className?: string
  delay?: number
  showCursor?: boolean
  startOnView?: boolean
  typeSpeed?: number
}

// Dependency-free adaptation of Magic UI's Typing Animation interaction model.
export function TypingAnimation({
  children,
  className,
  delay = 0,
  showCursor = true,
  startOnView = true,
  typeSpeed = 100,
}: TypingAnimationProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const [displayedText, setDisplayedText] = useState('')
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => {
      setReduceMotion(motionQuery.matches)
      if (motionQuery.matches) setHasStarted(true)
    }

    syncMotionPreference()
    motionQuery.addEventListener('change', syncMotionPreference)

    if (!startOnView || motionQuery.matches || !('IntersectionObserver' in window)) {
      const startTimer = setTimeout(() => setHasStarted(true), 0)
      return () => {
        clearTimeout(startTimer)
        motionQuery.removeEventListener('change', syncMotionPreference)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setHasStarted(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
    )

    observer.observe(root)
    return () => {
      observer.disconnect()
      motionQuery.removeEventListener('change', syncMotionPreference)
    }
  }, [startOnView])

  useEffect(() => {
    if (!hasStarted) return
    if (reduceMotion) {
      const revealTimer = setTimeout(() => setDisplayedText(children), 0)
      return () => clearTimeout(revealTimer)
    }

    const characters = Array.from(children)
    let index = 0
    let typingTimer: ReturnType<typeof setTimeout> | undefined
    const startTimer = setTimeout(() => {
      const typeNextCharacter = () => {
        index += 1
        setDisplayedText(characters.slice(0, index).join(''))
        if (index < characters.length) typingTimer = setTimeout(typeNextCharacter, typeSpeed)
      }
      typeNextCharacter()
    }, delay)

    return () => {
      clearTimeout(startTimer)
      if (typingTimer) clearTimeout(typingTimer)
    }
  }, [children, delay, hasStarted, reduceMotion, typeSpeed])

  const isComplete = displayedText === children
  const cursorVisible = showCursor && hasStarted && !reduceMotion && !isComplete

  return (
    <span
      className={['typing-animation', className].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      <span className="text-animate-sr-only">{children}</span>
      <span aria-hidden="true">
        {displayedText}
        {cursorVisible ? <span className="typing-animation-cursor">|</span> : null}
      </span>
    </span>
  )
}
