import Link from 'next/link'
import { getPublicSiteSettings } from '@/lib/siteSettings'

export async function NotFoundPage() {
  const { siteCopy } = await getPublicSiteSettings()
  return (
    <main className="not-found-page" id="main-content">
      <div className="site-shell not-found-inner">
        <div className="not-found-art" aria-hidden="true">
          <span className="not-found-static-code">404</span>
        </div>

        <div className="not-found-copy">
          <p className="eyebrow">{siteCopy.notFoundEyebrow}</p>
          <h1>
            {siteCopy.notFoundHeading}
            <br />
            <em>{siteCopy.notFoundEmphasis}</em>
          </h1>
          <p>{siteCopy.notFoundDescription}</p>
          <Link className="button-primary not-found-action" href="/">
            {siteCopy.notFoundButton} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
