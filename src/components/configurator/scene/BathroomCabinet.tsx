'use client'

import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { baseHeight, colorHex, palette, type Config } from '@/lib/configurator/config'
import { bathroomGeometry, type BathroomUnit } from '@/lib/configurator/bathroom'
import { bathroomKindNames } from '@/lib/configurator/bathroomSchema'
import { fitProps, type PropPlacement } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { Boards, Front, mirrorSurfaceTexture, type Board } from './CabinetParts'
import { BathroomFixtures } from './BathroomFixtures'
import { SelectionOutline } from './SelectionOutline'
import { useSceneColors } from './SceneTheme'
import type { SceneProps } from './CabinetScene'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))
type BathroomSceneProps = SceneProps & { lowQuality: boolean; propsReady: boolean }

function BathroomBay({ unit, ...props }: BathroomSceneProps & { unit: BathroomUnit }) {
  const c = props.config,
    b = c.bathroom,
    colors = useSceneColors()
  const [localOpen, setLocalOpen] = useState(false),
    [drawer, setDrawer] = useState<number | null>(null),
    [hover, setHover] = useState(false)
  if (!b) return null
  const upper = unit.row === 'upper',
    width = unit.width / 100,
    height = unit.height / 100,
    bottom = unit.bottom / 100,
    depth = unit.depth / 100
  const faceKey = upper && c.o.iki ? c.o.renk2 : c.o.renk,
    faceColor = upper && c.o.iki ? palette[faceKey].hex : colorHex(c.o)
  const body =
    c.o.govde === 'beyaz'
      ? palette.beyaz.hex
      : c.o.govde === 'ahsap'
        ? palette.mese.hex
        : c.o.govde === 'antrasit'
          ? palette.antrasit.hex
          : faceColor
  const selected =
    (props.bathroomSelection?.row ?? 'lower') === unit.row &&
    (props.bathroomSelection?.index ?? props.selected) === unit.index
  const open = props.open || localOpen || unit.kind === 'open' || unit.kind === 'glass'
  const sinkDrawers = unit.kind === 'sink' && b.sinkFront === 'drawers',
    isDrawers = sinkDrawers || unit.kind === 'drawers'
  const boards: Board[] = [],
    led: Board[] = [],
    placements: PropPlacement[] = []
  function select() {
    props.onBathroomSelect?.({ row: unit.row, index: unit.index })
  }
  if (unit.kind !== 'washer') {
    boards.push(
      { p: [-(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
      { p: [(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
      { p: [0, bottom + 0.009, 0], s: [width - 0.036, 0.018, depth] },
    )
    // Keep the service zone behind the basin open and the counter opening unobstructed.
    if (unit.kind !== 'sink')
      boards.push({
        p: [0, bottom + height / 2, -depth / 2 + 0.004],
        s: [width - 0.036, height, 0.008],
      })
    if (upper) boards.push({ p: [0, bottom + height - 0.009, 0], s: [width - 0.036, 0.018, depth] })
    if (!isDrawers && unit.kind !== 'sink')
      for (let i = 1; i <= unit.shelves; i++) {
        const y = bottom + (height * i) / (unit.shelves + 1)
        boards.push({ p: [0, y, 0], s: [width - 0.036, 0.018, depth - 0.025] })
        if (c.o.led.includes('raf'))
          led.push({ p: [0, y - 0.012, depth / 2 - 0.025], s: [width - 0.06, 0.006, 0.01] })
      }
    if (props.preferences.props && props.propsReady && open && !isDrawers && unit.kind !== 'sink')
      for (let i = 0; i <= Math.min(unit.shelves, props.lowQuality ? 0 : 2); i++)
        placements.push(
          ...fitProps(
            upper ? productPropSets.banyo.middle : productPropSets.banyo.top,
            {
              x: 0,
              width: width - 0.04,
              bottom: bottom + (height * i) / (unit.shelves + 1) + 0.02,
              height: height / (unit.shelves + 1) - 0.02,
              depth: depth - 0.04,
              cell: `bath-${unit.row}-${unit.index}-${i}`,
              zone: 'middle',
            },
            props.lowQuality,
          ),
        )
  }
  if (upper && c.o.led.includes('ic'))
    led.push({
      p: [0, bottom + height - 0.025, depth / 2 - 0.025],
      s: [width - 0.055, 0.008, 0.012],
    })
  if (upper && b.mirrorLed && unit.kind === 'mirror')
    for (const side of [-1, 1])
      led.push({
        p: [side * (width / 2 - 0.025), bottom + height / 2, depth / 2 + 0.025],
        s: [0.008, height - 0.055, 0.006],
      })
  const options = { ...c.o, renk: faceKey, ral: upper && c.o.iki ? '' : c.o.ral, camt: unit.glass }
  const doorType = unit.kind === 'mirror' ? 'ayna' : unit.kind === 'glass' ? 'cam' : 'kapak'
  const leaves = Math.ceil(unit.width / 65)
  return (
    <group
      position={[unit.x / 100, 0, unit.z / 100]}
      name={`bathroom-${unit.row}-${unit.index}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(
          `${upper ? 'Üst' : 'Alt'} ${unit.index + 1} · ${bathroomKindNames[unit.kind]} · ${unit.width} cm`,
        )
      }}
      onPointerOut={() => {
        setHover(false)
        props.onHover('')
      }}
    >
      <Boards
        items={boards}
        color={body}
        wood={c.o.govde === 'ahsap' || (c.o.govde === 'kapak' && Boolean(palette[faceKey].wood))}
      />
      {isDrawers
        ? Array.from({ length: unit.drawers }, (_, i) => (
            <Front
              key={i}
              x={0}
              y={bottom + (height * (i + 0.5)) / unit.drawers}
              w={width - 0.025}
              h={height / unit.drawers}
              depth={depth}
              type="cekmece"
              color={faceColor}
              options={options}
              open={props.open}
              selected={false}
              localOpen={drawer === i}
              plumbingCutout={sinkDrawers && i === unit.drawers - 1}
              onSelect={select}
              onToggle={() => setDrawer((value) => (value === i ? null : i))}
              onHover={setHover}
            />
          ))
        : unit.kind !== 'open' && unit.kind !== 'washer'
          ? Array.from({ length: leaves }, (_, i) => (
              <group
                key={i}
                position={[((i - (leaves - 1) / 2) * width) / leaves, 0, 0]}
                scale={[i % 2 ? -1 : 1, 1, 1]}
              >
                <Front
                  x={0}
                  y={bottom + height / 2}
                  w={width / leaves}
                  h={height}
                  depth={depth}
                  type={doorType}
                  softMirror={upper}
                  tintedGlass
                  color={faceColor}
                  options={options}
                  open={props.open}
                  selected={false}
                  localOpen={localOpen}
                  onSelect={select}
                  onToggle={() => setLocalOpen((value) => !value)}
                  onHover={setHover}
                />
              </group>
            ))
          : null}
      {unit.kind === 'washer' ? (
        <>
          <Boards
            color={palette.beyaz.hex}
            roughness={0.28}
            items={[{ p: [0, bottom + height / 2, 0], s: [width - 0.025, height, depth - 0.035] }]}
          />
          <mesh
            position={[0, bottom + height * 0.46, depth / 2 + 0.005]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.18, 0.025, 12, 36]} />
            <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh
            position={[0, bottom + height * 0.46, depth / 2 + 0.006]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.155, 0.155, 0.014, 32]} />
            <meshPhysicalMaterial color={palette.antrasit.hex} roughness={0.12} clearcoat={1} />
          </mesh>
        </>
      ) : null}
      <Suspense fallback={null}>
        {placements.length ? <RepresentativeProps placements={placements} /> : null}
      </Suspense>
      {selected || hover ? (
        <SelectionOutline
          width={width - 0.01}
          height={height - 0.01}
          position={[0, bottom + height / 2, depth / 2 + 0.04]}
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
      {upper && c.o.led.includes('ic') && open ? (
        <pointLight
          position={[0, bottom + height - 0.03, depth / 2]}
          color={colors.led}
          intensity={0.08}
          distance={0.9}
        />
      ) : null}
    </group>
  )
}
function WallMirror({ config: c, unit }: { config: Config; unit: BathroomUnit }) {
  const colors = useSceneColors(),
    b = c.bathroom
  const texture = useMemo(() => mirrorSurfaceTexture(), [])
  useEffect(() => () => texture.dispose(), [texture])
  const width =
      Math.min(unit.width * 0.85, b?.mirrorShape === 'round' ? unit.height : unit.height * 0.8) /
      100,
    height = b?.mirrorShape === 'round' ? width : unit.height / 100
  const geometry = useMemo(() => {
    const shape = new Shape(),
      r = b?.mirrorShape === 'rectangle' ? 0.025 : Math.min(width / 2, height / 2)
    if (b?.mirrorShape === 'round') shape.absarc(0, 0, width / 2, 0, Math.PI * 2, false)
    else if (b?.mirrorShape === 'capsule') {
      shape.moveTo(r, height / 2 - r)
      shape.absarc(0, height / 2 - r, r, 0, Math.PI, false)
      shape.lineTo(-r, -height / 2 + r)
      shape.absarc(0, -height / 2 + r, r, Math.PI, Math.PI * 2, false)
      shape.closePath()
    } else {
      shape.moveTo(-width / 2 + r, -height / 2)
      shape.lineTo(width / 2 - r, -height / 2)
      shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + r)
      shape.lineTo(width / 2, height / 2 - r)
      shape.quadraticCurveTo(width / 2, height / 2, width / 2 - r, height / 2)
      shape.lineTo(-width / 2 + r, height / 2)
      shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - r)
      shape.lineTo(-width / 2, -height / 2 + r)
      shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + r, -height / 2)
    }
    const geo = new ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false, curveSegments: 32 })
    const uv = geo.getAttribute('uv')
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) + width / 2) / width, (uv.getY(i) + height / 2) / height)
    return geo
  }, [width, height, b?.mirrorShape])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group
      position={[unit.x / 100, unit.bottom / 100 + unit.height / 200, -c.d.d / 200 + 0.035]}
      name="bathroom-wall-mirror"
    >
      {b?.mirrorLed ? (
        <mesh geometry={geometry} scale={[1.035, 1.025, 1]} position={[0, 0, -0.01]}>
          <meshStandardMaterial
            color={colors.led}
            emissive={colors['led-emission']}
            emissiveIntensity={3}
          />
        </mesh>
      ) : null}
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={colors.metal}
          map={texture}
          emissiveMap={texture}
          emissive={colors.light}
          emissiveIntensity={0.55}
          metalness={1}
          roughness={0.045}
          envMapIntensity={1.4}
          clearcoat={1}
        />
      </mesh>
    </group>
  )
}
export function BathroomCabinet(props: BathroomSceneProps) {
  const c = props.config,
    b = c.bathroom,
    colors = useSceneColors(),
    g = bathroomGeometry(c)
  if (!b) return null
  const base = baseHeight(c) / 100,
    width = c.d.w / 100,
    depth = c.d.d / 100
  const countertopProps: PropPlacement[] = []
  if (props.preferences.props && props.propsReady) {
    const first = g.sinks[0],
      leftEdge = first.x - Math.min(54, first.width - 12) / 2,
      free = leftEdge + c.d.w / 2
    if (free > 14)
      countertopProps.push(
        ...fitProps(
          productPropSets.banyo.middle,
          {
            x: (-c.d.w / 2 + free / 2) / 100,
            width: (free - 4) / 100,
            bottom: g.counter / 100 + 0.005,
            height: 0.3,
            depth: depth - 0.12,
            cell: 'bathroom-counter-accessories',
            zone: 'middle',
          },
          props.lowQuality,
        ),
      )
  }
  return (
    <group name="modern-bathroom">
      {base > 0 ? (
        <Boards
          color={c.o.baza === 'ayak' ? colors.metal : palette.siyah.hex}
          metalness={c.o.baza === 'ayak' ? 0.8 : 0}
          items={
            c.o.baza === 'ayak'
              ? [-1, 1].flatMap((side) =>
                  [-1, 1].map((z): Board => ({
                    p: [side * (width / 2 - 0.055), base / 2, z * (depth / 2 - 0.045)],
                    s: [0.025, base, 0.025],
                  })),
                )
              : [{ p: [0, base / 2, -0.025], s: [width - 0.03, base, depth - 0.06] }]
          }
        />
      ) : null}
      {g.lower.map((unit) => (
        <BathroomBay key={`lower-${unit.index}`} {...props} unit={unit} />
      ))}
      {b.upperEnabled
        ? g.upper.map((unit) => <BathroomBay key={`upper-${unit.index}`} {...props} unit={unit} />)
        : g.sinks.map((unit) => (
            <WallMirror
              key={unit.index}
              config={c}
              unit={{ ...unit, bottom: g.counter + b.gap, height: b.upperHeight }}
            />
          ))}
      <BathroomFixtures config={c} />
      <Suspense fallback={null}>
        {countertopProps.length ? <RepresentativeProps placements={countertopProps} /> : null}
      </Suspense>
    </group>
  )
}
