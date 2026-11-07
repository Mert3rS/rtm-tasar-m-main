/** Loaded only after a file is selected. All output is JPEG and contains no copied metadata. */
export async function resizeInquiryImage(file: File) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Kaynak görsel en fazla 25 MB olabilir.')
  if (!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))
    throw new Error('JPEG, PNG, WebP veya HEIC görsel seçin.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    try {
      await image.decode()
    } catch {
      throw new Error(
        'Görsel açılamadı. HEIC desteklenmiyorsa JPEG veya WebP olarak dönüştürüp yeniden seçin.',
      )
    }
    const ratio = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Görsel hazırlanamadı.')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Görsel hazırlanamadı.'))),
        'image/jpeg',
        0.85,
      ),
    )
    if (blob.size > 5 * 1024 * 1024) throw new Error('Küçültülen dosya 5 MB sınırını aşıyor.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
