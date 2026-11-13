export function uploadLimitBytes() {
  const configured = Number(process.env.MEDIA_MAX_UPLOAD_MB || 32)
  const megabytes =
    Number.isFinite(configured) && configured >= 1 && configured <= 256 ? configured : 32
  return Math.floor(megabytes * 1024 * 1024)
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

// Only Media-generated local routes are accepted. Future object storage must be explicitly allowlisted here.
export function managedMediaUrl(value: string | null | undefined) {
  if (!value || !/^\/api\/media\/file\/[^/?#\\]+$/.test(value) || /[\u0000-\u0020]/.test(value))
    return undefined
  try {
    const filename = decodeURIComponent(value.slice('/api/media/file/'.length))
    if (/[\\/\u0000-\u001f]/.test(filename) || filename === '.' || filename === '..')
      return undefined
    return value
  } catch {
    return undefined
  }
}
