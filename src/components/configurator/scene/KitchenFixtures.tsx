'use client'

import type { Config } from '@/lib/configurator/config'
import { palette } from '@/lib/configurator/config'
import type { KitchenUnit } from '@/lib/configurator/kitchen'
import { Boards, type Board } from './CabinetParts'
import { useSceneColors } from './SceneTheme'

export function Countertop({
  width,
  depth,
  height,
  sink,
  material,
}: {
  width: number
  depth: number
  height: number
  sink?: KitchenUnit
  material: Config['o']['tezgah']
}) {
  const colors = useSceneColors()
  const color =
    material === 'masif'
      ? palette.mese.hex
      : material === 'granit'
        ? palette.antrasit.hex
        : material === 'compact'
          ? palette.siyah.hex
          : material === 'laminat'
            ? palette.krem.hex
            : colors.counter
  const items: Board[] = []
  if (sink) {
    const x = sink.x / 100,
      sw = Math.min(0.52, sink.width / 100 - 0.08),
      sd = Math.min(0.38, depth - 0.12)
    const left = x - sw / 2 + width / 2,
      right = width / 2 - x - sw / 2
    if (left > 0)
      items.push({
        p: [-width / 2 + left / 2, height + 0.02, 0.015],
        s: [left, 0.04, depth + 0.04],
      })
    if (right > 0)
      items.push({
        p: [width / 2 - right / 2, height + 0.02, 0.015],
        s: [right, 0.04, depth + 0.04],
      })
    const back = (depth - sd) / 2,
      front = (depth + 0.06 - sd) / 2
    items.push(
      { p: [x, height + 0.02, -sd / 2 - back / 2], s: [sw, 0.04, back] },
      { p: [x, height + 0.02, sd / 2 + front / 2], s: [sw, 0.04, front] },
    )
  } else items.push({ p: [0, height + 0.02, 0.015], s: [width, 0.04, depth + 0.04] })
  return (
    <Boards
      items={items}
      color={color}
      wood={material === 'masif'}
      stone={material === 'kuvars' || material === 'porselen' || material === 'granit'}
      roughness={material === 'porselen' ? 0.28 : 0.5}
    />
  )
}
export function KitchenSink({
  unit,
  height,
  depth,
}: {
  unit: KitchenUnit
  height: number
  depth: number
}) {
  const colors = useSceneColors(),
    sw = Math.min(0.52, unit.width / 100 - 0.08),
    sd = Math.min(0.38, depth - 0.12)
  return (
    <group position={[unit.x / 100, height, 0]} name="kitchen-sink">
      <Boards
        color={colors.metal}
        metalness={0.85}
        roughness={0.3}
        items={[
          { p: [0, -0.145, 0], s: [sw, 0.012, sd] },
          { p: [-sw / 2, -0.07, 0], s: [0.008, 0.15, sd] },
          { p: [sw / 2, -0.07, 0], s: [0.008, 0.15, sd] },
          { p: [0, -0.07, -sd / 2], s: [sw, 0.15, 0.008] },
          { p: [0, -0.07, sd / 2], s: [sw, 0.15, 0.008] },
        ]}
      />
      <mesh position={[0, -0.133, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.025, 20]} />
        <meshStandardMaterial color={palette.siyah.hex} />
      </mesh>
      <mesh position={[0, 0.13, -sd / 2 - 0.035]}>
        <cylinderGeometry args={[0.011, 0.014, 0.26, 16]} />
        <meshStandardMaterial color={colors.metal} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.26, -sd / 2 + 0.025]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.06, 0.011, 8, 24, Math.PI]} />
        <meshStandardMaterial color={colors.metal} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.24, -sd / 2 + 0.085]}>
        <cylinderGeometry args={[0.011, 0.011, 0.04, 16]} />
        <meshStandardMaterial color={colors.metal} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.3, 12]} />
        <meshStandardMaterial color={colors.drawer} roughness={0.6} />
      </mesh>
    </group>
  )
}
export function KitchenHob({
  unit,
  height,
  depth,
}: {
  unit: KitchenUnit
  height: number
  depth: number
}) {
  const colors = useSceneColors()
  return (
    <group position={[unit.x / 100, height + 0.006, 0.015]} name="kitchen-hob">
      <Boards
        color={palette.siyah.hex}
        roughness={0.12}
        items={[{ p: [0, 0, 0], s: [Math.min(0.57, unit.width / 100 - 0.04), 0.012, depth - 0.1] }]}
      />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x * 0.12, 0.008, z * (depth - 0.1) * 0.24]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.065, 0.068, 32]} />
            <meshStandardMaterial color={colors.metal} roughness={0.5} />
          </mesh>
        )),
      )}
    </group>
  )
}
export function KitchenOven({
  width,
  height,
  depth,
  base,
  onSelect,
}: {
  width: number
  height: number
  depth: number
  base: number
  onSelect: () => void
}) {
  const colors = useSceneColors()
  return (
    <group
      name="kitchen-oven"
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <Boards
        color={colors.metal}
        metalness={0.8}
        roughness={0.25}
        items={[
          {
            p: [0, (height + base) / 2, depth / 2 + 0.007],
            s: [width - 0.018, height - base - 0.02, 0.025],
          },
        ]}
      />
      <Boards
        color={palette.siyah.hex}
        roughness={0.18}
        items={[
          {
            p: [0, base + (height - base) * 0.46, depth / 2 + 0.023],
            s: [width - 0.045, (height - base) * 0.7, 0.012],
          },
          { p: [0, height - 0.066, depth / 2 + 0.023], s: [width - 0.045, 0.085, 0.012] },
        ]}
      />
      <Boards
        color={colors.metal}
        roughness={0.3}
        items={[{ p: [0, height - 0.145, depth / 2 + 0.055], s: [width * 0.72, 0.018, 0.025] }]}
      />
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          position={[sign * width * 0.29, height - 0.066, depth / 2 + 0.035]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.017, 0.017, 0.018, 16]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}
export function KitchenHood({
  width,
  height,
  bottom,
  depth,
}: {
  width: number
  height: number
  bottom: number
  depth: number
}) {
  const colors = useSceneColors()
  return (
    <group name="kitchen-hood">
      <Boards
        color={colors.metal}
        roughness={0.4}
        items={[
          { p: [0, bottom + 0.02, 0], s: [width - 0.025, 0.04, depth + 0.08] },
          {
            p: [0, bottom + height * 0.26, -depth * 0.17],
            s: [width * 0.48, height * 0.46, depth * 0.6],
          },
        ]}
      />
      <mesh position={[0, bottom + height * 0.16, depth * 0.03]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[width * 0.3, width * 0.54, height * 0.27, 4]} />
        <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.45} />
      </mesh>
    </group>
  )
}
