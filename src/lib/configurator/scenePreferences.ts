import { z } from 'zod'

export const SCENE_STORAGE_KEY = 'rtm-studio-scene-v1'
export const hexColor = z
  .string()
  .regex(/^#[\da-f]{6}$/i)
  .transform((s) => s.toLowerCase())
const schema = z
  .object({
    wall: hexColor.nullable().default(null),
    floor: hexColor.nullable().default(null),
    textured: z.boolean().default(true),
    props: z.boolean().default(true),
  })
  .strict()
export type ScenePreferences = z.infer<typeof schema>
export const defaultScenePreferences: ScenePreferences = {
  wall: null,
  floor: null,
  textured: true,
  props: true,
}
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>
export function readScenePreferences(storage: StorageAccess): ScenePreferences {
  try {
    const raw = storage.getItem(SCENE_STORAGE_KEY)
    if (!raw) return { ...defaultScenePreferences }
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : { ...defaultScenePreferences }
  } catch {
    return { ...defaultScenePreferences }
  }
}
export function saveScenePreferences(storage: StorageAccess, value: ScenePreferences) {
  try {
    storage.setItem(SCENE_STORAGE_KEY, JSON.stringify(schema.parse(value)))
  } catch {
    /* Viewing remains available without storage. */
  }
}
/** WCAG relative luminance, using linear sRGB rather than channel averages. */
export function luminance(hex: string) {
  const value = hexColor.parse(hex)
  const channels = [1, 3, 5]
    .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
export function contrastInk(background: string) {
  return luminance(background) > 0.179 ? 'dark' : 'light'
}

export const roomSwatches = {
  wall: [
    ['Kırık beyaz', '#eee8de'],
    ['Sıcak gri', '#b9b5ac'],
    ['Adaçayı yeşili', '#88927c'],
    ['Toprak', '#a49582'],
    ['Antrasit', '#383e42'],
  ],
  floor: [
    ['Açık meşe', '#b68c60'],
    ['Ceviz', '#79513a'],
    ['Beton grisi', '#8e9190'],
    ['Açık taş', '#e7ddcc'],
    ['Koyu karo', '#242524'],
  ],
} satisfies Record<'wall' | 'floor', string[][]>
