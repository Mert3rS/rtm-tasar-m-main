import { describe, expect, it } from 'vitest'
import { catalogHref, modelsHref, parseModelQuery, validCatalogSlug } from '@/lib/catalogQuery'

describe('Public catalog URL boundaries', () => {
  it('keeps filters in shareable pagination links and resets page one', () => {
    const filters = parseModelQuery({ kategori: 'onayli-model', sayfa: '2' })
    expect(filters).toEqual({ category: 'onayli-model', page: 2 })
    expect(modelsHref(filters, 3)).toBe('/modeller?kategori=onayli-model&sayfa=3')
    expect(modelsHref(filters, 1)).toBe('/modeller?kategori=onayli-model')
  })
  it('does not collapse repeated category parameters into an unfiltered archive', () => {
    expect(parseModelQuery({ kategori: ['a', 'b'] }).category).toBeTruthy()
    expect(parseModelQuery({ kategori: 'x'.repeat(500) }).category).toHaveLength(120)
  })
  it.each(['-1', 'Infinity', '1e10', '100000000', 'bad'])(
    'bounds invalid pagination: %s',
    (sayfa) => {
      expect(parseModelQuery({ sayfa }).page).toBe(1)
    },
  )
  it('rejects route traversal, private paths and oversized detail identifiers', () => {
    for (const slug of ['../admin', 'a/b', '', 'MODEL', 'a'.repeat(121)])
      expect(validCatalogSlug(slug)).toBe(false)
    expect(validCatalogSlug('onayli-model-1')).toBe(true)
    expect(catalogHref('model', 'onayli-model')).toBe('/modeller/onayli-model')
    expect(catalogHref('service', 'onayli-hizmet')).toBe('/hizmetler/onayli-hizmet')
  })
})
