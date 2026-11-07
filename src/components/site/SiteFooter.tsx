import Link from 'next/link'
import Image from 'next/image'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { ContactDetails } from '@/components/contact/ContactDetails'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'

export async function SiteFooter() {
  const settings = await getPublicSiteSettings()
  return (
    <footer className="site-footer" id="iletisim">
      <div className="site-shell footer-grid">
        <div>
          <Link aria-label="RTM Tasarım ana sayfa" className="wordmark footer-wordmark" href="/">
            {settings.logo ? (
              <Image
                alt={settings.logo.alt}
                src={settings.logo.url}
                width={160}
                height={60}
                className="footer-custom-logo"
              />
            ) : (
              <>
                <span className="wordmark-main">
                  rtm<span className="wordmark-dot">.</span>
                </span>
                <span className="wordmark-caption">TASARIM</span>
              </>
            )}
          </Link>
          <p className="footer-tagline">
            {settings.companyDescription || (
              <>
                Düşünülmüş mekânlar.
                <br />
                Özenle işlenen detaylar.
              </>
            )}
          </p>
        </div>
        <nav aria-label="Alt menü">
          <p className="micro-label mb-5">Keşfedin</p>
          <Link href="/">Ana Sayfa</Link>
          <Link href="/projeler">Projeler</Link>
          <Link href="/modeller">Modeller</Link>
          <Link href="/hizmetler">Hizmetler</Link>
          <Link href="/showroom">Showroom</Link>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/iletisim">İletişim</Link>
          <Link href="/teklif-al">Teklif Al</Link>
        </nav>
        <div className="footer-contact">
          <p className="micro-label mb-5">İletişim</p>
          <p>
            Yeni bir mekânın
            <br />
            ilk adımı, bir konuşma.
          </p>
          <ContactDetails settings={settings} compact />
        </div>
      </div>
      <div className="site-shell footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.companyName}
        </span>
        <span>Mobilya · Mekân · Tasarım</span>
        <span className="footer-legal">
          <Link href="/cerez-politikasi">Çerez politikası</Link> · <CookiePreferencesButton /> ·{' '}
          <Link href="/sss">SSS</Link>
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
