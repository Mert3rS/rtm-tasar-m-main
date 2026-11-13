export function uploadLimitBytes() {
  const configured = Number(process.env.MEDIA_MAX_UPLOAD_MB || 32)
  const megabytes =
    Number.isFinite(configured) && configured >= 1 && configured <= 256 ? configured : 32
  const configuredBytes = Math.floor(megabytes * 1024 * 1024)
  // Leave multipart overhead below Vercel's 4.5 MB server request limit.
  return process.env.VERCEL === '1' ? Math.min(configuredBytes, 4 * 1024 * 1024) : configuredBytes
}

export function validPanorama({
  width,
  height,
  mimeType,
}: {
  width?: number | null
  height?: number | null
  mimeType?: string | null
}) {
  return Boolean(
    width &&
    height &&
    width >= 1024 &&
    width <= 8192 &&
    width === height * 2 &&
    ['image/jpeg', 'image/webp'].includes(mimeType || ''),
  )
}

// Exact public Blob store owned by this deployment. Add other origins only with a matching Media adapter.
const managedMediaOrigins = new Set(['https://1qldjncltmptxwup.public.blob.vercel-storage.com'])

function safeMediaPath(pathname: string) {
  const segments = pathname.split('/').slice(1)
  if (!segments.length || segments.some((segment) => !segment)) return false

  try {
    return segments.every((segment) => {
      const decoded = decodeURIComponent(segment)
      return !/[\\/\u0000-\u001f]/.test(decoded) && decoded !== '.' && decoded !== '..'
    })
  } catch {
    return false
  }
}

// Accept Payload's local file route and the allowlisted Blob origin only.
export function managedMediaUrl(value: string | null | undefined) {
  if (!value || /[\u0000- ]/.test(value)) return undefined

  if (value.startsWith('/api/media/file/')) {
    if (!/^\/api\/media\/file\/[^/?#\\]+$/.test(value)) return undefined
    try {
      const filename = decodeURIComponent(value.slice('/api/media/file/'.length))
      if (/[\\/\u0000-\u001f]/.test(filename) || filename === '.' || filename === '..')
        return undefined
      return value
    } catch {
      return undefined
    }
  }

  try {
    const url = new URL(value)
    if (
      !managedMediaOrigins.has(url.origin) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !safeMediaPath(url.pathname)
    )
      return undefined
    return url.href
  } catch {
    return undefined
  }
}
