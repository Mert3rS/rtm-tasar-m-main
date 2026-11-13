import { ArrowUpRight, Globe } from 'lucide-react'
import type { PublicSiteSettings } from '@/lib/siteSettings'
import { WhatsAppLink } from './WhatsAppLink'

function SocialIcon({ label }: { label: string }) {
  if (label !== 'Instagram') return <Globe />
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ContactChannels({
  settings,
  compact,
}: {
  settings: Pick<PublicSiteSettings, 'socials' | 'whatsappHref'>
  compact: boolean
}) {
  if (!settings.whatsappHref && !settings.socials.length) return null

  return (
    <nav
      className="contact-channels"
      aria-label={compact ? 'Alt bölüm sosyal medya' : 'Sosyal medya'}
    >
      <WhatsAppLink href={settings.whatsappHref} />
      {settings.socials.map((social) => (
        <a
          className="contact-channel"
          aria-label={social.label}
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span
            className={`contact-channel-icon${
              social.label === 'Instagram' ? ' contact-channel-icon--instagram' : ''
            }`}
            aria-hidden="true"
          >
            <SocialIcon label={social.label} />
          </span>
          <span className="contact-channel-copy">
            <strong>{social.label}</strong>
            <span>Profilimizi keşfedin</span>
          </span>
          <span className="contact-channel-arrow" aria-hidden="true">
            <ArrowUpRight />
          </span>
        </a>
      ))}
    </nav>
  )
}
