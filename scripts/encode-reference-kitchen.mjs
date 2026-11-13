/** Encode the offline Blender renders. Publish readiness only after every file exists. */
import sharp from 'sharp'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

const [desktopInput, mobileInput, ffmpeg, outputDirectory] = process.argv.slice(2)
if (!desktopInput || !mobileInput || !ffmpeg) {
  throw new Error(
    'Usage: node scripts/encode-reference-kitchen.mjs <desktop PNG dir> <mobile PNG dir> <ffmpeg executable> [output directory]',
  )
}
const output = path.resolve(outputDirectory || 'public/assets/home/kitchen-assembly')
const name = (index) => `frame_${String(index).padStart(4, '0')}`
await mkdir(path.join(output, 'desktop'), { recursive: true })
await mkdir(path.join(output, 'mobile'), { recursive: true })
// A rerun must also fall back to the original film until the replacement is complete.
await rm(path.join(output, 'ready.json'), { force: true })

for (let index = 1; index <= 150; index++) {
  const input = path.join(desktopInput, `${name(index)}.png`)
  const metadata = await sharp(input).metadata()
  if (metadata.width !== 1920 || metadata.height !== 1200)
    throw new Error(`Desktop frame ${index} must be a native 1920x1200 render`)
  await sharp(input)
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(path.join(output, 'desktop', `${name(index)}.jpg`))
}
for (let index = 0; index < 100; index++) {
  const sourceIndex = Math.round((index * 149) / 99) + 1
  const input = path.join(mobileInput, `${name(sourceIndex)}.png`)
  const metadata = await sharp(input).metadata()
  if (metadata.width !== 720 || metadata.height !== 1280)
    throw new Error(`Mobile frame ${sourceIndex} must be a native 720x1280 render`)
  await sharp(input)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(path.join(output, 'mobile', `${name(index + 1)}.jpg`))
}

await new Promise((resolve, reject) => {
  const process = spawn(
    ffmpeg,
    [
      '-y',
      '-framerate',
      '18.75',
      '-i',
      path.join(desktopInput, 'frame_%04d.png'),
      '-frames:v',
      '150',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-g',
      '1',
      '-keyint_min',
      '1',
      '-crf',
      '18',
      '-an',
      '-movflags',
      '+faststart',
      path.join(output, 'kitchen-assembly.mp4'),
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  process.on('error', reject)
  process.on('exit', (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
  )
})

let totalBytes = 0
for (const [directory, count] of [
  ['desktop', 150],
  ['mobile', 100],
]) {
  for (let index = 1; index <= count; index++) {
    const metadata = await stat(path.join(output, directory, `${name(index)}.jpg`))
    if (!metadata.size) throw new Error('Empty frame')
    totalBytes += metadata.size
  }
}
await writeFile(
  path.join(output, 'ready.json.tmp'),
  JSON.stringify({
    desktop: 150, mobile: 100, totalBytes,
    desktopWidth: 1920, desktopHeight: 1200,
    mobileWidth: 720, mobileHeight: 1280,
  }),
)
await rename(path.join(output, 'ready.json.tmp'), path.join(output, 'ready.json'))
console.log(
  `Encoded 250 assembly frames (${(totalBytes / 1024 / 1024).toFixed(1)} MiB) and preview MP4.`,
)
