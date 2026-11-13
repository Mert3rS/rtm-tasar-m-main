import { describe, expect, it } from 'vitest'
import type { Field } from 'payload'
import { Projects } from '@/collections/Projects'
import { Services } from '@/collections/Services'
import { DesignModels } from '@/collections/DesignModels'
import { Showrooms } from '@/collections/Showrooms'
import { ShowroomScenes } from '@/collections/ShowroomScenes'
import { AboutPage } from '@/globals/AboutPage'
import { SiteSettings } from '@/globals/SiteSettings'
import { PHOTO_PLACEMENTS, photoDocument, photoPlacement, readMediaId } from '@/lib/photoPlacements'
import { HERO_POSITIONS } from '@/lib/homepageHero'
import { isNativeEditorField } from '@/components/admin/nativeEditorFocus'

function uploads(
  fields: Field[],
  prefix = '',
  tab?: string,
): Array<{ path: string; tab?: string }> {
  return fields.flatMap((field) => {
    if (field.type === 'tabs')
      return field.tabs.flatMap((item) =>
        uploads(item.fields, prefix, typeof item.label === 'string' ? item.label : undefined),
      )
    const path = 'name' in field ? [prefix, field.name].filter(Boolean).join('.') : prefix
    if (field.type === 'upload') return [{ path, tab }]
    if ('fields' in field) return uploads(field.fields, path, tab)
    return []
  })
}

describe('Photo placements match the native CMS and publish no private data', () => {
  it('allows only known editor fields and excludes protected settings', () => {
    expect(isNativeEditorField('projects', 'seoImage')).toBe(true)
    expect(isNativeEditorField('site-settings', 'homepage__heroHeading')).toBe(true)
    expect(isNativeEditorField('site-settings', 'heroImages__center')).toBe(true)
    expect(isNativeEditorField('site-settings', 'notificationRecipientEmail')).toBe(false)
    expect(isNativeEditorField('users', 'email')).toBe(false)
    expect(isNativeEditorField('about-page', 'heroImage__unknown')).toBe(false)
  })
  it('accepts both persisted numeric and native string media IDs', () => {
    expect(readMediaId(42)).toBe(42)
    expect(readMediaId('42')).toBe(42)
    for (const value of [null, undefined, '', 'abc', '-1', 0, -1, 1.5, '9007199254740992'])
      expect(readMediaId(value)).toBeUndefined()
  })
  it('covers every upload field and its actual editor tab', () => {
    for (const [kind, schema] of Object.entries({
      projects: Projects,
      services: Services,
      'design-models': DesignModels,
      showrooms: Showrooms,
      'showroom-scenes': ShowroomScenes,
      'about-page': AboutPage,
      'site-settings': SiteSettings,
    })) {
      for (const upload of uploads(schema.fields)) {
        if (upload.path.startsWith('heroImages.')) {
          expect(HERO_POSITIONS.some(({ key }) => upload.path === `heroImages.${key}`)).toBe(true)
          continue
        }
        const placement = photoPlacement(kind, upload.path.split('.')[0])
        expect(placement, `${kind}.${upload.path}`).toBeDefined()
        expect(placement?.tab, `${kind}.${upload.path}`).toBe(upload.tab)
      }
    }
    expect(
      PHOTO_PLACEMENTS['showroom-scenes'].find(({ field }) => field === 'panoramaImage')?.panorama,
    ).toBe(true)
  })

  it('keeps gallery order/count, bounds previews and excludes unrelated fields', () => {
    const images = Array.from({ length: 12 }, (_, index) => ({
      image: {
        id: index,
        url: `/approved-${index}.jpg`,
        alt: `Photo ${index}`,
        internalNote: 'PRIVATE',
      },
    }))
    const doc = photoDocument(
      'projects',
      {
        gallery: images,
        _status: 'draft',
        notificationRecipientEmail: 'PRIVATE',
        description: 'PRIVATE',
      },
      'Approved project',
      'projects:12',
    )
    const gallery = doc.placements.find(({ field }) => field === 'gallery')
    expect(gallery?.count).toBe(12)
    expect(gallery?.images).toHaveLength(8)
    expect(gallery?.images[0]).toEqual({ url: '/approved-0.jpg', alt: 'Photo 0' })
    expect(gallery?.images[7].url).toBe('/approved-7.jpg')
    expect(JSON.stringify(doc)).not.toContain('PRIVATE')
    expect(doc.status).toContain('taslak')
    expect(
      photoDocument(
        'services',
        { active: false, _status: 'published' },
        'Approved service',
        'services:1',
      ).status,
    ).toContain('Pasif')
    expect(photoPlacement('users', 'avatar')).toBeUndefined()
    expect(photoDocument('about-page', null, 'Hakkımızda', 'about-page').status).toContain('taslak')
  })
})
