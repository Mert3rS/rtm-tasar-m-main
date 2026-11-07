'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme/ThemeToggle'

const links = [
  ['Ana Sayfa', '/'],
  ['Projeler', '/projeler'],
  ['Modeller', '/modeller'],
  ['Tasarım Oluştur', '/tasarim-olustur'],
  ['Hizmetler', '/hizmetler'],
  ['Showroom', '/showroom'],
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className={`site-header${pathname === '/tasarim-olustur' ? ' site-header-compact' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="site-shell header-inner">
        <Link
          aria-label="rtm. TASARIM ATÖLYESİ — ana sayfa"
          className="wordmark"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          <span className="wordmark-main">
            rtm<span className="wordmark-dot">.</span>
          </span>
          <span className="wordmark-caption">
            TASARIM
            <br />
            ATÖLYESİ
          </span>
        </Link>
        <nav aria-label="Ana menü" className="desktop-nav">
          {links.map(([label, href]) => (
            <Link aria-current={isCurrent(href) ? 'page' : undefined} href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            aria-current={isCurrent('/iletisim') ? 'page' : undefined}
            className="header-project-link"
            href="/iletisim"
          >
            İletişim <span aria-hidden="true">↗</span>
          </Link>
          <ThemeToggle />
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            className="icon-button menu-button"
            onClick={() => setIsOpen(!isOpen)}
            ref={menuButton}
            type="button"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              {isOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav
        aria-label="Mobil menü"
        className="mobile-nav site-shell"
        hidden={!isOpen}
        id="mobile-navigation"
      >
        {links.map(([label, href], index) => (
          <Link
            aria-current={isCurrent(href) ? 'page' : undefined}
            href={href}
            key={href}
            onClick={() => setIsOpen(false)}
          >
            <span className="micro-label">0{index + 1}</span>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
