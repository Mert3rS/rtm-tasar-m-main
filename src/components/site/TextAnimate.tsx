'use client'

import { useEffect, useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'

type AnimationType = 'character' | 'line' | 'text' | 'word'
type AnimationVariant =
  | 'blurIn'
  | 'blurInDown'
  | 'blurInUp'
  | 'fadeIn'
  | 'scaleDown'
  | 'scaleUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
type TextElement =
  | 'article'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'li'
  | 'p'
  | 'section'
  | 'span'

type TextAnimateProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  accessible?: boolean
  animation?: AnimationVariant
  as?: TextElement
  by?: AnimationType
  children: ReactNode
  delay?: number
  duration?: number
  once?: boolean
  segmentClassName?: string
  stagger?: number
  startOnView?: boolean
}

type SegmentStyle = CSSProperties & {
  '--text-delay': string
  '--text-duration': string
  '--text-index': number
  '--text-stagger': string
}

const defaultStagger: Record<AnimationType, number> = {
  character: 0.025,
  line: 0.08,
  text: 0,
  word: 0.055,
}

function splitContent(children: ReactNode, by: AnimationType) {
  if (typeof children !== 'string') return [children]

  switch (by) {
    case 'character':
      return children.split('')
    case 'line':
      return children.split('\n')
    case 'text':
      return [children]
    case 'word':
    default:
      return children.split(/(\s+)/)
  }
}

// Dependency-free adaptation of Magic UI's Text Animate interaction model.
export function TextAnimate({
  accessible = true,
  animation = 'fadeIn',
  as: Component = 'p',
  by = 'word',
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
  segmentClassName,
  stagger = defaultStagger[by],
  startOnView = true,
  ...elementProps
}: TextAnimateProps) {
  const reactId = useId()
  const instanceId = `text-${reactId.replaceAll(':', '')}`
  const isAccessibleString = accessible && typeof children === 'string'
  const segments = splitContent(children, by)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-text-animate-id="${instanceId}"]`)
    if (!root) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reveal = () => {
      root.dataset.textVisible = 'true'
    }
    const conceal = () => {
      root.dataset.textVisible = 'false'
    }
    const revealForReducedMotion = () => {
      if (motionQuery.matches) reveal()
    }

    root.dataset.textReady = 'true'
    if (!startOnView || motionQuery.matches || !('IntersectionObserver' in window)) {
      reveal()
      motionQuery.addEventListener('change', revealForReducedMotion)
      return () => motionQuery.removeEventListener('change', revealForReducedMotion)
    }

    const bounds = root.getBoundingClientRect()
    if (bounds.top < window.innerHeight * 0.94 && bounds.bottom > 0) reveal()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          reveal()
          if (once) observer.unobserve(root)
        } else if (!once) {
          conceal()
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    )

    observer.observe(root)
    motionQuery.addEventListener('change', revealForReducedMotion)
    return () => {
      observer.disconnect()
      motionQuery.removeEventListener('change', revealForReducedMotion)
    }
  }, [instanceId, once, startOnView])

  return (
    <Component
      {...elementProps}
      className={['text-animate', className].filter(Boolean).join(' ')}
      data-text-animate-id={instanceId}
      data-text-animation={animation}
      data-text-by={by}
      data-text-ready="false"
      data-text-visible={startOnView ? 'false' : 'true'}
    >
      {isAccessibleString ? <span className="text-animate-sr-only">{children}</span> : null}
      {segments.map((segment, index) => {
        const isWhitespace = typeof segment === 'string' && /^\s+$/.test(segment)
        const currentIndex = segments
          .slice(0, index)
          .filter((item) => !(typeof item === 'string' && /^\s+$/.test(item))).length
        const segmentStyle: SegmentStyle = {
          '--text-delay': `${delay}s`,
          '--text-duration': `${duration}s`,
          '--text-index': currentIndex,
          '--text-stagger': `${stagger}s`,
        }

        return (
          <span
            aria-hidden={isAccessibleString ? true : undefined}
            className={[
              'text-animate-segment',
              by === 'line' ? 'text-animate-segment--line' : '',
              isWhitespace ? 'text-animate-segment--space' : '',
              segmentClassName,
            ]
              .filter(Boolean)
              .join(' ')}
            key={`${by}-${index}`}
            style={segmentStyle}
          >
            {segment}
          </span>
        )
      })}
    </Component>
  )
}
