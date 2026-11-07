'use client'

import { useFormFields } from '@payloadcms/ui'

type LexicalValue = { root?: { children?: unknown[] } } | null | undefined

/** Native admin notice: optional cookie categories stay disabled until an approved policy exists. */
export function CookiePolicyStatus() {
  const content = useFormFields(([fields]) => fields.cookiePolicyContent?.value) as LexicalValue
  const url = useFormFields(([fields]) => fields.cookiePolicyUrl?.value)
  const version = useFormFields(([fields]) => fields.cookiePolicyVersion?.value)
  const hasText = Boolean(content?.root?.children?.length)
  const ready = (hasText || Boolean(url)) && Boolean(version)
  return (
    <div
      role="status"
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderLeft: `4px solid ${ready ? 'var(--theme-success-500)' : 'var(--theme-warning-500)'}`,
        padding: '12px 16px',
        marginBottom: 24,
      }}
    >
      {ready
        ? 'Onaylı politika ve sürüm tanımlı: ziyaretçiler isteğe bağlı kategorileri seçebilir. Sürümü değiştirmek tercihi yeniden sordurur.'
        : 'Uyarı: Onaylı çerez politikası (metin veya HTTPS bağlantısı) ve politika sürümü eksik. İsteğe bağlı çerez kategorileri devre dışı; banner yalnızca zorunlu çerezleri bildiriyor. Hukuki metin otomatik üretilmez.'}
    </div>
  )
}
