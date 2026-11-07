import {
  baseHeight,
  frontNames,
  interiorNames,
  optionName,
  palette,
  productNames,
  round,
  type Config,
} from './config'
import { kitchenDescription, kitchenModuleDetails } from './kitchen'
import { tvDetails } from './tv'
import { bathroomDetails } from './bathroom'
import { entrywayDetails } from './entryway'
import { wardrobeDetails } from './wardrobe'

/** Describe validated fields only; kitchen fixtures are limited to those that fit the plan. */
export function designDetails(c: Config): [string, string][] {
  return [
    ['Ölçüler', `${c.d.w} × ${c.d.h} × ${c.d.d} cm (genişlik × yükseklik × derinlik)`],
    ...(c.k ? ([['Mutfak yerleşimi', kitchenDescription(c)]] satisfies [string, string][]) : []),
    ...(c.tvUnit ? tvDetails(c) : c.bathroom ? bathroomDetails(c) : c.entryway ? entrywayDetails(c) : c.wardrobe
      ? wardrobeDetails(c)
      : c.k?.modules
        ? kitchenModuleDetails(c)
        : [
            [
              'Bölmeler',
              c.r.main.w
                .map(
                  (width, s) =>
                    `${s + 1}) ${round(width)} cm · ${optionName(c.r.main.t[s])}: ${c.r.main.g[s].h.map((height, i) => `${i + 1}. göz ${round(height)} cm ${frontNames[c.r.main.g[s].f[i]]} / ${interiorNames[c.r.main.g[s].ic[i]]}`).join(', ')}`,
                )
                .join('\n'),
            ] satisfies [string, string],
          ]),
    [
      'Kapak ve renk',
      `${c.o.malz}, ${c.o.yuzey}, ${optionName(c.o.km)} · Renk: ${palette[c.o.renk].name}${c.o.iki ? ` / ${palette[c.o.renk2].name}` : ''}${c.o.ral ? ` / ${c.o.ral}` : ''} · Gövde: ${optionName(c.o.govde)}`,
    ],
    [
      'Detaylar',
      `Kulp: ${optionName(c.o.kulp)}, ${optionName(c.o.krenk)} · Baza ${baseHeight(c)} cm${['mutfak', 'banyo'].includes(c.m) ? ` · Tezgâh: ${optionName(c.o.tezgah)}` : ''} · LED: ${c.o.led.map((value) => (value === 'gola' ? 'Gola profil LED' : optionName(value))).join(', ') || 'Yok'}${c.k || c.wardrobe || c.entryway || c.bathroom || c.tvUnit ? ` · Cam çerçevesi: ${optionName(c.o.camc)}` : ''}`,
    ],
  ]
}

export function designMessage(
  c: Config,
  url: string,
  personal?: { location: string; note: string },
) {
  return [
    `Merhaba, ${new URL(url).hostname} üzerinden bir çizim hazırladım.`,
    '',
    `Ürün: ${productNames[c.m]}`,
    ...designDetails(c).map(([label, value]) => `${label}: ${value}`),
    ...(personal ? [`Konum: ${personal.location}`, `Not: ${personal.note}`] : []),
    '',
    'Çizim:',
    url,
  ].join('\n')
}
