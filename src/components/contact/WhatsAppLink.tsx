import { ArrowUpRight } from 'lucide-react'

export function WhatsAppLink({ href }: { href?: string }) {
  if (!href) return null
  return (
    <a
      aria-label="WhatsApp üzerinden görüşelim"
      className="contact-channel contact-channel--whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span aria-hidden="true" className="contact-channel-icon contact-channel-icon--whatsapp">
        <svg viewBox="0 0 32 32">
          <path
            d="M16 4a11 11 0 0 0-9.56 16.46L5 27l6.7-1.39A11 11 0 1 0 16 4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M12.06 10.54c.22-.5.45-.51.66-.52h.57c.18 0 .47.07.72.61.25.55.85 1.92.92 2.06.08.14.13.3.03.48-.1.18-.15.29-.29.44-.14.16-.3.35-.42.47-.14.14-.28.29-.12.57.16.28.7 1.16 1.51 1.88 1.04.93 1.92 1.22 2.19 1.36.28.14.44.12.6-.07.17-.2.71-.83.9-1.11.19-.28.38-.23.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.69-.16 1.35-.23.67-1.37 1.28-1.88 1.36-.48.07-1.1.1-1.78-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.55-1.16-2.96 0-1.4.74-2.1 1-2.39Z" />
        </svg>
      </span>
      <span className="contact-channel-copy">
        <strong>WhatsApp ile görüşelim</strong>
        <span>Bir mesajla iletişime geçin</span>
      </span>
      <span aria-hidden="true" className="contact-channel-arrow">
        <ArrowUpRight />
      </span>
    </a>
  )
}
