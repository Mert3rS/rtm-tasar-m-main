'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  type MeshPhysicalMaterial,
} from 'three'
import { palette, type Config } from '@/lib/configurator/config'
import { useSceneColors } from './SceneTheme'
import { useReducedMotion } from '../useReducedMotion'

type Vec = [number, number, number]
export type Board = { p: Vec; s: Vec }

// A local studio reflection illustration for small bathroom mirrors; no camera or external asset.
export function mirrorSurfaceTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 100, 256)
    gradient.addColorStop(0, '#cbd6d7')
    gradient.addColorStop(0.55, '#a3b5b8')
    gradient.addColorStop(1, '#8c9f9e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 256)
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.beginPath()
    ctx.moveTo(0, 36)
    ctx.lineTo(128, 154)
    ctx.lineTo(128, 190)
    ctx.lineTo(0, 72)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(0, 94)
    ctx.lineTo(128, 212)
    ctx.lineTo(128, 222)
    ctx.lineTo(0, 104)
    ctx.fill()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function woodTexture(base: string, grain: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 128, 512)
    for (let i = 0; i < 200; i++) {
      const x = (i * 67) % 128
      ctx.strokeStyle = grain
      ctx.globalAlpha = 0.025 + (i % 7) * 0.008
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + 8, 150, x - 8, 350, x, 512)
      ctx.stroke()
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = grain
      ctx.globalAlpha = 0.1
      ctx.fillRect(i * 32, 0, 1, 512)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  return texture
}
function plasterTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const pixels = ctx.createImageData(128, 128)
    let seed = 47
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const n = 245 + (seed >>> 24) * 0.039
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n
      pixels.data[i + 3] = 255
    }
    ctx.putImageData(pixels, 0, 0)
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(8, 4)
  texture.colorSpace = SRGBColorSpace
  return texture
}
function stoneTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(112,109,102,${0.025 + (i % 3) * 0.012})`
      ctx.lineWidth = i % 2 ? 0.7 : 1.4
      ctx.beginPath()
      ctx.moveTo((i * 59) % 256, 0)
      ctx.bezierCurveTo((i * 31) % 256, 83, (i * 71) % 256, 174, (i * 89) % 256, 256)
      ctx.stroke()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  return texture
}
export function Boards({
  items,
  color,
  wood = false,
  plaster = false,
  stone = false,
  repeat,
  roughness = 0.7,
  metalness = 0,
  room = false,
}: {
  items: Board[]
  color: string
  wood?: boolean
  plaster?: boolean
  stone?: boolean
  repeat?: [number, number]
  room?: boolean
  roughness?: number
  metalness?: number
}) {
  const colors = useSceneColors()
  const reduced = useReducedMotion()
  const woodBase = colors['wood-base'],
    woodGrain = colors['wood-grain']
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const repeatX = repeat?.[0],
    repeatY = repeat?.[1]
  const texture = useMemo(() => {
    const texture = wood
      ? woodTexture(room ? '#ffffff' : woodBase, room ? '#9f9f9f' : woodGrain)
      : stone
        ? stoneTexture()
        : plaster
          ? plasterTexture()
          : null
    if (texture && repeatX && repeatY) texture.repeat.set(repeatX, repeatY)
    return texture
  }, [wood, plaster, stone, repeatX, repeatY, woodBase, woodGrain, room])
  const material = useMemo(
    () =>
      room
        ? new MeshBasicMaterial({ map: texture, toneMapped: false })
        : new MeshStandardMaterial({
            map: texture,
            toneMapped: !room,
            bumpMap: plaster || (room && wood) ? texture : null,
            bumpScale: 0.008,
            roughness,
            metalness,
          }),
    [texture, roughness, metalness, plaster, room, wood],
  )
  const targetColor = useMemo(() => new Color(color), [color])
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
  }, [targetColor, material, invalidate])
  useFrame((_, delta) => {
    const difference =
      Math.abs(material.color.r - targetColor.r) +
      Math.abs(material.color.g - targetColor.g) +
      Math.abs(material.color.b - targetColor.b)
    if (difference < 0.001) {
      material.color.copy(targetColor)
      return
    }
    material.color.lerp(targetColor, reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 12))
    invalidate()
  })
  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )
  useEffect(
    () => () => {
      material.dispose()
    },
    [material],
  )
  useEffect(
    () => () => {
      texture?.dispose()
    },
    [texture],
  )
  useLayoutEffect(() => {
    const dummy = new Object3D()
    items.forEach((b, i) => {
      dummy.position.set(...b.p)
      dummy.scale.set(...b.s)
      dummy.updateMatrix()
      ref.current?.setMatrixAt(i, dummy.matrix)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}
export function Front({
  x,
  y,
  w,
  h,
  depth,
  type,
  color,
  options,
  open,
  selected,
  onSelect,
  onHover,
  localOpen,
  onToggle,
  longHandle = false,
  handleEdge = 'top',
  slideOffset,
  zOffset = 0,
  plumbingCutout = false,
  softMirror = false,
  tintedGlass = false,
}: {
  x: number
  y: number
  w: number
  h: number
  depth: number
  type: Config['r']['main']['g'][number]['f'][number]
  color: string
  options: Config['o']
  open: boolean
  selected: boolean
  onSelect: () => void
  localOpen: boolean
  onToggle: () => void
  onHover: (active: boolean) => void
  longHandle?: boolean
  handleEdge?: 'top' | 'bottom'
  slideOffset?: number
  zOffset?: number
  plumbingCutout?: boolean
  softMirror?: boolean
  tintedGlass?: boolean
}) {
  const colors = useSceneColors()
  const ref = useRef<Group>(null)
  const woodBase = colors['wood-base'],
    woodGrain = colors['wood-grain']
  const invalidate = useThree((s) => s.invalidate)
  const material = useRef<MeshPhysicalMaterial>(null)
  const [initialColor] = useState(color)
  const isOpen = open || localOpen
  const texture = useMemo(
    () =>
      type === 'ayna' && softMirror
        ? mirrorSurfaceTexture()
        : type !== 'cam' &&
            type !== 'ayna' &&
            (palette[options.renk].wood || options.malz === 'Ahşap kaplama')
          ? woodTexture(woodBase, woodGrain)
          : null,
    [options.renk, options.malz, woodBase, woodGrain, type, softMirror],
  )
  useEffect(() => () => texture?.dispose(), [texture])
  const target = useMemo(
    () =>
      new Color(
        type === 'ayna'
          ? colors.metal
          : type === 'cam' && tintedGlass
            ? options.camt === 'seffaf' || options.camt === 'buzlu'
              ? palette.beyaz.hex
              : palette.gri.hex
            : color,
      ),
    [color, type, colors.metal, options.camt, tintedGlass],
  )
  const frontZ = depth / 2 + zOffset
  const reduced = useReducedMotion()
  useEffect(() => {
    invalidate()
  }, [open, localOpen, color, invalidate])
  useFrame((_, delta) => {
    const group = ref.current
    if (!group) return
    const speed = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 13)
    const rotation =
      isOpen && options.acilim === 'mentese' && type !== 'cekmece'
        ? type === 'klapa'
          ? -1.15
          : -1.25
        : 0
    const slide = isOpen
      ? type === 'cekmece'
        ? depth * 0.65
        : options.acilim === 'surgulu'
          ? 0
          : options.acilim === 'katlanir'
            ? depth * 0.3
            : 0
      : 0
    const side = isOpen && options.acilim === 'surgulu' ? (slideOffset ?? w * 0.75) : 0
    const rotationX = type === 'klapa' ? rotation : 0
    const rotationY = type === 'klapa' ? 0 : rotation
    group.rotation.x += (rotationX - group.rotation.x) * speed
    group.rotation.y += (rotationY - group.rotation.y) * speed
    group.position.z += (frontZ + slide - group.position.z) * speed
    group.position.x += (x - w / 2 + side - group.position.x) * speed
    if (material.current) material.current.color.lerp(target, speed)
    if (
      Math.abs(group.rotation.x - rotationX) > 0.001 ||
      Math.abs(group.rotation.y - rotationY) > 0.001 ||
      Math.abs(group.position.z - frontZ - slide) > 0.001 ||
      Math.abs(group.position.x - x + w / 2 - side) > 0.001 ||
      (material.current && material.current.color.getHex() !== target.getHex())
    )
      invalidate()
  })
  if (type === 'acik') return null
  const handleColor = {
    beyaz: palette.beyaz.hex,
    siyah: palette.siyah.hex,
    inox: colors.metal,
    altin: colors.gold,
    bronz: colors.bronze,
  }[options.krenk]
  const glass = type === 'cam'
  const mirror = type === 'ayna'
  const textured = !glass && !mirror && (options.km === 'fluted' || options.km === 'cizgili')
  const verticalHandle =
    options.kulp === 'cubuk' || (longHandle && ['gomme', 'kenar-profil'].includes(options.kulp))
  const handleLength = verticalHandle
    ? longHandle
      ? options.kulp === 'kenar-profil'
        ? h - 0.04
        : Math.min(options.kulp === 'gomme' ? 0.32 : 0.8, h * 0.45)
      : Math.min(0.15, h * 0.45)
    : 0.012
  const handleY = longHandle && verticalHandle
    ? 0
    : options.kulp === 'gola'
      ? h / 2 - 0.018
      : verticalHandle
        ? Math.min(h / 2 - 0.05, h / 2 - handleLength / 2 - 0.02)
        : h / 2 - 0.05
  return (
    <group ref={ref} position={[x - w / 2, y, frontZ]}>
      <mesh
        position={[w / 2, 0, 0.012]}
        castShadow
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
          onToggle()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(true)
        }}
        onPointerOut={() => onHover(false)}
      >
        <boxGeometry args={[w - 0.004, h - 0.004, 0.018]} />
        <meshPhysicalMaterial
          ref={material}
          map={texture}
          color={initialColor}
          clearcoat={
            mirror ? 1 : options.malz === 'Akrilik' ? 0.5 : options.malz === 'Lake' ? 0.25 : 0
          }
          clearcoatRoughness={options.yuzey === 'Parlak' ? 0.15 : 0.7}
          transparent={glass}
          opacity={
            glass
              ? tintedGlass
                ? options.camt === 'seffaf'
                  ? 0.14
                  : options.camt === 'buzlu'
                    ? 0.65
                    : 0.3
                : options.camt === 'seffaf'
                  ? 0.24
                  : options.camt === 'fume'
                    ? 0.6
                    : 0.8
              : 1
          }
          metalness={mirror ? 1 : glass ? (tintedGlass ? 0.15 : 0.35) : 0.04}
          envMapIntensity={mirror ? 1.35 : 1}
          roughness={
            glass && tintedGlass
              ? options.camt === 'buzlu'
                ? 0.5
                : 0.2
              : mirror
                ? 0.045
                : options.yuzey === 'Parlak'
                  ? 0.18
                  : options.yuzey === 'Süper mat'
                    ? 0.95
                    : 0.65
          }
          emissiveMap={mirror && softMirror ? texture : null}
          emissive={
            mirror && softMirror ? colors.light : selected ? colors.selection : colors['ink-shadow']
          }
          emissiveIntensity={mirror && softMirror ? 0.55 : 0.06}
        />
      </mesh>
      {glass || (!mirror && options.km === 'cerceveli') ? (
        <Boards
          metalness={glass ? 0.75 : 0}
          roughness={glass ? 0.35 : 0.7}
          color={
            glass
              ? {
                  siyah: palette.siyah.hex,
                  alu: colors.metal,
                  altin: colors.gold,
                  bronz: colors.bronze,
                }[options.camc]
              : color
          }
          items={[
            { p: [0.018, 0, 0.025], s: [0.035, h, 0.015] },
            { p: [w - 0.018, 0, 0.025], s: [0.035, h, 0.015] },
            { p: [w / 2, h / 2 - 0.018, 0.025], s: [w, 0.035, 0.015] },
            { p: [w / 2, -h / 2 + 0.018, 0.025], s: [w, 0.035, 0.015] },
          ]}
        />
      ) : null}
      {glass && options.camt === 'yivli' ? (
        <Boards
          color={colors.metal}
          items={Array.from({ length: Math.min(16, Math.floor(w / 0.025)) }, (_, i) => ({
            p: [0.035 + i * 0.025, 0, 0.023],
            s: [0.002, Math.max(0.01, h - 0.065), 0.002],
          }))}
        />
      ) : null}
      {textured ? (
        <Boards
          color={color}
          items={Array.from({ length: Math.min(40, Math.floor(w / 0.025)) }, (_, i) => ({
            p: [
              0.02 + (i * (w - 0.04)) / Math.max(1, Math.min(40, Math.floor(w / 0.025)) - 1),
              0,
              0.025,
            ],
            s: [
              options.km === 'fluted'
                ? ((w - 0.04) / Math.max(1, Math.min(40, Math.floor(w / 0.025)))) * 0.48
                : 0.003,
              h - 0.03,
              0.01,
            ],
          }))}
        />
      ) : null}
      {options.kulp === 'dugme' ? (
        <mesh
          position={[w - 0.045, handleEdge === 'bottom' ? -h / 2 + 0.05 : 0, 0.04]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.013, 0.009, 0.024, 12]} />
          <meshStandardMaterial color={handleColor} metalness={0.7} roughness={0.35} />
        </mesh>
      ) : null}
      {options.kulp !== 'yok' && options.kulp !== 'bas-ac' && options.kulp !== 'dugme' ? (
        <mesh
          position={[
            verticalHandle ? w - 0.045 : w / 2,
            handleEdge === 'bottom' ? -handleY : handleY,
            0.036,
          ]}
        >
          <boxGeometry args={[verticalHandle ? 0.012 : w * 0.72, handleLength, 0.02]} />
          <meshStandardMaterial color={handleColor} metalness={0.7} roughness={0.35} />
        </mesh>
      ) : null}
      {type === 'cekmece' && isOpen ? (
        <Boards
          color={colors.drawer}
          items={[
            ...(plumbingCutout
              ? [
                  {
                    p: [w / 2, -h / 2 + 0.025, -depth * 0.18],
                    s: [w - 0.04, 0.018, depth * 0.36],
                  } satisfies Board,
                  ...[-1, 1].map((side): Board => ({
                    p: [w / 2 + side * (w / 4 + 0.035), -h / 2 + 0.025, -depth * 0.53],
                    s: [w / 2 - 0.09, 0.018, depth * 0.34],
                  })),
                ]
              : [
                  {
                    p: [w / 2, -h / 2 + 0.025, -depth * 0.35],
                    s: [w - 0.04, 0.018, depth * 0.7],
                  } satisfies Board,
                ]),
            { p: [0.025, 0, -depth * 0.35], s: [0.018, h * 0.7, depth * 0.7] },
            { p: [w - 0.025, 0, -depth * 0.35], s: [0.018, h * 0.7, depth * 0.7] },
            { p: [w / 2, 0, -depth * 0.7], s: [w - 0.04, h * 0.7, 0.018] },
          ]}
        />
      ) : null}
    </group>
  )
}
