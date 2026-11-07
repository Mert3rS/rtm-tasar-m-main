'use client'

import { lazy, Suspense, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import { baseHeight, colorHex, palette, type Config } from '@/lib/configurator/config'
import { entrywayUnits, type EntrywayUnit } from '@/lib/configurator/entryway'
import { entrywayLayoutNames } from '@/lib/configurator/entrywaySchema'
import { fitProps, type PropPlacement } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { Boards, Front, type Board } from './CabinetParts'
import { SelectionOutline } from './SelectionOutline'
import { useSceneColors } from './SceneTheme'
import type { SceneProps } from './CabinetScene'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))
type EntrySceneProps = SceneProps & { lowQuality: boolean; propsReady: boolean }
function frontType(
  front: 'solid' | 'mirror' | 'glass' | 'open',
): Config['r']['main']['g'][number]['f'][number] {
  return front === 'mirror'
    ? 'ayna'
    : front === 'glass'
      ? 'cam'
      : front === 'open'
        ? 'acik'
        : 'kapak'
}

function EntryBay({
  unit,
  body,
  ...props
}: EntrySceneProps & { unit: EntrywayUnit; body: string }) {
  const c = props.config,
    entry = c.entryway,
    colors = useSceneColors()
  const [localOpen, setLocalOpen] = useState(false),
    [drawer, setDrawer] = useState<number | null>(null),
    [hover, setHover] = useState(false)
  if (!entry) return null
  const index = unit.index,
    layout = entry.layouts[index],
    width = unit.width / 100,
    depth = c.d.d / 100
  const bottom = unit.bottom / 100,
    top = unit.top / 100,
    height = top - bottom
  const accentKey = c.o.iki ? c.o.renk2 : c.o.renk,
    accent = c.o.iki ? palette[accentKey].hex : colorHex(c.o)
  const open = props.open || localOpen || unit.front === 'open' || unit.front === 'glass'
  const selected = props.selected === index,
    boards: Board[] = [],
    led: Board[] = [],
    placements: PropPlacement[] = []
  const innerDepth = depth - 0.04
  function select() {
    props.onSelect(index, 0)
  }
  function place(kind: 'bottom' | 'middle' | 'top' | 'hanging', y: number, h: number) {
    if (!props.preferences.props || !props.propsReady || !open) return
    placements.push(
      ...fitProps(
        productPropSets.portmanto[kind],
        {
          x: 0,
          width: width - 0.04,
          bottom: y,
          height: h - 0.02,
          depth: innerDepth - 0.02,
          cell: `entry-${index}-${kind}-${y}`,
          zone: kind,
        },
        props.lowQuality,
      ),
    )
  }
  const hooks = unit.zones.find((zone) => zone.kind === 'hooks'),
    drawerZone = unit.zones.find((zone) => zone.kind === 'drawers')
  for (const [zoneIndex, zone] of unit.zones.entries()) {
    const y = zone.bottom / 100,
      h = zone.height / 100
    if (zoneIndex > 0 && layout !== 'bench')
      boards.push({ p: [0, y, 0], s: [width - 0.036, 0.018, innerDepth] })
    if (zone.kind === 'shelves' || zone.kind === 'shoes') {
      for (let i = 1; i <= zone.count; i++) {
        const shelfY = y + (h * i) / (zone.count + 1)
        boards.push({ p: [0, shelfY, 0], s: [width - 0.036, 0.018, innerDepth] })
        if (c.o.led.includes('raf'))
          led.push({ p: [0, shelfY - 0.012, depth / 2 - 0.055], s: [width - 0.05, 0.008, 0.012] })
      }
      for (let i = 0; i <= Math.min(zone.count, props.lowQuality ? 0 : 2); i++)
        place(
          zone.kind === 'shoes' ? 'bottom' : 'middle',
          y + (h * i) / (zone.count + 1) + 0.018,
          h / (zone.count + 1) - 0.02,
        )
    }
    if (zone.kind === 'hanging') place('hanging', y + 0.018, h - 0.02)
  }
  if (hooks && props.preferences.props && props.propsReady) {
    const flat = fitProps(
      ['jacket', 'bag'],
      {
        x: 0,
        width: width - 0.05,
        bottom: hooks.bottom / 100,
        height: hooks.height / 100 - 0.02,
        depth: innerDepth,
        cell: `entry-hooks-${index}`,
        zone: 'middle',
      },
      props.lowQuality,
    )
    placements.push(
      ...flat.map((item): PropPlacement => ({
        ...item,
        position: [
          item.position[0],
          unit.hookY / 100 - 0.045 - item.size[1] / 2,
          -depth / 2 + item.size[2] / 2 + 0.065,
        ],
      })),
    )
  }
  if (entry.upper) {
    boards.push({ p: [0, top, 0], s: [width - 0.036, 0.018, depth - 0.025] })
    place('top', top + 0.018, entry.upperHeight / 100 - 0.02)
    if (c.o.led.includes('ust'))
      led.push({ p: [0, c.d.h / 100 - 0.025, depth / 2 - 0.045], s: [width - 0.05, 0.008, 0.012] })
  }
  if (c.o.led.includes('ic'))
    led.push({ p: [0, top - 0.025, depth / 2 - 0.055], s: [width - 0.05, 0.008, 0.012] })
  const leaves = Math.max(1, Math.ceil(unit.width / 65)),
    leafWidth = width / leaves
  const slatCount = Math.min(24, Math.floor(width / 0.045))
  const frontBottom =
    layout === 'drawers' && drawerZone ? (drawerZone.bottom + drawerZone.height) / 100 : bottom
  const hookColor = {
    siyah: palette.siyah.hex,
    beyaz: palette.beyaz.hex,
    inox: colors.metal,
    altin: colors.gold,
    bronz: colors.bronze,
  }[c.o.krenk]
  return (
    <group
      position={[unit.x / 100, 0, 0]}
      name={`entryway-bay-${index}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(`${index + 1}. bölme · ${entrywayLayoutNames[layout]} · ${unit.width} cm`)
      }}
      onPointerOut={() => {
        setHover(false)
        props.onHover('')
      }}
    >
      <Boards items={boards} color={body} wood={c.o.govde === 'ahsap'} />
      {entry.slats[index] ? (
        <Boards
          color={accent}
          wood={Boolean(palette[accentKey].wood)}
          items={Array.from({ length: slatCount }, (_, i): Board => ({
            p: [
              -width / 2 + ((i + 0.5) * width) / slatCount,
              (top + (layout === 'bench' ? entry.seatHeight / 100 : bottom)) / 2,
              -depth / 2 + 0.018,
            ],
            s: [
              (width / slatCount) * 0.56,
              top - (layout === 'bench' ? entry.seatHeight / 100 : bottom) - 0.025,
              0.018,
            ],
          }))}
        />
      ) : null}
      {hooks ? (
        <Boards
          color={hookColor}
          metalness={0.75}
          roughness={0.3}
          items={Array.from({ length: hooks.count }, (_, i): Board[] => {
            const x = -width / 2 + (width * (i + 1)) / (hooks.count + 1)
            return [
              { p: [x, unit.hookY / 100, -depth / 2 + 0.065], s: [0.01, 0.01, 0.065] },
              { p: [x, unit.hookY / 100 + 0.015, -depth / 2 + 0.095], s: [0.01, 0.035, 0.01] },
            ]
          }).flat()}
        />
      ) : null}
      {unit.zones
        .filter((zone) => zone.kind === 'hanging')
        .map((zone) => (
          <mesh
            key={zone.bottom}
            position={[0, (zone.bottom + zone.height) / 100 - 0.12, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.011, 0.011, width - 0.06, 12]} />
            <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
      {layout === 'bench' ? (
        <>
          <Boards
            color={accent}
            wood={Boolean(palette[accentKey].wood)}
            items={[
              {
                p: [0, unit.seatBoardTop / 100 - 0.015, 0.005],
                s: [width - 0.025, 0.03, depth + 0.01],
              },
            ]}
          />
          {entry.cushion ? (
            <RoundedBox
              args={[width - 0.045, 0.04, depth - 0.035]}
              position={[0, entry.seatHeight / 100 - 0.02, 0.005]}
              radius={0.017}
              smoothness={2}
              castShadow
            >
              <meshStandardMaterial
                color={
                  {
                    sand: palette.bej.hex,
                    stone: palette.kasmir.hex,
                    charcoal: palette.antrasit.hex,
                    olive: palette.adacayi.hex,
                  }[entry.cushionColor]
                }
                roughness={0.95}
              />
            </RoundedBox>
          ) : null}
          {c.o.led.includes('alt') ? (
            <mesh position={[0, unit.seatBoardTop / 100 - 0.035, depth / 2 - 0.035]}>
              <boxGeometry args={[width - 0.055, 0.008, 0.01]} />
              <meshStandardMaterial
                color={colors.led}
                emissive={colors['led-emission']}
                emissiveIntensity={3}
              />
            </mesh>
          ) : null}
        </>
      ) : null}
      {drawerZone
        ? Array.from({ length: drawerZone.count }, (_, i) => (
            <Front
              key={i}
              x={0}
              y={drawerZone.bottom / 100 + ((i + 0.5) * drawerZone.height) / drawerZone.count / 100}
              w={width - 0.04}
              h={drawerZone.height / drawerZone.count / 100}
              depth={depth}
              type="cekmece"
              color={colorHex(c.o)}
              options={{ ...c.o, kulp: 'gomme', acilim: 'mentese' }}
              open={false}
              selected={false}
              localOpen={drawer === i}
              onSelect={select}
              onToggle={() => setDrawer((value) => (value === i ? null : i))}
              onHover={setHover}
            />
          ))
        : null}
      <Suspense fallback={null}>
        {placements.length ? <RepresentativeProps placements={placements} /> : null}
      </Suspense>
      {unit.front !== 'open'
        ? Array.from({ length: leaves }, (_, leaf) => (
            <group
              key={leaf}
              position={[(leaf - (leaves - 1) / 2) * leafWidth, 0, 0]}
              scale={[leaf % 2 ? -1 : 1, 1, 1]}
            >
              <Front
                x={0}
                y={(frontBottom + top) / 2}
                w={leafWidth}
                h={top - frontBottom}
                depth={depth}
                type={frontType(unit.front)}
                color={colorHex(c.o)}
                options={{ ...c.o, camt: entry.glass[index], acilim: 'mentese' }}
                longHandle
                open={props.open}
                selected={false}
                localOpen={localOpen}
                onSelect={select}
                onToggle={() => setLocalOpen((value) => !value)}
                onHover={setHover}
              />
              {entry.upper ? (
                <Front
                  x={0}
                  y={top + entry.upperHeight / 200}
                  w={leafWidth}
                  h={entry.upperHeight / 100}
                  depth={depth}
                  type={unit.front === 'glass' ? 'cam' : 'kapak'}
                  color={colorHex(c.o)}
                  options={{ ...c.o, camt: entry.glass[index], acilim: 'mentese' }}
                  open={props.open}
                  selected={false}
                  localOpen={localOpen}
                  onSelect={select}
                  onToggle={() => setLocalOpen((value) => !value)}
                  onHover={setHover}
                />
              ) : null}
            </group>
          ))
        : null}
      {selected || hover ? (
        <SelectionOutline
          width={width - 0.015}
          height={height}
          position={[0, (bottom + top) / 2, depth / 2 + 0.04]}
          color={colors.selection}
        />
      ) : null}
      {led.map((item, i) => (
        <mesh key={i} position={item.p}>
          <boxGeometry args={item.s} />
          <meshStandardMaterial
            color={colors.led}
            emissive={colors['led-emission']}
            emissiveIntensity={3}
          />
        </mesh>
      ))}
      {c.o.led.includes('ic') && open ? (
        <pointLight
          position={[0, top - 0.04, depth / 2 - 0.08]}
          color={colors.led}
          intensity={0.1}
          distance={1.4}
        />
      ) : null}
    </group>
  )
}
export function EntrywayCabinet(props: EntrySceneProps) {
  const c = props.config,
    colors = useSceneColors()
  if (!c.entryway) return null
  const width = c.d.w / 100,
    height = c.d.h / 100,
    depth = c.d.d / 100,
    base = baseHeight(c) / 100
  const body =
    c.o.govde === 'beyaz'
      ? palette.beyaz.hex
      : c.o.govde === 'ahsap'
        ? palette.mese.hex
        : c.o.govde === 'antrasit'
          ? palette.antrasit.hex
          : colorHex(c.o)
  const boards: Board[] = [
    { p: [-(width - 0.018) / 2, (height + base) / 2, 0], s: [0.018, height - base, depth] },
    { p: [(width - 0.018) / 2, (height + base) / 2, 0], s: [0.018, height - base, depth] },
    { p: [0, height - 0.009, 0], s: [width, 0.018, depth] },
    { p: [0, base + 0.009, 0], s: [width, 0.018, depth] },
    { p: [0, (height + base) / 2, -depth / 2 + 0.004], s: [width, height - base, 0.008] },
  ]
  let x = -width / 2
  c.r.main.w.slice(0, -1).forEach((w) => {
    x += w / 100
    boards.push({ p: [x, (height + base) / 2, 0], s: [0.018, height - base, depth] })
  })
  return (
    <group name="modern-entryway">
      <Boards items={boards} color={body} wood={c.o.govde === 'ahsap'} />
      {base > 0 ? (
        <Boards
          color={c.o.baza === 'ayak' ? colors.metal : palette.siyah.hex}
          metalness={c.o.baza === 'ayak' ? 0.75 : 0}
          items={
            c.o.baza === 'ayak'
              ? [-1, 1].flatMap((side) =>
                  [-1, 1].map((z): Board => ({
                    p: [side * (width / 2 - 0.06), base / 2, z * (depth / 2 - 0.05)],
                    s: [0.03, base, 0.03],
                  })),
                )
              : [{ p: [0, base / 2, -0.025], s: [width - 0.04, base, depth - 0.06] }]
          }
        />
      ) : null}
      {entrywayUnits(c).map((unit) => (
        <EntryBay key={unit.index} {...props} unit={unit} body={body} />
      ))}
      {c.o.panel ? (
        <Boards
          color={body}
          items={[{ p: [0, height + 0.009, 0], s: [width + 0.025, 0.018, depth + 0.015] }]}
        />
      ) : null}
    </group>
  )
}
