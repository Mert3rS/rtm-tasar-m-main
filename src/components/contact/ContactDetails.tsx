import type { PublicSiteSettings } from '@/lib/siteSettings'
import { phoneHref } from '@/lib/contactValidation'
import { WhatsAppLink } from './WhatsAppLink'

export function ContactDetails({
  settings,
  compact = false,
}: {
  settings: PublicSiteSettings
  compact?: boolean
}) {
  const location = [settings.address, settings.city, settings.country].filter(Boolean).join(', ')
  const available =
    settings.phone ||
    settings.contactEmail ||
    location ||
    settings.whatsappHref ||
    settings.socials.length ||
    settings.mapsHref
  return (
    <div className={`contact-details${compact ? ' contact-details-compact' : ''}`}>
      {settings.phone ? (
        <div>
          <span className="micro-label muted">Telefon</span>
          <a href={phoneHref(settings.phone)}>{settings.phone}</a>
        </div>
      ) : null}
      {settings.contactEmail ? (
        <div>
          <span className="micro-label muted">E-posta</span>
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </div>
      ) : null}
      {location ? (
        <div>
          <span className="micro-label muted">Adres</span>
          <address>{location}</address>
        </div>
      ) : null}
      {settings.mapsHref ? (
        <a className="text-link" href={settings.mapsHref} target="_blank" rel="noopener noreferrer">
          Haritada görüntüle ↗
        </a>
      ) : null}
      <WhatsAppLink href={settings.whatsappHref} />
      {settings.socials.length ? (
        <nav
          aria-label={compact ? 'Alt bölüm sosyal medya' : 'Sosyal medya'}
          className="contact-socials"
        >
          {settings.socials.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
              {social.label} ↗
            </a>
          ))}
        </nav>
      ) : null}
      {!available ? (
        <p className="muted">İletişim bilgilerimiz yakında burada yer alacak.</p>
      ) : null}
    </div>
  )
}
