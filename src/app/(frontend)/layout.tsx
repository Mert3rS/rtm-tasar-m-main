import React from 'react'
import localFont from 'next/font/local'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './styles.css'
import './design-quote.css'
import './readability.css'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { PublicDesign } from '@/components/site/PublicDesign'
import { ConsentProvider } from '@/components/consent/ConsentProvider'
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher'
import { getServerConsent } from '@/lib/consent/server'
import { getAssistantPublicSettings } from '@/lib/assistantSettings'
import { SiteToaster } from '@/components/site/SiteToaster'
import { brandIcons } from '@/lib/brandMetadata'

const workshop = localFont({
  src: [
    { path: './fonts/Jakarta-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Jakarta-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Jakarta-Semibold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Jakarta-Extrabold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-workshop',
  display: 'swap',
})
const mono = localFont({
  src: './fonts/PlexMono-Regular.ttf',
  variable: '--font-workshop-mono',
  display: 'swap',
})

const sans = localFont({
  src: [
    { path: './fonts/Manrope-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Manrope-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-studio-sans',
  display: 'swap',
})
const serif = localFont({
  src: [
    { path: './fonts/CormorantGaramond-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/CormorantGaramond-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-studio-serif',
  display: 'swap',
})

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return {
    icons: brandIcons,
    description:
      settings.defaultSeoDescription ||
      'RTM Tasarım — farklı şehirlerde iç mimarlık, mobilya ve uygulama projeleri.',
    title: settings.defaultSeoTitle || settings.companyName,
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const [settings, consent, assistant] = await Promise.all([
    getPublicSiteSettings(),
    getServerConsent(),
    getAssistantPublicSettings(),
  ])
  const policy = {
    ready: consent.policy.ready,
    version: consent.policy.version,
    privacyHref:
      settings.privacyNoticeUrl ||
      (settings.privacyNoticeContent ? '/kvkk-aydinlatma-metni' : undefined),
    privacyExternal: Boolean(settings.privacyNoticeUrl),
    bannerTitle: consent.policy.bannerTitle,
    bannerDescription: consent.policy.bannerDescription,
  }
  return (
    <html
      className={`${sans.variable} ${serif.variable} ${workshop.variable} ${mono.variable}`}
      data-consent-policy-version={policy.version}
      data-scroll-behavior="smooth"
      data-theme="light"
      lang="tr"
      suppressHydrationWarning
    >
      <body>
        <Script id="homepage-reload-start" strategy="beforeInteractive">
          {`(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (location.pathname !== '/' || navigation?.type !== 'reload') return;
            const restoration = history.scrollRestoration;
            history.scrollRestoration = 'manual';
            const start = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            start();
            window.addEventListener('pageshow', () => {
              start();
              requestAnimationFrame(() => {
                start();
                history.scrollRestoration = restoration;
              });
            }, { once: true });
          })();`}
        </Script>
        <ConsentProvider
          policy={policy}
          initialDecided={consent.decided}
          initialChoices={consent.choices}
        >
          <ThemeProvider>
            <PublicDesign
              brand={{
                companyName: settings.companyName,
                logo: settings.logo,
                siteCopy: settings.siteCopy,
              }}
            >
              {children}
            </PublicDesign>
            {assistant ? <AssistantLauncher settings={assistant} /> : null}
            <SiteToaster />
          </ThemeProvider>
        </ConsentProvider>
      </body>
    </html>
  )
}
