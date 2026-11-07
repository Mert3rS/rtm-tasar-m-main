'use client'

import { useEffect, useMemo } from 'react'
import {
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
  ExtrudeGeometry,
  Path,
  Shape,
} from 'three'
import { palette, type Config } from '@/lib/configurator/config'
import { bathroomBasinSize, bathroomGeometry, type BathroomUnit } from '@/lib/configurator/bathroom'
import { Boards, type Board } from './CabinetParts'
import { useSceneColors } from './SceneTheme'

function basinOutline(width: number, depth: number, rounded: boolean, steps: number) {
  return Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2,
      cos = Math.cos(angle),
      sin = Math.sin(angle),
      power = rounded ? 1 : 0.45
    return [
      (Math.sign(cos) * Math.abs(cos) ** power * width) / 2,
      (Math.sign(sin) * Math.abs(sin) ** power * depth) / 2,
    ] as const
  })
}
function CeramicBasin({ config: c, unit }: { config: Config; unit: BathroomUnit }) {
  const colors = useSceneColors(),
    size = bathroomBasinSize(c, unit),
    vessel = c.bathroom?.basin !== 'inset'
  const width = size.width / 100,
    depth = size.depth / 100,
    rounded = c.bathroom?.basin !== 'inset',
    counter = bathroomGeometry(c).counter / 100
  const geometry = useMemo(() => {
    const outline = basinOutline(width, depth, rounded, 64),
      vertices: number[] = [],
      indices: number[] = [],
      vertexColors: number[] = []
    // A continuous outer wall, ceramic lip, concave bowl and floor. No cap across the opening.
    const profile = vessel
      ? [
          [0.7, 0.005],
          [0.95, 0.1],
          [1, 0.12],
          [0.94, 0.12],
          [0.81, 0.065],
          [0.58, 0.014],
          [0, 0.014],
        ]
      : [
          [1, 0.002],
          [0.95, 0.003],
          [0.86, -0.05],
          [0.62, -0.115],
          [0, -0.115],
        ]
    for (const [ring, [radius, y]] of profile.entries())
      for (const [x, z] of outline) {
        vertices.push(x * radius, y, z * radius)
        const shade = (
          vessel ? [0.94, 0.98, 1, 0.96, 0.73, 0.66, 0.76] : [1, 0.98, 0.75, 0.63, 0.72]
        )[ring]
        vertexColors.push(shade, shade, shade)
      }
    for (let ring = 0; ring < profile.length - 1; ring++)
      for (let i = 0; i < outline.length; i++) {
        const a = ring * outline.length + i,
          b = ring * outline.length + ((i + 1) % outline.length),
          d = a + outline.length,
          e = b + outline.length
        indices.push(a, d, b, b, d, e)
      }
    const mesh = new BufferGeometry()
    mesh.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    mesh.setAttribute('color', new Float32BufferAttribute(vertexColors, 3))
    mesh.setIndex(indices)
    mesh.computeVertexNormals()
    return mesh
  }, [width, depth, rounded, vessel])
  useEffect(() => () => geometry.dispose(), [geometry])
  const metal = {
    siyah: palette.siyah.hex,
    beyaz: palette.beyaz.hex,
    inox: colors.metal,
    altin: colors.gold,
    bronz: colors.bronze,
  }[c.o.krenk]
  const faucetY = vessel ? 0.32 : 0.22,
    faucetZ = -c.d.d / 200 + 0.055
  return (
    <group position={[unit.x / 100, counter, size.z / 100]} name={`bathroom-basin-${unit.index}`}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={palette.beyaz.hex}
          vertexColors
          side={DoubleSide}
          roughness={0.25}
          clearcoat={0.65}
        />
      </mesh>
      <mesh position={[0, vessel ? 0.015 : -0.114, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.018, 24]} />
        <meshStandardMaterial color={metal} metalness={0.8} roughness={0.25} />
      </mesh>
      <group position={[0, 0, faucetZ - size.z / 100]} name="bathroom-faucet">
        <mesh position={[0, faucetY / 2, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.016, faucetY, 16]} />
          <meshStandardMaterial color={metal} metalness={0.8} roughness={0.23} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.016, 20]} />
          <meshStandardMaterial color={metal} metalness={0.8} roughness={0.23} />
        </mesh>
        <mesh position={[0, faucetY - 0.012, 0.065]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.15, 16]} />
          <meshStandardMaterial color={metal} metalness={0.8} roughness={0.23} />
        </mesh>
        <Boards
          color={metal}
          metalness={0.8}
          roughness={0.23}
          items={[{ p: [0.035, faucetY * 0.65, 0], s: [0.06, 0.012, 0.018] }]}
        />
      </group>
      {!vessel ? (
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.21, 12]} />
          <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
        </mesh>
      ) : null}
    </group>
  )
}
export function BathroomFixtures({ config: c }: { config: Config }) {
  const colors = useSceneColors(),
    g = bathroomGeometry(c),
    b = c.bathroom
  const width = c.d.w / 100,
    depth = c.d.d / 100,
    top = g.counter / 100
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-width / 2 - 0.01, -depth / 2 - 0.015)
    shape.lineTo(width / 2 + 0.01, -depth / 2 - 0.015)
    shape.lineTo(width / 2 + 0.01, depth / 2 + 0.015)
    shape.lineTo(-width / 2 - 0.01, depth / 2 + 0.015)
    shape.closePath()
    if (c.bathroom?.basin === 'inset')
      for (const unit of g.sinks) {
        const size = bathroomBasinSize(c, unit),
          hole = new Path(),
          points = basinOutline((size.width / 100) * 0.97, (size.depth / 100) * 0.97, false, 64)
        points.reverse().forEach(([x, z], index) => {
          if (index === 0) hole.moveTo(unit.x / 100 + x, -size.z / 100 + z)
          else hole.lineTo(unit.x / 100 + x, -size.z / 100 + z)
        })
        hole.closePath()
        shape.holes.push(hole)
      }
    return new ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 24 })
  }, [c, depth, width, g.sinks])
  useEffect(() => () => geometry.dispose(), [geometry])
  if (!b) return null
  const counterColor =
    c.o.tezgah === 'compact'
      ? palette.antrasit.hex
      : c.o.tezgah === 'granit'
        ? palette.gri.hex
        : c.o.tezgah === 'laminat'
          ? palette.krem.hex
          : colors.counter
  const railColor = {
    siyah: palette.siyah.hex,
    beyaz: palette.beyaz.hex,
    inox: colors.metal,
    altin: colors.gold,
    bronz: colors.bronze,
  }[c.o.krenk]
  const accessoryBoards: Board[] = []
  if (b.towelRail)
    accessoryBoards.push(
      { p: [width / 2 + 0.025, top - 0.16, 0.015], s: [0.012, 0.012, depth * 0.6] },
      ...[-1, 1].map((sign): Board => ({
        p: [width / 2 + 0.012, top - 0.16, 0.015 + sign * depth * 0.26],
        s: [0.04, 0.012, 0.012],
      })),
    )
  return (
    <group name="bathroom-fixtures">
      <mesh
        geometry={geometry}
        position={[0, top - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial color={counterColor} roughness={0.25} clearcoat={0.5} />
      </mesh>
      {g.sinks.map((unit) => (
        <CeramicBasin key={unit.index} config={c} unit={unit} />
      ))}
      {b.splashback ? (
        <Boards
          color={counterColor}
          stone={['porselen', 'kuvars', 'granit'].includes(c.o.tezgah)}
          roughness={0.35}
          items={[{ p: [0, top + 0.12, -depth / 2 + 0.012], s: [width, 0.24, 0.018] }]}
        />
      ) : null}
      <Boards color={railColor} metalness={0.8} roughness={0.25} items={accessoryBoards} />
      {b.towelRail ? (
        <Boards
          color={palette.fildisi.hex}
          roughness={0.95}
          items={[{ p: [width / 2 + 0.03, top - 0.29, 0.015], s: [0.012, 0.26, depth * 0.32] }]}
        />
      ) : null}
      {c.o.led.includes('alt') ? (
        <mesh position={[0, g.offset / 100 + baseHeightForLed(c), depth / 2 - 0.04]}>
          <boxGeometry args={[width - 0.055, 0.008, 0.014]} />
          <meshStandardMaterial
            color={colors.led}
            emissive={colors['led-emission']}
            emissiveIntensity={4}
          />
        </mesh>
      ) : null}
    </group>
  )
}
function baseHeightForLed(c: Config) {
  return c.o.baza === 'asma' ? 0.008 : 0.12
}
