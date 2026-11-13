'use client'

import { usePathname } from 'next/navigation'
import { HomeMotion } from '@/components/home/HomeMotion'
import { SiteHeader } from './SiteHeader'
import type { ProjectImage } from '@/types/portfolio'
import type { SiteCopy } from '@/lib/siteCopy'

/** Keep one persistent header outside route content and its loading/error boundaries. */
export function PublicDesign({
  brand,
  children,
}: {
  brand: { companyName: string; logo?: ProjectImage; siteCopy: SiteCopy }
  children: React.ReactNode
}) {
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
        <SiteHeader brand={brand} />
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
