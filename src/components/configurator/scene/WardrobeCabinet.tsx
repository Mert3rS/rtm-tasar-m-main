'use client'

import { lazy, Suspense, useState } from 'react'
import { baseHeight, colorHex, palette, type Config } from '@/lib/configurator/config'
import {
  wardrobeUnits,
  wardrobeSlidingPanels,
  type WardrobeUnit,
} from '@/lib/configurator/wardrobe'
import { wardrobeLayoutNames } from '@/lib/configurator/wardrobeSchema'
import { fitProps, type PropPlacement } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { Boards, Front, type Board } from './CabinetParts'
import { SelectionOutline } from './SelectionOutline'
import { useSceneColors } from './SceneTheme'
import type { SceneProps } from './CabinetScene'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))
type WardrobeSceneProps = SceneProps & { lowQuality: boolean; propsReady: boolean }
function face(
  door: 'solid' | 'mirror' | 'glass' | 'open',
): Config['r']['main']['g'][number]['f'][number] {
  return door === 'mirror' ? 'ayna' : door === 'glass' ? 'cam' : door === 'open' ? 'acik' : 'kapak'
}

function WardrobeBay({
  unit,
  body,
  ...props
}: WardrobeSceneProps & { unit: WardrobeUnit; body: string }) {
  const colors = useSceneColors(),
    c = props.config,
    wd = c.wardrobe
  const [localOpen, setLocalOpen] = useState(false),
    [drawer, setDrawer] = useState<number | null>(null),
    [hover, setHover] = useState(false)
  if (!wd) return null
  const index = unit.index,
    width = unit.width / 100,
    depth = c.d.d / 100,
    sliding = c.o.acilim === 'surgulu'
  const innerDepth = depth - (sliding ? 0.06 : 0.025),
    z = sliding ? -0.03 : -0.0125
  const open =
    props.open || localOpen || sliding || wd.doors[index] === 'open' || wd.doors[index] === 'glass'
  const selected = props.selected === index
  const boards: Board[] = [],
    ledBoards: Board[] = [],
    placements: PropPlacement[] = []
  const base = unit.bottom / 100,
    height = unit.height / 100
  function select() {
    props.onSelect(index, 0)
  }
  function place(kind: 'hanging' | 'middle' | 'bottom' | 'top', bottom: number, h: number) {
    if (!props.preferences.props || !props.propsReady || !open) return
    const kinds =
      kind === 'hanging'
        ? h > 1.35
          ? ['coat' as const]
          : ['shirt' as const]
        : productPropSets.gardirop[kind]
    placements.push(
      ...fitProps(
        kinds,
        {
          x: 0,
          width: width - 0.036,
          bottom,
          height: h - 0.018,
          depth: innerDepth - 0.04,
          cell: `${index}-${kind}-${bottom}`,
          zone: kind,
        },
        props.lowQuality,
      ).map((item): PropPlacement => ({
        ...item,
        position: [item.position[0], item.position[1], z],
      })),
    )
  }
  const rods = unit.zones.filter((zone) => zone.kind === 'rail')
  const drawerZone = unit.zones.find((zone) => zone.kind === 'drawers')
  unit.zones.forEach((zone, zoneIndex) => {
    const bottom = zone.bottom / 100,
      h = zone.height / 100
    if (zoneIndex > 0) {
      boards.push({ p: [0, bottom, z], s: [width - 0.036, 0.018, innerDepth - 0.015] })
      if (c.o.led.includes('raf'))
        ledBoards.push({
          p: [0, bottom - 0.012, -depth / 2 + 0.025],
          s: [width - 0.05, 0.008, 0.015],
        })
    }
    if (zone.kind === 'shelves' || zone.kind === 'shoes') {
      for (let shelf = 1; shelf <= zone.count; shelf++) {
        const y = bottom + (h * shelf) / (zone.count + 1)
        boards.push({ p: [0, y, z], s: [width - 0.036, 0.018, innerDepth - 0.02] })
        if (c.o.led.includes('raf'))
          ledBoards.push({ p: [0, y - 0.012, -depth / 2 + 0.025], s: [width - 0.05, 0.008, 0.015] })
      }
      for (let shelf = 0; shelf <= Math.min(zone.count, props.lowQuality ? 1 : 10); shelf++)
        place(
          zone.kind === 'shoes' ? 'bottom' : 'middle',
          bottom + (h * shelf) / (zone.count + 1) + 0.018,
          h / (zone.count + 1) - 0.018,
        )
    }
    if (zone.kind === 'rail') place('hanging', bottom + 0.018, h - 0.018)
    if (zone.kind === 'trousers') place('middle', bottom + h - 0.16, 0.16)
    if (zone.kind === 'drawers' && drawer !== null && props.preferences.props && props.propsReady) {
      placements.push(...fitProps(productPropSets.gardirop.drawer, {
        x: 0, width: width - 0.08, bottom: bottom + h * drawer / zone.count + 0.04,
        height: h / zone.count - 0.07, depth: innerDepth * 0.7 - 0.07,
        cell: `wardrobe-drawer-${index}-${drawer}`, zone: 'drawer',
      }, props.lowQuality).map((item): PropPlacement => ({ ...item, position: [item.position[0], item.position[1], innerDepth * 0.8 - 0.07] })))
    }
  })
  if (wd.loft) {
    const bottom = (c.d.h - wd.loftHeight) / 100
    boards.push({ p: [0, bottom, z], s: [width - 0.036, 0.018, innerDepth] })
    if (c.o.led.includes('raf'))
      ledBoards.push({
        p: [0, bottom - 0.012, -depth / 2 + 0.025],
        s: [width - 0.05, 0.008, 0.015],
      })
    place('top', bottom + 0.018, wd.loftHeight / 100 - 0.018)
    if (c.o.led.includes('ust'))
      ledBoards.push({
        p: [0, c.d.h / 100 - 0.025, -depth / 2 + 0.025],
        s: [width - 0.05, 0.008, 0.015],
      })
  }
  if (!wd.loft && c.o.led.includes('ust'))
    ledBoards.push({
      p: [0, c.d.h / 100 - 0.025, -depth / 2 + 0.025],
      s: [width - 0.05, 0.008, 0.015],
    })
  if (c.o.led.includes('ic'))
    for (const side of [-1, 1])
      ledBoards.push({
        p: [side * (width / 2 - 0.025), base + height / 2, -depth / 2 + 0.035],
        s: [0.008, height - 0.04, 0.015],
      })
  const leaves = Math.max(1, Math.ceil(unit.width / 65)),
    leafWidth = width / leaves
  const color = c.o.iki && !wd.loft && index % 2 ? palette[c.o.renk2].hex : colorHex(c.o)
  return (
    <group
      position={[unit.x / 100, 0, 0]}
      name={`wardrobe-bay-${index}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(
          `${index + 1}. bölme · ${wardrobeLayoutNames[wd.layouts[index]]} · ${unit.width} cm`,
        )
      }}
      onPointerOut={() => {
        setHover(false)
        props.onHover('')
      }}
    >
      <Boards color={body} wood={c.o.govde === 'ahsap'} items={boards} />
      {rods.map((zone, i) => (
        <mesh
          key={i}
          position={[0, (zone.bottom + zone.height) / 100 - 0.12, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.011, 0.011, width - 0.055, 12]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {unit.zones
        .filter((zone) => zone.kind === 'trousers')
        .map((zone) => (
          <Boards
            key={zone.bottom}
            color={colors.metal}
            metalness={0.8}
            roughness={0.3}
            items={Array.from({ length: Math.min(8, Math.floor(width / 0.08)) }, (_, i) => ({
              p: [-width / 2 + 0.06 + i * 0.08, (zone.bottom + zone.height) / 100 - 0.09, z],
              s: [0.008, 0.008, innerDepth - 0.09],
            }))}
          />
        ))}
      {drawerZone
        ? Array.from({ length: drawerZone.count }, (_, i) => (
            <Front
              key={i}
              x={0}
              y={drawerZone.bottom / 100 + ((i + 0.5) * drawerZone.height) / drawerZone.count / 100}
              w={width - 0.045}
              h={drawerZone.height / drawerZone.count / 100}
              depth={innerDepth - 0.035}
              zOffset={z - 0.025}
              type="cekmece"
              color={body}
              options={{ ...c.o, kulp: 'gomme', krenk: 'inox', acilim: 'mentese' }}
              open={false}
              selected={false}
              localOpen={drawer === i}
              onSelect={select}
              onToggle={() => setDrawer((value) => (value === i ? null : i))}
              onHover={() => {}}
            />
          ))
        : null}
      <Suspense fallback={null}>
        {placements.length ? <RepresentativeProps placements={placements} /> : null}
      </Suspense>
      {!sliding ? (
        <>
          {Array.from({ length: leaves }, (_, leaf) => (
            <group
              key={leaf}
              position={[(leaf - (leaves - 1) / 2) * leafWidth, 0, 0]}
              scale={[leaf % 2 ? -1 : 1, 1, 1]}
            >
              <Front
                x={0}
                y={base + height / 2}
                w={leafWidth}
                h={height}
                depth={depth}
                type={face(wd.doors[index])}
                color={color}
                options={{ ...c.o, camt: wd.glass[index], acilim: 'mentese' }}
                longHandle
                open={props.open}
                selected={false}
                localOpen={localOpen}
                onSelect={select}
                onToggle={() => setLocalOpen((value) => !value)}
                onHover={setHover}
              />
              {wd.loft ? (
                <Front
                  x={0}
                  y={(c.d.h - wd.loftHeight / 2) / 100}
                  w={leafWidth}
                  h={wd.loftHeight / 100}
                  depth={depth}
                  type="kapak"
                  color={c.o.iki ? palette[c.o.renk2].hex : colorHex(c.o)}
                  options={{ ...c.o, renk: c.o.iki ? c.o.renk2 : c.o.renk, acilim: 'mentese' }}
                  open={props.open}
                  selected={false}
                  localOpen={localOpen}
                  onSelect={select}
                  onToggle={() => setLocalOpen((value) => !value)}
                  onHover={setHover}
                />
              ) : null}
            </group>
          ))}
        </>
      ) : null}
      {selected || hover ? (
        <SelectionOutline
          width={width - 0.015}
          height={height - 0.01}
          position={[0, base + height / 2, depth / 2 + 0.045]}
          color={colors.selection}
        />
      ) : null}
      {ledBoards.map((item, i) => (
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
          position={[0, base + height * 0.68, -depth / 2 + 0.14]}
          color={colors.led}
          intensity={0.09}
          distance={1.3}
        />
      ) : null}
    </group>
  )
}
function SlidingDoors(props: WardrobeSceneProps) {
  const c = props.config,
    wd = c.wardrobe,
    colors = useSceneColors()
  const [opened, setOpened] = useState<Set<number>>(() => new Set())
  if (!wd) return null
  const width = c.d.w / 100,
    height = (c.d.h - baseHeight(c)) / 100,
    base = baseHeight(c) / 100
  return (
    <group name="wardrobe-sliding-doors">
      <Boards
        color={colors.metal}
        metalness={0.75}
        items={[-1, 1].map((edge) => ({
          p: [0, base + (edge === 1 ? height : 0), c.d.d / 200 - 0.02],
          s: [width, 0.016, 0.065],
        }))}
      />
      {wardrobeSlidingPanels(c).map((panel) => {
        const { index, x, door } = panel
        const target = props.open ? panel.stackX : panel.localX
        return (
          <Front
            key={index}
            x={x}
            y={base + height / 2}
            w={panel.width}
            h={height}
            depth={c.d.d / 100}
            zOffset={panel.zOffset}
            slideOffset={target - x}
            type={face(door)}
            color={c.o.iki && index % 2 ? palette[c.o.renk2].hex : colorHex(c.o)}
            options={{ ...c.o, camt: wd.slidingGlass[index], acilim: 'surgulu' }}
            longHandle
            open={props.open}
            selected={false}
            localOpen={opened.has(index)}
            onSelect={() => props.onSelect(panel.bay, 0)}
            onToggle={() =>
              setOpened((current) => {
                const next = new Set(current)
                if (next.has(index)) next.delete(index)
                else next.add(index)
                return next
              })
            }
            onHover={(active) => props.onHover(active ? `${index + 1}. sürgü paneli` : '')}
          />
        )
      })}
    </group>
  )
}
export function WardrobeCabinet(props: WardrobeSceneProps) {
  const c = props.config,
    colors = useSceneColors(),
    wd = c.wardrobe
  if (!wd) return null
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
    <group name="modern-wardrobe">
      <Boards color={body} wood={c.o.govde === 'ahsap'} items={boards} />
      {base > 0 ? (
        <Boards
          color={c.o.baza === 'ayak' ? colors.metal : palette.siyah.hex}
          metalness={c.o.baza === 'ayak' ? 0.75 : 0}
          items={
            c.o.baza === 'ayak'
              ? [-1, 1].flatMap((side) =>
                  [-1, 1].map((z): Board => ({
                    p: [side * (width / 2 - 0.06), base / 2, z * (depth / 2 - 0.06)],
                    s: [0.03, base, 0.03],
                  })),
                )
              : [{ p: [0, base / 2, -0.035], s: [width - 0.04, base, depth - 0.08] }]
          }
        />
      ) : null}
      {wardrobeUnits(c).map((unit) => (
        <WardrobeBay key={unit.index} {...props} unit={unit} body={body} />
      ))}
      {c.o.acilim === 'surgulu' ? <SlidingDoors {...props} /> : null}
      {c.o.panel ? (
        <Boards
          color={body}
          items={[{ p: [0, height + 0.009, 0], s: [width + 0.025, 0.018, depth + 0.02] }]}
        />
      ) : null}
    </group>
  )
}
