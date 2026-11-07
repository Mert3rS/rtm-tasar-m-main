import React from 'react'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './styles.css'
import './design-quote.css'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { PublicDesign } from '@/components/site/PublicDesign'
import { ConsentProvider } from '@/components/consent/ConsentProvider'
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher'
import { getServerConsent } from '@/lib/consent/server'
import { getAssistantPublicSettings } from '@/lib/assistantSettings'
import { SiteToaster } from '@/components/site/SiteToaster'

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
      (settings.privacyNoticeContent ? '/iletisim#aydinlatma-metni' : undefined),
    privacyExternal: Boolean(settings.privacyNoticeUrl),
    bannerTitle: consent.policy.bannerTitle,
    bannerDescription: consent.policy.bannerDescription,
  }
  // Static except for the validated policy version; a future strict CSP needs its hash/nonce.
  const themeScript = `(function(){var d=document.documentElement;d.dataset.rtmJs='true';try{var V=${JSON.stringify(policy.version)};var m=document.cookie.match(/(?:^|; )rtm-consent=([^;]*)/);var c=m&&JSON.parse(decodeURIComponent(m[1]));if(V!=='unconfigured'&&c&&c.v===V&&c.c&&c.c.f===1){d.dataset.theme=localStorage.getItem('rtm-theme')==='dark'?'dark':'light'}}catch(e){}})()`

  return (
    <html
      className={`${sans.variable} ${serif.variable} ${workshop.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
      data-theme="light"
      lang="tr"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body>
        <ConsentProvider
          policy={policy}
          initialDecided={consent.decided}
          initialChoices={consent.choices}
        >
          <ThemeProvider>
            <PublicDesign>{children}</PublicDesign>
            {assistant ? <AssistantLauncher settings={assistant} /> : null}
            <SiteToaster />
          </ThemeProvider>
        </ConsentProvider>
      </body>
    </html>
  )
}
