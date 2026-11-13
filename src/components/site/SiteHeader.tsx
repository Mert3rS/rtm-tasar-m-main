'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { BrandLogo } from '@/components/brand/BrandLogo'
import type { ProjectImage } from '@/types/portfolio'
import type { SiteCopy } from '@/lib/siteCopy'

export function SiteHeader({
  brand,
}: {
  brand: { companyName: string; logo?: ProjectImage; siteCopy: SiteCopy }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const [overHero, setOverHero] = useState(true)
  useEffect(() => {
    if (pathname !== '/') return
    const update = () => {
      const hero = document.querySelector('.cinematic-hero, .kitchen-story')
      if (!hero) return
      setOverHero(Boolean(hero && hero.getBoundingClientRect().bottom > innerHeight))
    }
    // The server-rendered homepage may arrive after the persistent header hydrates.
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.cinematic-hero, .kitchen-story')) return
      update()
      observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])
  const compact = pathname === '/tasarim-olustur'
  const mobileMenu = useRef<HTMLElement>(null)
  const links = [
    [brand.siteCopy.navHome, '/'],
    [brand.siteCopy.navProjects, '/projeler'],
    [brand.siteCopy.navModels, '/modeller'],
    [brand.siteCopy.navStudio, '/tasarim-olustur'],
    [brand.siteCopy.navServices, '/hizmetler'],
    [brand.siteCopy.navShowroom, '/showroom'],
  ]
  useEffect(() => {
    if (!isOpen) return
    const media = matchMedia('(max-width: 1199px)')
    // Safari touch taps do not focus buttons. Move focus into the opened menu so
    // keyboard navigation and Escape work consistently on every public page.
    if (media.matches) mobileMenu.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    if (!compact) return
    const content = document.querySelector<HTMLElement>('.configurator-shell')
    const wasInert = content?.inert ?? false
    const update = () => {
      if (content) content.inert = media.matches || wasInert
    }
    update()
    media.addEventListener('change', update)
    return () => {
      if (content) content.inert = wasInert
      media.removeEventListener('change', update)
    }
  }, [isOpen, compact])
  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      data-cinematic={pathname === '/' ? 'true' : undefined}
      data-over-hero={overHero ? 'true' : 'false'}
      className={`site-header${pathname === '/tasarim-olustur' ? ' site-header-compact' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Tab' && isOpen && compact && matchMedia('(max-width: 1199px)').matches) {
          const targets = [
            menuButton.current,
            ...Array.from(mobileMenu.current?.querySelectorAll<HTMLElement>('a,button') ?? []),
          ].filter((node): node is HTMLElement => node !== null)
          const first = targets[0],
            last = targets[targets.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          setIsOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="site-shell header-inner">
        <Link
          aria-label={`${brand.companyName} — ana sayfa`}
          className="wordmark"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          {brand.logo ? (
            <Image
              alt={brand.logo.alt}
              className="brand-logo brand-logo--header site-uploaded-logo"
              height={brand.logo.height}
              src={brand.logo.url}
              unoptimized
              width={brand.logo.width}
            />
          ) : (
            <BrandLogo className="brand-logo brand-logo--header" decorative />
          )}
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
            {brand.siteCopy.navContact} <span aria-hidden="true">↗</span>
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
        ref={mobileMenu}
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
        {compact ? (
          <div className="mobile-studio-actions">
            <Link className="header-project-link" href="/iletisim" onClick={() => setIsOpen(false)}>
              {brand.siteCopy.navContact} <span aria-hidden="true">↗</span>
            </Link>
            <ThemeToggle />
          </div>
        ) : null}
      </nav>
    </header>
  )
}
