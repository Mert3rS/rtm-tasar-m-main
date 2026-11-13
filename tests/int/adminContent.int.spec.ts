import { describe, expect, it, vi } from 'vitest'
import { HOMEPAGE_DEFAULTS, heroSlots, resolveHomepageCopy } from '@/lib/homepageContent'
import { isPreviewPath, visualEditorPath } from '@/components/admin/visual-pages'
import { HERO_POSITIONS, resolveHeroPhotos } from '@/lib/homepageHero'

const findGlobal = vi.fn()
vi.mock('@/lib/projectData', () => ({
  getPublicPayload: async () => ({ findGlobal }),
  projectImage: () => undefined,
}))

import { getPublicSiteSettings } from '@/lib/siteSettings'

describe('Customer content editor contracts', () => {
  it('keeps all nine animated positions stable and replaces only the selected photo', () => {
    const projects = [0, 1, 2].map((id) => ({
      id: String(id),
      title: `Approved ${id}`,
      slug: String(id),
      coverImage: { url: `/approved-${id}.jpg`, alt: `Approved ${id}` },
    }))
    const fallback = resolveHeroPhotos(projects, {})
    expect(fallback).toHaveLength(9)
    expect(new Set(HERO_POSITIONS.map(({ key }) => key)).size).toBe(9)
    expect(fallback[4].position).toBe('center')
    expect(fallback[4].image).toEqual(projects[0].coverImage)
    const selected = { url: '/approved-opening.jpg', alt: 'Approved opening' }
    const custom = resolveHeroPhotos(projects, { center: selected })
    expect(custom[4]).toEqual({ position: 'center', image: selected, source: 'selected' })
    expect(custom.filter((_, index) => index !== 4)).toEqual(
      fallback.filter((_, index) => index !== 4),
    )
    expect(projects[0].coverImage.url).toBe('/approved-0.jpg')
    expect(resolveHeroPhotos([], { topLeft: selected })[0].image).toEqual(selected)
    expect(
      resolveHeroPhotos([], {}).every(({ image, source }) => !image && source === 'empty'),
    ).toBe(true)
  })
  it('limits visual editor targets and preview navigation to known public routes', () => {
    expect(visualEditorPath('projects:42')).toBe('/collections/projects/42')
    expect(visualEditorPath('about-page')).toBe('/globals/about-page')
    expect(visualEditorPath('projects')).toBe('/collections/projects')
    for (const target of [
      'users:1',
      'inquiries:2',
      'site-settings:1',
      'projects:../users',
      'projects:2:3',
      'projects:-1',
      'projects:0',
      'https://example.com',
    ])
      expect(visualEditorPath(target)).toBeNull()
    expect(isPreviewPath('/')).toBe(true)
    expect(isPreviewPath('/projeler/onayli-proje')).toBe(true)
    expect(isPreviewPath('/tasarim-olustur/teklif')).toBe(true)
    for (const path of ['/admin', '/api/users', '//example.com', '/projeler-admin', '/bilinmeyen'])
      expect(isPreviewPath(path)).toBe(false)
  })
  it('preserves current home copy for missing and blank fields and excludes unknown inputs', () => {
    const input = {
      heroHeading: '  Onaylı yeni başlık  ',
      studioButton: ' ',
      internalNotes: 'private',
    }
    const copy = resolveHomepageCopy(input)
    expect(copy.heroHeading).toBe('Onaylı yeni başlık')
    expect(copy.studioButton).toBe(HOMEPAGE_DEFAULTS.studioButton)
    expect(copy).not.toHaveProperty('internalNotes')
    expect(resolveHomepageCopy(null)).toEqual(HOMEPAGE_DEFAULTS)
  })

  it('maps the initial center photograph to its real source without inventing missing content', () => {
    const project = { id: 'approved-project', editorHref: '/admin/collections/projects/42' }
    const slots = heroSlots([project])
    expect(slots).toHaveLength(9)
    expect(slots[4]).toBe(project)
    expect(slots.every((source) => source === project)).toBe(true)
    expect(heroSlots([]).every((source) => source === undefined)).toBe(true)
  })

  it('selects home copy explicitly while keeping notification and retention settings private', async () => {
    findGlobal.mockResolvedValueOnce({
      companyName: 'DEMO',
      homepage: { heroHeading: 'Onaylı başlık' },
      instagramUrl: 'https://www.instagram.com/rtmtasarim/',
      notificationRecipientEmail: 'private@example.invalid',
      designShareRetentionDays: 365,
    })
    const settings = await getPublicSiteSettings()
    expect(findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'site-settings',
        select: expect.objectContaining({ homepage: true }),
      }),
    )
    expect(findGlobal.mock.calls[0][0].select).not.toHaveProperty('notificationRecipientEmail')
    expect(settings.homepage.heroHeading).toBe('Onaylı başlık')
    expect(settings.socials).toContainEqual({
      label: 'Instagram',
      href: 'https://www.instagram.com/rtmtasarim/',
    })
    expect(settings).not.toHaveProperty('notificationRecipientEmail')
    expect(settings).not.toHaveProperty('designShareRetentionDays')
  })
})
