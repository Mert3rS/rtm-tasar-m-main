import {
  designUrl,
  frontNames,
  interiorNames,
  optionName,
  palette,
  productNames,
  type Config,
} from './config'
import { kitchenDescription, kitchenModuleDetails } from './kitchen'
import { tvDetails } from './tv'
import { bathroomDetails } from './bathroom'
import { entrywayDetails } from './entryway'
import { wardrobeDetails } from './wardrobe'

export function downloadUrl(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}
async function svgPng(svg: SVGSVGElement) {
  // External SVG images cannot inherit CSS variables from the document.
  // Resolve the active theme on a clone before serialization; the live drawing stays interactive.
  const clone = svg.cloneNode(true)
  if (!(clone instanceof SVGSVGElement)) throw new Error('Çizim hazırlanamadı.')
  const originals = [svg, ...svg.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  originals.forEach((node, index) => {
    const styles = getComputedStyle(node)
    for (const name of ['fill', 'stroke', 'color'])
      copies[index].setAttribute(name, styles.getPropertyValue(name))
  })
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  )
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1800
    canvas.height = 1120
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Çizim hazırlanamadı.')
    ctx.drawImage(img, 0, 0, 1800, 1120)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
export async function exportPdf(c: Config, svg: SVGSVGElement, shareUrl?: string) {
  const [{ jsPDF }, qr] = await Promise.all([import('jspdf'), import('qrcode')])
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const url = shareUrl || designUrl(c)
  pdf.addImage(await svgPng(svg), 'PNG', 8, 8, 228, 142)
  // Canvas text preserves Turkish glyphs without fetching a third-party font.
  const canvas = document.createElement('canvas')
  canvas.width = 1800
  canvas.height = 360
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('PDF hazırlanamadı.')
  const styles = getComputedStyle(document.documentElement)
  ctx.fillStyle = styles.getPropertyValue('--studio-surface').trim()
  ctx.fillRect(0, 0, 1800, 360)
  ctx.fillStyle = styles.getPropertyValue('--studio-text').trim()
  ctx.font = '24px Arial'
  const lines = [
    `${productNames[c.m]}  /  ${c.d.w} × ${c.d.h} × ${c.d.d} cm`,
    `${c.o.malz} · ${c.o.yuzey} · ${palette[c.o.renk].name} · ${optionName(c.o.km)}`,
    `Kulp: ${optionName(c.o.kulp)} / ${optionName(c.o.krenk)} · Baza: ${optionName(c.o.baza)} · LED: ${c.o.led.map(optionName).join(', ') || 'Yok'}`,
    `Bölmeler: ${c.r.main.w.join(' / ')} cm · Gövde 18 mm · Arkalık 8 mm · Kapak aralığı 3 mm`,
    `${new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long' }).format(new Date())} · RTM Tasarım`,
    'Ön tasarımdır. Üretim öncesi ölçü ve donanım uyumluluğu kontrol edilmelidir.',
  ]
  lines.forEach((line, i) => ctx.fillText(line, 20, 40 + i * 48))
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 153, 228, 46)
  try {
    pdf.addImage(
      await qr.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'L' }),
      'PNG',
      241,
      20,
      48,
      48,
    )
  } catch {
    pdf.text('QR kapasitesi asildi.', 242, 45)
  }
  pdf.setFontSize(9)
  pdf.textWithLink('Tasarimi tarayicida ac', 242, 78, { url })
  pdf.text('RTM / TASARIM', 242, 12)
  const details = [
    `RTM TASARIM / ÖLÇÜ VE DONANIM LİSTESİ`,
    ...(c.tvUnit ? tvDetails(c).flatMap(([label, value]) => [label, ...value.split(' · ')]) : c.bathroom ? bathroomDetails(c).flatMap(([label, value]) => [label, ...value.split(' · ')]) : c.entryway ? entrywayDetails(c).flatMap(([label, value]) => [label, ...value.split(' · ')]) : c.wardrobe
      ? wardrobeDetails(c).flatMap(([label, value]) => [label, ...value.split(' · ')])
      : []),
    ...(c.k
      ? [
          'MUTFAK PLANI',
          ...kitchenDescription(c).split(' · '),
          ...kitchenModuleDetails(c).flatMap(([row, value]) => [row, ...value.split(' · ')]),
        ]
      : []),
    `Gövde: ${optionName(c.o.govde)} · İkinci renk: ${c.o.iki ? palette[c.o.renk2].name : 'Yok'} · RAL / HEX: ${c.o.ral || 'Yok'}`,
    `Açılım: ${optionName(c.o.acilim)}${['mutfak', 'banyo'].includes(c.m) ? ` · Tezgâh: ${optionName(c.o.tezgah)}` : ''} · Üst modül: ${(c.bathroom?.upperEnabled ?? c.entryway?.upper ?? c.wardrobe?.loft ?? c.o.ust) ? 'Var' : 'Yok'} · Kapatma paneli: ${c.o.panel ? 'Var' : 'Yok'}`,
    `Cam: ${c.k?.modules || c.wardrobe || c.entryway || c.bathroom || c.tvUnit ? 'Bölme / panel bazında, listede belirtilmiştir' : optionName(c.o.camt)} / ${optionName(c.o.camc)}${c.m === 'tv' ? ` · TV: ${c.o.tv} inç` : ''}`,
    '',
    ...(c.k?.modules || c.wardrobe || c.entryway || c.bathroom || c.tvUnit
      ? []
      : c.r.main.g.flatMap((g, s) => [
          `BÖLME ${s + 1} / ${c.r.main.w[s]} cm / ${c.r.main.t[s]} / ${c.r.main.lk[s] ? 'Kilitli' : 'Serbest'} / Çift dikme: ${c.r.main.ay[s] ? 'Var' : 'Yok'}`,
          ...g.h.map(
            (h, i) =>
              `  Göz ${i + 1}: ${h} cm · ${frontNames[g.f[i]]} · ${interiorNames[g.ic[i]]} · Raf: ${g.rf[i] === -1 ? 'Otomatik' : g.rf[i]} · ${g.lk[i] ? 'Kilitli' : 'Serbest'}${g.ka[i] ? ` · ${g.ka[i]}` : ''}`,
          ),
          '',
        ])),
  ]
  for (let start = 0; start < details.length; start += 30) {
    const sheet = document.createElement('canvas')
    sheet.width = 2200
    sheet.height = 1450
    const context = sheet.getContext('2d')
    if (!context) throw new Error('PDF hazırlanamadı.')
    context.fillStyle = styles.getPropertyValue('--studio-surface').trim()
    context.fillRect(0, 0, 2200, 1450)
    context.fillStyle = styles.getPropertyValue('--studio-text').trim()
    context.font = '23px Arial'
    details
      .slice(start, start + 30)
      .forEach((line, i) => context.fillText(line, 55, 65 + i * 43, 2090))
    pdf.addPage()
    pdf.addImage(sheet.toDataURL('image/png'), 'PNG', 8, 8, 281, 185)
  }
  pdf.save('rtm-on-tasarim.pdf')
}
export async function exportPng(canvas: HTMLCanvasElement | null, svg: SVGSVGElement) {
  downloadUrl(canvas ? canvas.toDataURL('image/png') : await svgPng(svg), 'rtm-tasarim.png')
}
