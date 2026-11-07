'use client'

import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three'
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

function BathroomBay({ unit, framed = false, standalone = false, ...props }: BathroomSceneProps & { unit: BathroomUnit; framed?: boolean; standalone?: boolean }) {
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
        ? palette['acik-mese'].hex
        : c.o.govde === 'antrasit'
          ? palette.antrasit.hex
          : faceColor
  const selected = !standalone &&
    (props.bathroomSelection?.row ?? 'lower') === unit.row &&
    (props.bathroomSelection?.index ?? props.selected) === unit.index
  const open = props.open || localOpen || unit.kind === 'open' || unit.kind === 'glass'
  const sinkDrawers = unit.kind === 'sink' && b.sinkFront === 'drawers',
    isDrawers = sinkDrawers || unit.kind === 'drawers'
  const boards: Board[] = [],
    led: Board[] = [],
    placements: PropPlacement[] = []
  function select() {
    if (!standalone) props.onBathroomSelect?.({ row: unit.row, index: unit.index })
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
      for (let i = 0; i <= Math.min(unit.shelves, props.lowQuality ? 1 : 4); i++)
        placements.push(
          ...fitProps(
            (i % 2 === 0 && (!upper || depth >= 0.29))
              ? productPropSets.banyo.top : productPropSets.banyo.middle,
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
  if (props.preferences.props && props.propsReady && isDrawers) {
    for (let i = 0; i < unit.drawers; i++) {
      if (!props.open && drawer !== i) continue
      if (sinkDrawers && i === unit.drawers - 1) continue
      placements.push(...fitProps(productPropSets.banyo.drawer, {
        x: 0, width: width - 0.08, bottom: bottom + height * i / unit.drawers + 0.04,
        height: height / unit.drawers - 0.07, depth: depth * 0.7 - 0.04,
        cell: `bath-drawer-${unit.index}-${i}`, zone: 'drawer',
      }, props.lowQuality).map((item): PropPlacement => ({ ...item, position: [item.position[0], item.position[1], depth * 0.8] })))
    }
  }
  if (props.preferences.props && props.propsReady && open && unit.kind === 'sink' && !sinkDrawers) {
    placements.push(...fitProps(productPropSets.banyo.top, {
      x: 0, width: width - 0.04, bottom: bottom + 0.02,
      height: Math.min(0.24, height * 0.5), depth: depth - 0.06,
      cell: `bath-sink-storage-${unit.index}`, zone: 'bottom',
    }, props.lowQuality))
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
  const leaves = Math.ceil(unit.width / 65),
    inset = framed ? 0.036 : 0
  return (
    <group
      position={[unit.x / 100, 0, unit.z / 100]}
      name={standalone ? 'bathroom-tall-cabinet' : `bathroom-${unit.row}-${unit.index}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(
          standalone ? `Boy dolabı · ${unit.width} × ${unit.height} cm` : `${upper ? 'Üst' : 'Alt'} ${unit.index + 1} · ${bathroomKindNames[unit.kind]} · ${unit.width} cm`,
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
      {framed && unit.kind === 'open' ? <>
        <Boards color={palette.antrasit.hex} roughness={0.85} items={[
          { p: [0, bottom + height / 2, -depth / 2 + 0.012], s: [width - 0.036, height - 0.036, 0.01] },
          ...Array.from({ length: unit.shelves + 1 }, (_, i): Board => ({
            p: [0, bottom + 0.02 + height * i / (unit.shelves + 1), 0.005],
            s: [width - 0.036, 0.012, depth - 0.025],
          })),
          ...[-1, 1].map((sign): Board => ({ p: [sign * (width / 2 - 0.022), bottom + height / 2, 0], s: [0.009, height - 0.036, depth - 0.025] })),
        ]} />
      </> : null}
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
                position={[((i - (leaves - 1) / 2) * (width - inset)) / leaves, 0, 0]}
                scale={[i % 2 ? -1 : 1, 1, 1]}
              >
                <Front
                  x={0}
                  y={bottom + height / 2}
                  w={(width - inset) / leaves}
                  h={height - inset}
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
function bathroomReflection() {
  // A local, illustrative room reflection; no extra render pass or remote image.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const light = ctx.createLinearGradient(0, 0, 512, 512)
    light.addColorStop(0, '#e4e3df')
    light.addColorStop(1, '#a8aaa4')
    ctx.fillStyle = light
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#222624'
    ctx.fillRect(0, 0, 186, 365)
    for (let y = 20; y < 350; y += 12) {
      ctx.fillStyle = '#e6e6df'
      ctx.fillRect(0, y, 168, 5)
    }
    ctx.fillStyle = '#858780'
    ctx.fillRect(338, 0, 5, 512)
    for (const x of [300, 408]) {
      ctx.fillStyle = '#eae9e3'
      ctx.beginPath()
      ctx.moveTo(x, 300)
      ctx.lineTo(x + 20, 278)
      ctx.lineTo(x + 45, 302)
      ctx.lineTo(x + 53, 490)
      ctx.lineTo(x - 9, 490)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#cecec6'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + 20, 295)
      ctx.lineTo(x + 25, 478)
      ctx.stroke()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
function WallMirror({ config: c, unit }: { config: Config; unit: BathroomUnit }) {
  const colors = useSceneColors(),
    b = c.bathroom
  const reference = Boolean(b?.sideCabinet)
  const texture = useMemo(() => reference ? bathroomReflection() : mirrorSurfaceTexture(), [reference])
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
          color={reference ? palette.beyaz.hex : colors.metal}
          map={texture}
          emissiveMap={texture}
          emissive={colors.light}
          emissiveIntensity={reference ? 0.35 : 0.55}
          metalness={reference ? 0.2 : 1}
          roughness={0.09}
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
        <BathroomBay key={`lower-${unit.index}`} {...props} unit={unit} framed={Boolean(b.sideCabinet)} />
      ))}
      {b.upperEnabled
        ? g.upper.map((unit) => <BathroomBay key={`upper-${unit.index}`} {...props} unit={unit} />)
        : g.sinks.map((unit) => (
            <WallMirror
              key={unit.index}
              config={c}
              unit={{ ...unit, ...(b.sideCabinet && g.sinks.length === 1 ? { x: 0, width: c.d.w } : {}), bottom: g.counter + b.gap, height: b.upperHeight }}
            />
          ))}
      {g.sideCabinet ? <BathroomBay {...props} unit={g.sideCabinet} framed standalone /> : null}
      <BathroomFixtures config={c} />
      <Suspense fallback={null}>
        {countertopProps.length ? <RepresentativeProps placements={countertopProps} /> : null}
      </Suspense>
    </group>
  )
}
