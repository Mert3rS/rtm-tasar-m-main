import Link from 'next/link'
import type { ReactNode } from 'react'
import { TextAnimate } from './TextAnimate'

export function PageIntro({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string
  eyebrow: string
  title: ReactNode
  description?: string | null
}) {
  return (
    <header className="site-shell workshop-page-intro">
      <div className="page-intro-top">
        <TextAnimate
          animation="fadeIn"
          as="p"
          by="character"
          className="eyebrow"
          duration={0.32}
          stagger={0.016}
        >
          {eyebrow}
        </TextAnimate>
        <span className="micro-label" data-archive-reveal>{number} / RTM</span>
      </div>
      <div className="page-intro-main">
        <TextAnimate
          animation="blurInUp"
          as="h1"
          by={typeof title === 'string' ? 'word' : 'text'}
          duration={0.64}
        >
          {title}
        </TextAnimate>
        {description ? (
          <TextAnimate
            animation="fadeIn"
            as="p"
            by="text"
            className="section-intro"
            delay={0.16}
            duration={0.72}
          >
            {description}
          </TextAnimate>
        ) : null}
      </div>
      <div className="page-intro-bottom" data-archive-reveal>
        <Link href="/">RTM TASARIM ↗</Link>
        <span>MOBİLYA / MEKÂN / TASARIM</span>
      </div>
    </header>
  )
}
