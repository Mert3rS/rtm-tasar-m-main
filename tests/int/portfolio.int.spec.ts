import { afterEach, describe, expect, it, vi } from 'vitest'
import { parsePortfolioQuery, portfolioHref } from '@/lib/portfolioQuery'
vi.mock('server-only', () => ({}))
import { portfolioMetadata, productionSiteUrl } from '@/lib/seo'

afterEach(() => vi.unstubAllEnvs())

describe('Portfolio URL and metadata boundaries', () => {
  it('preserves combined filters while resetting pagination and encoding CMS slugs', () => {
    const filters = parsePortfolioQuery({
      kategori: 'ic-mimari',
      ulke: 'almanya',
      sehir: 'berlin',
      sayfa: '2',
    })
    expect(portfolioHref(filters)).toBe(
      '/projeler?kategori=ic-mimari&ulke=almanya&sehir=berlin&sayfa=2',
    )
    expect(portfolioHref(filters, 1)).toBe('/projeler?kategori=ic-mimari&ulke=almanya&sehir=berlin')
    expect(parsePortfolioQuery({ sayfa: '-3' }).page).toBe(1)
    expect(parsePortfolioQuery({ sayfa: 'Infinity' }).page).toBe(1)
  })

  it.each([
    'http://localhost:3000',
    'https://localhost',
    'https://localhost.',
    'https://127.0.0.1',
    'https://[::1]',
    'https://[::ffff:192.168.1.10]',
    'javascript:alert(1)',
    'https://secret:token@example.test',
    'not-a-url',
  ])('does not publish an unsafe or development canonical origin: %s', (value) => {
    vi.stubEnv('SITE_URL', value)
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
    expect(productionSiteUrl()).toBeUndefined()
  })

  it('uses an explicitly configured HTTPS origin for canonical and share image URLs', () => {
    vi.stubEnv('SITE_URL', 'https://portfolio.example.test/ignored-path')
    const metadata = portfolioMetadata({
      title: 'Onaylı başlık',
      description: 'Onaylı içerik',
      path: '/projeler/approved-project',
      image: { url: '/api/media/file/cover.jpg', alt: 'Onaylı görsel' },
    })
    expect(metadata.alternates?.canonical).toBe(
      'https://portfolio.example.test/projeler/approved-project',
    )
    expect(metadata.openGraph).toMatchObject({
      images: [
        { url: 'https://portfolio.example.test/api/media/file/cover.jpg', alt: 'Onaylı görsel' },
      ],
    })
  })

  it('omits local canonical/share URLs and prevents indexing filtered combinations', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3000')
    const metadata = portfolioMetadata({
      title: 'Projeler',
      description: 'Portföy',
      path: '/projeler',
      image: { url: '/api/media/file/cover.jpg', alt: 'Kapak' },
      noindex: true,
    })
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.openGraph).not.toHaveProperty('images')
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })
})
