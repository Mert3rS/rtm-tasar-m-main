export function WhatsAppLink({
  href,
  className = 'text-link',
}: {
  href?: string
  className?: string
}) {
  if (!href) return null
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      WhatsApp ile görüşelim <span aria-hidden="true">↗</span>
    </a>
  )
}
