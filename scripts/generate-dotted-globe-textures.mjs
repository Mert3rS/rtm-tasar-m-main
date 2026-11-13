import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const sourcePath = new URL('../public/assets/map/world-dots.svg', import.meta.url)
const source = await readFile(sourcePath, 'utf8')
const circles = source.match(/<circle\b[^>]*\/>/g)

if (!circles?.length) throw new Error('Noktalı dünya kaynağında daire verisi bulunamadı.')

async function render(name, background, dots) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 1000 500">
      <rect width="1000" height="500" fill="${background}"/>
      <g transform="translate(0 30)" fill="${dots}">${circles.join('')}</g>
    </svg>
  `

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true })
    .toFile(fileURLToPath(new URL(`../public/assets/globe/${name}`, import.meta.url)))
}

await Promise.all([
  render('earth-dots-light.png', '#edf6ff', '#3f91e6'),
  render('earth-dots-dark.png', '#102235', '#6faef1'),
])
