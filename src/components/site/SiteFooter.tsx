import { EditableRegion } from '@/components/site/EditableRegion'
import Link from 'next/link'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { ContactDetails } from '@/components/contact/ContactDetails'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'
import { BrandLogo } from '@/components/brand/BrandLogo'
import Image from 'next/image'

export async function SiteFooter() {
  const settings = await getPublicSiteSettings()
  return (
    <footer className="site-footer" id="iletisim">
      <div className="site-shell footer-grid">
        <div data-reveal data-reveal-effect="blur">
          <Link aria-label={`${settings.companyName} ana sayfa`} className="wordmark footer-wordmark" href="/">
            {settings.logo ? (
              <Image
                alt={settings.logo.alt}
                className="brand-logo brand-logo--footer site-uploaded-logo"
                height={settings.logo.height}
                src={settings.logo.url}
                unoptimized
                width={settings.logo.width}
              />
            ) : (
              <BrandLogo className="brand-logo brand-logo--footer" decorative />
            )}
          </Link>
          <EditableRegion as="p" className="footer-tagline" data-rtm-edit="site-settings" data-rtm-field="companyDescription" data-rtm-label="Footer şirket açıklaması">
            {settings.companyDescription || (
              <>
                Düşünülmüş mekânlar.
                <br />
                Özenle işlenen detaylar.
              </>
            )}
          </EditableRegion>
        </div>
        <nav aria-label="Alt menü" data-reveal data-reveal-delay="100" data-reveal-effect="blur">
          <p className="micro-label mb-5">{settings.siteCopy.footerExploreLabel}</p>
          <Link href="/">{settings.siteCopy.navHome}</Link>
          <Link href="/projeler">{settings.siteCopy.navProjects}</Link>
          <Link href="/modeller">{settings.siteCopy.navModels}</Link>
          <Link href="/hizmetler">{settings.siteCopy.navServices}</Link>
          <Link href="/showroom">{settings.siteCopy.navShowroom}</Link>
          <Link href="/iletisim">{settings.siteCopy.navContact}</Link>
        </nav>
        <EditableRegion as="div"
          className="footer-contact"
          data-rtm-edit="site-settings" data-rtm-label="Footer iletişim ve sosyal medya"
          data-reveal
          data-reveal-delay="180"
          data-reveal-effect="blur"
        >
          <p className="micro-label mb-5">{settings.siteCopy.footerContactLabel}</p>
          <p className="whitespace-pre-line">{settings.siteCopy.footerContactHeading}</p>
          <ContactDetails settings={settings} compact showIcons />
        </EditableRegion>
      </div>
      <div
        className="site-shell footer-bottom"
        data-reveal
        data-reveal-delay="240"
        data-reveal-effect="blur"
      >
        <span>
          © {new Date().getFullYear()} {settings.companyName}
        </span>
        <span>{settings.siteCopy.footerSignature}</span>
        <span className="footer-legal">
          <Link href="/kvkk-aydinlatma-metni">KVKK aydınlatma metni</Link> ·{' '}
          <Link href="/cerez-politikasi">Çerez politikası</Link> · <CookiePreferencesButton />
        </span>
        <a
          href="https://www.naturalearthdata.com/about/terms-of-use/"
          rel="noreferrer"
          target="_blank"
        >
          Harita verisi: Natural Earth ↗
        </a>
      </div>
    </footer>
  )
}
