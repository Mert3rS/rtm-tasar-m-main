import { afterEach, describe, expect, it, vi } from 'vitest'
import { managedMediaUrl, uploadLimitBytes, validPanorama } from '@/lib/panoramaValidation'

afterEach(() => vi.unstubAllEnvs())
describe('Panorama boundaries', () => {
  it('accepts full 2:1 JPEG/WebP and rejects ordinary photos, bad dimensions and formats', () => {
    expect(validPanorama({ width: 4096, height: 2048, mimeType: 'image/jpeg' })).toBe(true)
    expect(validPanorama({ width: 8192, height: 4096, mimeType: 'image/webp' })).toBe(true)
    for (const image of [
      { width: 1600, height: 1200, mimeType: 'image/jpeg' },
      { width: 10000, height: 5000, mimeType: 'image/jpeg' },
      { width: 4096, height: 2048, mimeType: 'image/png' },
      { width: 512, height: 256, mimeType: 'image/webp' },
    ])
      expect(validPanorama(image)).toBe(false)
  })
  it('bounds configurable upload limits', () => {
    vi.stubEnv('MEDIA_MAX_UPLOAD_MB', '16')
    expect(uploadLimitBytes()).toBe(16 * 1024 * 1024)
    for (const value of ['-1', 'Infinity', 'garbage', '99999']) {
      vi.stubEnv('MEDIA_MAX_UPLOAD_MB', value)
      expect(uploadLimitBytes()).toBe(32 * 1024 * 1024)
    }
  })
  it('keeps Vercel server uploads below the request limit without raising a lower configured limit', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('MEDIA_MAX_UPLOAD_MB', '32')
    expect(uploadLimitBytes()).toBe(4 * 1024 * 1024)
    vi.stubEnv('MEDIA_MAX_UPLOAD_MB', '2')
    expect(uploadLimitBytes()).toBe(2 * 1024 * 1024)
  })
  it.each([
    'https://evil.example/pano.jpg',
    '//evil.example/pano.jpg',
    'data:image/jpeg;base64,abc',
    '/api/media/file/%2e%2e%2fpano.jpg',
    '/api/media/file/pano.jpg?remote=1',
    '/api/media/file/../other.jpg',
    '/api/media/file/%00.jpg',
    'https://other.public.blob.vercel-storage.com/pano.jpg',
    'https://1qldjncltmptxwup.public.blob.vercel-storage.com.evil.example/pano.jpg',
    'https://user@1qldjncltmptxwup.public.blob.vercel-storage.com/pano.jpg',
    'https://1qldjncltmptxwup.public.blob.vercel-storage.com/pano.jpg?remote=1',
    'https://1qldjncltmptxwup.public.blob.vercel-storage.com/pano.jpg#fragment',
    'https://1qldjncltmptxwup.public.blob.vercel-storage.com/%2fother.jpg',
    'http://1qldjncltmptxwup.public.blob.vercel-storage.com/pano.jpg',
  ])('does not allow arbitrary panorama asset URLs: %s', (value) => {
    expect(managedMediaUrl(value)).toBeUndefined()
  })
  it('allows only the native media file route', () =>
    expect(managedMediaUrl('/api/media/file/approved-pano.jpg')).toBe(
      '/api/media/file/approved-pano.jpg',
    ))
  it('also allows the existing owned Blob store, including nested encoded filenames', () => {
    for (const path of ['sunum-lebombo.jpg', 'panoramas/room%20one.webp']) {
      const url = `https://1qldjncltmptxwup.public.blob.vercel-storage.com/${path}`
      expect(managedMediaUrl(url)).toBe(url)
    }
  })
})
