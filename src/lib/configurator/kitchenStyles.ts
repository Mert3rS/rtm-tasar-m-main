import type { Config, Options } from './config'
import { ensureKitchenModules } from './kitchen'

type KitchenStyle = {
  id: string
  name: string
  detail: string
  options: Partial<Options>
  glass?: boolean
}
export const kitchenStyles: KitchenStyle[] = [
  {
    id: 'ivory',
    name: 'Sade fildişi',
    detail: 'Mat · gizli siyah kulp',
    options: {
      renk: 'fildisi',
      renk2: 'fildisi',
      iki: false,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      kulp: 'gola',
      krenk: 'siyah',
      govde: 'beyaz',
    },
  },
  {
    id: 'oak',
    name: 'Meşe & kaşmir',
    detail: 'Ahşap alt · sakin üst ton',
    options: {
      renk: 'mese',
      renk2: 'kasmir',
      iki: true,
      ral: '',
      malz: 'Ahşap kaplama',
      yuzey: 'Dokulu',
      km: 'duz',
      kulp: 'kenar-profil',
      krenk: 'bronz',
      govde: 'ahsap',
    },
  },
  {
    id: 'forest',
    name: 'Orman & krem',
    detail: 'Süper mat · iki renk',
    options: {
      renk: 'orman',
      renk2: 'krem',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      kulp: 'gola',
      krenk: 'bronz',
      govde: 'beyaz',
    },
  },
  {
    id: 'midnight',
    name: 'Gece mavisi',
    detail: 'Düz kapak · ince profil',
    options: {
      renk: 'gece-mavisi',
      renk2: 'gece-mavisi',
      iki: false,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      kulp: 'kenar-profil',
      krenk: 'inox',
      govde: 'antrasit',
    },
  },
  {
    id: 'sage',
    name: 'Adaçayı',
    detail: 'Çerçeveli · mat lake',
    options: {
      renk: 'adacayi',
      renk2: 'adacayi',
      iki: false,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'cerceveli',
      kulp: 'dugme',
      krenk: 'bronz',
      govde: 'beyaz',
    },
  },
  {
    id: 'glass',
    name: 'Vitrinli kaşmir',
    detail: 'Bronz çerçeve · füme cam',
    options: {
      renk: 'kasmir',
      renk2: 'fildisi',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      kulp: 'gola',
      krenk: 'bronz',
      camc: 'bronz',
      govde: 'beyaz',
    },
    glass: true,
  },
]
export function applyKitchenStyle(c: Config, id: string) {
  const preset = kitchenStyles.find((preset) => preset.id === id)
  if (!c.k || !preset) return
  Object.assign(c.o, preset.options)
  if (preset.glass) {
    c.o.ust = true
    const upper = ensureKitchenModules(c).upper
    for (const index of [0, upper.w.length - 1])
      if (upper.t[index] !== 'hood') {
        upper.t[index] = 'glass'
        upper.glass[index] = 'fume'
      }
    c.o.led = Array.from(new Set([...c.o.led, 'ic']))
  }
}
