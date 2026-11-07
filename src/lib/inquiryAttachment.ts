import 'server-only'
import sharp from 'sharp'

export const attachmentLimit = 5 * 1024 * 1024
export async function sanitizeAttachment(bytes: Buffer) {
  if (!bytes.length || bytes.length > attachmentLimit) throw new Error('Invalid size')
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!jpeg && !png && !webp) throw new Error('Invalid image signature')
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning' })
  const metadata = await image.metadata()
  if (
    !metadata.format ||
    !['jpeg', 'png', 'webp'].includes(metadata.format) ||
    (metadata.pages || 1) !== 1
  )
    throw new Error('Invalid image')
  // Re-encoding strips EXIF/GPS/XMP; never use keepMetadata or withMetadata here.
  return image
    .rotate()
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
}
