import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

/** Shared safe Lexical → JSX converters (no raw HTML, restricted link protocols, no embeds). */
export function safeHref(value: unknown) {
  if (typeof value !== 'string' || /[\u0000- ]/.test(value)) return undefined
  if (/^\/(?!\/)/.test(value) && !value.includes('\\')) return value
  if (value.startsWith('#')) return value
  try {
    const url = new URL(value)
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

function ContentLink({
  url,
  newTab,
  children,
}: {
  url: unknown
  newTab: boolean
  children: ReactNode
}) {
  const href = safeHref(url)
  return href ? (
    <a
      href={href}
      rel={newTab ? 'noopener noreferrer' : undefined}
      target={newTab ? '_blank' : undefined}
    >
      {children}
    </a>
  ) : (
    <>{children}</>
  )
}

export const safeConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  link: ({ node, nodesToJSX }) => (
    <ContentLink
      url={node.fields.linkType === 'internal' ? undefined : node.fields.url}
      newTab={Boolean(node.fields.newTab)}
    >
      {nodesToJSX({ nodes: node.children })}
    </ContentLink>
  ),
  autolink: ({ node, nodesToJSX }) => (
    <ContentLink url={node.fields.url} newTab={Boolean(node.fields.newTab)}>
      {nodesToJSX({ nodes: node.children })}
    </ContentLink>
  ),
  // Photography belongs to the optimized gallery, not embedded raw uploads.
  upload: () => null,
})
