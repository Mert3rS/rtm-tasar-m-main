'use client'

import { usePathname } from 'next/navigation'
import { HomeMotion } from '@/components/home/HomeMotion'
import { SiteHeader } from './SiteHeader'

/** Keep one persistent header outside route content and its loading/error boundaries. */
export function PublicDesign({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const configurator = pathname === '/tasarim-olustur'
  return (
    <>
      <div className="public-site site-header-shell">
        {!configurator ? (
          <a className="skip-link" href="#main-content">
            İçeriğe geç
          </a>
        ) : null}
        <SiteHeader />
      </div>
      {configurator ? (
        <div className="configurator-shell">{children}</div>
      ) : (
        <div className="public-site">
          <HomeMotion>{children}</HomeMotion>
        </div>
      )}
    </>
  )
}
