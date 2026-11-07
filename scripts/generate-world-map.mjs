import { readFile, writeFile, mkdir } from 'node:fs/promises'

// Natural Earth 110m land polygons, public domain. Manual asset generation; no runtime fetch.
const input = process.argv[2]
if (!input) throw new Error('Provide the path to Natural Earth ne_110m_land.geojson')
const data = JSON.parse(await readFile(input, 'utf8'))
const polygons = data.features.flatMap(({ geometry }) =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [],
)
function inRing(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const dots = []
for (let lat = -57; lat < 84; lat += 2.2) {
  for (let lng = -179; lng < 180; lng += 2.2) {
    if (
      !polygons.some(
        ([outer, ...holes]) =>
          inRing(lng, lat, outer) && !holes.some((hole) => inRing(lng, lat, hole)),
      )
    )
      continue
    const x = (((lng + 180) / 360) * 1000).toFixed(2),
      y = (((85 - lat) / 145) * 440).toFixed(2)
    dots.push(`<circle cx="${x}" cy="${y}" r="1.65"/>`)
  }
}
await mkdir('public/assets/map', { recursive: true })
await writeFile(
  'public/assets/map/world-dots.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 440"><g fill="white">${dots.join('')}</g></svg>\n`,
)
console.log(`Generated ${dots.length} land dots`)
