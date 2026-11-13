import { EditableRegion } from '@/components/site/EditableRegion'
import type { PublicSiteSettings } from '@/lib/siteSettings'
import { phoneHref } from '@/lib/contactValidation'
import { Mail, MapPin, Phone } from 'lucide-react'
import { ContactChannels } from './ContactChannels'

export function ContactDetails({
  settings,
  compact = false,
  showIcons = false,
}: {
  settings: PublicSiteSettings
  compact?: boolean
  showIcons?: boolean
}) {
  const location = [settings.address, settings.city, settings.country].filter(Boolean).join(', ')
  const mapHref =
    settings.mapsHref ||
    (location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : undefined)
  const available =
    settings.phone ||
    settings.contactEmail ||
    location ||
    settings.whatsappHref ||
    settings.socials.length ||
    settings.mapsHref
  return (
    <EditableRegion as="div"
      className={`contact-details${compact ? ' contact-details-compact' : ''}`}
      data-rtm-edit="site-settings"
      data-rtm-field="contactEmail"
      data-rtm-label="İletişim bilgileri ve sosyal medya"
    >
      {settings.phone ? (
        <div className={showIcons ? 'contact-detail-with-icon' : undefined}>
          {showIcons ? (
            <a
              aria-label={`Telefonla ara: ${settings.phone}`}
              className="contact-detail-action"
              href={phoneHref(settings.phone)}
            >
              <span aria-hidden="true" className="contact-detail-icon">
                <Phone />
              </span>
              <span className="micro-label muted">Telefon</span>
              <span className="contact-detail-value">{settings.phone}</span>
            </a>
          ) : (
            <>
              <span className="micro-label muted">Telefon</span>
              <a href={phoneHref(settings.phone)}>{settings.phone}</a>
            </>
          )}
        </div>
      ) : null}
      {settings.contactEmail ? (
        <div className={showIcons ? 'contact-detail-with-icon' : undefined}>
          {showIcons ? (
            <a
              aria-label={`E-posta gönder: ${settings.contactEmail}`}
              className="contact-detail-action"
              href={`mailto:${settings.contactEmail}`}
            >
              <span aria-hidden="true" className="contact-detail-icon">
                <Mail />
              </span>
              <span className="micro-label muted">E-posta</span>
              <span className="contact-detail-value">{settings.contactEmail}</span>
            </a>
          ) : (
            <>
              <span className="micro-label muted">E-posta</span>
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            </>
          )}
        </div>
      ) : null}
      {location ? (
        <div className={showIcons ? 'contact-detail-with-icon' : undefined}>
          {showIcons && mapHref ? (
            <a
              aria-label={`Haritada görüntüle: ${location}`}
              className="contact-detail-action"
              href={mapHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true" className="contact-detail-icon">
                <MapPin />
              </span>
              <span className="micro-label muted">Adres</span>
              <address>{location}</address>
            </a>
          ) : (
            <>
              <span className="micro-label muted">Adres</span>
              <address>{location}</address>
            </>
          )}
        </div>
      ) : null}
      {!showIcons && settings.mapsHref ? (
        <a className="text-link" href={settings.mapsHref} target="_blank" rel="noopener noreferrer">
          Haritada görüntüle ↗
        </a>
      ) : null}
      <ContactChannels settings={settings} compact={compact} />
      {!available ? (
        <p className="muted">İletişim bilgilerimiz yakında burada yer alacak.</p>
      ) : null}
    </EditableRegion>
  )
}
