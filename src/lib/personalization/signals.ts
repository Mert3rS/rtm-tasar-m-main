import type { ProjectCardData } from '@/types/portfolio'
import type { InterestEvent } from './interest'

type Signal = InterestEvent['sig'][number]
const clip = (value: string) => value.slice(0, 80)
const slugify = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (char) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[char] || char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)

/** Public project facets for interest signals; city/country slugs are derived from names. */
export function projectInterestSignals(
  project: Pick<ProjectCardData, 'categories' | 'cityName' | 'countryName'> & { citySlug?: string; countrySlug?: string },
): Signal[] {
  const signals: Signal[] = project.categories
    .slice(0, 4)
    .map(({ slug, name }) => ({ t: 'projectCategory' as const, s: slug, l: clip(name) }))
  if (project.cityName) signals.push({ t: 'city', s: project.citySlug || slugify(project.cityName), l: clip(project.cityName) })
  if (project.countryName)
    signals.push({ t: 'country', s: project.countrySlug || slugify(project.countryName), l: clip(project.countryName) })
  return signals.filter((signal) => signal.s)
}
