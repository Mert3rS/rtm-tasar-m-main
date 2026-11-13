'use client'

import { lazy, Suspense, useState } from 'react'
import { colorHex, palette } from '@/lib/configurator/config'
import { kitchenGeometry, type KitchenUnit } from '@/lib/configurator/kitchen'
import { kitchenKindNames } from '@/lib/configurator/kitchenSchema'
import { fitProps, type PropPlacement } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { Boards, Front, type Board } from './CabinetParts'
import { SelectionOutline } from './SelectionOutline'
import { Countertop, KitchenHob, KitchenHood, KitchenOven, KitchenSink } from './KitchenFixtures'
import { useSceneColors } from './SceneTheme'
import type { SceneProps } from './CabinetScene'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))
type KitchenSceneProps = SceneProps & { propsReady: boolean; lowQuality: boolean }
function frame(width: number, bottom: number, height: number, depth: number): Board[] {
  if (width < 0.04) return [{ p: [0, bottom + height / 2, 0], s: [width, height, depth] }]
  return [
    { p: [-(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
    { p: [(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
    { p: [0, bottom + 0.009, 0], s: [width, 0.018, depth] },
    { p: [0, bottom + height - 0.009, 0], s: [width, 0.018, depth] },
    { p: [0, bottom + height / 2, -depth / 2 + 0.004], s: [width, height, 0.008] },
  ]
}
function Unit({
  unit,
  bottom,
  height,
  depth,
  body,
  ...props
}: KitchenSceneProps & {
  unit: KitchenUnit
  bottom: number
  height: number
  depth: number
  body: string
}) {
  const colors = useSceneColors(),
    c = props.config
  const [localOpen, setLocalOpen] = useState(false),
    [hover, setHover] = useState(false)
  const width = unit.width / 100,
    upper = unit.row === 'upper' || unit.row === 'returnUpper'
  const g = kitchenGeometry(c)
  const isOven = g.ovenUnit?.row === unit.row && g.ovenUnit.section === unit.section
  const isSink = g.sink?.row === unit.row && g.sink.section === unit.section
  const isDishwasher = g.dishwasher?.row === unit.row && g.dishwasher.section === unit.section
  const hood = upper && unit.kind === 'hood' && width >= 0.5
  const selection = props.kitchenSelection ?? { row: 'lower', index: props.selected }
  const selected = selection.row === unit.row && selection.index === unit.section
  const showInterior = props.open || localOpen || unit.kind === 'open'
  const cabinetBottom = hood ? bottom + height * 0.52 : bottom
  const cabinetHeight = hood ? height * 0.48 : height
  const boards = frame(width, cabinetBottom, cabinetHeight, depth)
  const colorKey = upper && c.o.iki ? c.o.renk2 : c.o.renk
  const doorColor = upper && c.o.iki ? palette[c.o.renk2].hex : colorHex(c.o)
  const options = { ...c.o, renk: colorKey, camt: unit.kind === 'glass' ? unit.glass : c.o.camt }
  const legacyCells = unit.row === 'lower' && !c.k?.modules ? c.r.main.g[unit.section] : undefined
  const heights = legacyCells
    ? legacyCells.h.map((value) => value / 100)
    : !upper && unit.kind === 'drawers'
      ? unit.row === 'lower' && c.r.main.g[unit.section].f.every((front) => front === 'cekmece')
        ? c.r.main.g[unit.section].h.map((value) => value / 100)
        : [height * 0.25, height * 0.375, height * 0.375]
      : [cabinetHeight]
  const shelfCount = isSink || isOven || isDishwasher || unit.kind === 'drawers' ? 0 : upper ? 2 : 1
  for (let j = 1; j <= shelfCount; j++)
    boards.push({
      p: [0, cabinetBottom + (cabinetHeight * j) / (shelfCount + 1), 0],
      s: [Math.max(0.01, width - 0.036), 0.018, depth - 0.035],
    })
  let y = cabinetBottom
  function select() {
    if (unit.section < 0) return
    props.onKitchenSelect?.({ row: unit.row, index: unit.section })
    if (!props.onKitchenSelect && unit.row === 'lower') props.onSelect(unit.section, 0)
  }
  const items: PropPlacement[] = []
  if (props.preferences.props && props.propsReady && width > 0.12 &&
    (showInterior || unit.kind === 'glass') && !isSink && !isOven && !isDishwasher) {
    if (unit.kind === 'drawers') {
      let floor = cabinetBottom
      for (const [index, drawerHeight] of heights.entries()) {
        items.push(...fitProps(productPropSets.mutfak.drawer, {
          x: 0, width: width - 0.08, bottom: floor + 0.04,
          height: drawerHeight - 0.08, depth: depth * 0.7 - 0.04,
          cell: `kitchen-drawer-${unit.row}-${unit.section}-${index}`, zone: 'drawer',
        }, props.lowQuality).map((item): PropPlacement => ({ ...item, position: [item.position[0], item.position[1], depth * 0.8] })))
        floor += drawerHeight
      }
    } else for (let level = 0; level <= shelfCount; level++) {
      const kinds = upper
        ? level === 0 ? ['plates', 'bowls'] as const : level === 1 ? ['glass', 'mug'] as const : ['jar', 'glass'] as const
        : level === 0 ? productPropSets.mutfak.bottom : productPropSets.mutfak.top
      items.push(...fitProps([...kinds], {
        x: 0, width: width - 0.036,
        bottom: cabinetBottom + cabinetHeight * level / (shelfCount + 1) + 0.018,
        height: cabinetHeight / (shelfCount + 1) - 0.04, depth: depth - 0.04,
        cell: `kitchen-${unit.row}-${unit.section}-${level}`, zone: upper ? 'top' : 'middle',
      }, props.lowQuality))
    }
  }
  return (
    <group
      position={[unit.x / 100, 0, 0]}
      name={`kitchen-${unit.row}-${unit.section}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(
          `${upper ? 'Üst' : 'Alt'} ${unit.section + 1} · ${kitchenKindNames[unit.kind]} · ${unit.width} cm`,
        )
      }}
      onPointerOut={() => {
        setHover(false)
        props.onHover('')
      }}
    >
      <Boards color={body} wood={c.o.govde === 'ahsap'} items={boards} />
      <Suspense fallback={null}>
        {items.length ? <RepresentativeProps placements={items} /> : null}
      </Suspense>
      {isOven ? (
        <KitchenOven
          width={width}
          height={bottom + height}
          base={bottom}
          depth={depth}
          onSelect={select}
        />
      ) : width >= 0.05 && unit.kind !== 'open' ? (
        heights.map((height, index) => {
          const center = y + height / 2
          y += height
          const leaves =
            !legacyCells &&
            (unit.kind === 'door' || unit.kind === 'glass' || unit.kind === 'sink') &&
            width > 0.75
              ? 2
              : 1
          return (
            <group key={index}>
              {Array.from({ length: leaves }, (_, leaf) => (
                <group
                  key={leaf}
                  position={[((leaf - (leaves - 1) / 2) * width) / leaves, 0, 0]}
                  scale={[leaves === 2 && leaf === 1 ? -1 : 1, 1, 1]}
                >
                  <Front
                    x={0}
                    y={center}
                    w={width / leaves}
                    h={height}
                    depth={depth}
                    type={
                      legacyCells?.f[index] ??
                      (unit.kind === 'glass'
                        ? 'cam'
                        : unit.kind === 'drawers'
                          ? 'cekmece'
                          : isDishwasher
                            ? 'klapa'
                            : 'kapak')
                    }
                    color={doorColor}
                    options={options}
                    handleEdge={upper ? 'bottom' : 'top'}
                    open={props.open}
                    selected={selected}
                    localOpen={localOpen}
                    onSelect={select}
                    onToggle={() => setLocalOpen((value) => !value)}
                    onHover={(active) => setHover(active)}
                  />
                </group>
              ))}
            </group>
          )
        })
      ) : null}
      {isDishwasher ? (
        <Boards
          color={palette.siyah.hex}
          roughness={0.25}
          items={[
            {
              p: [0, bottom + height - 0.025, depth / 2 + 0.024],
              s: [width - 0.025, 0.025, 0.008],
            },
          ]}
        />
      ) : null}
      {hood ? <KitchenHood width={width} height={height} bottom={bottom} depth={depth} /> : null}
      {selected || hover ? (
        <SelectionOutline
          width={Math.max(0.01, width - 0.01)}
          height={height}
          position={[0, bottom + height / 2, depth / 2 + 0.04]}
          color={colors.selection}
        />
      ) : null}
      {(c.o.led.includes('ic') || c.o.led.includes('raf')) && !isOven && !isDishwasher ? (
        <>
          {Array.from({ length: c.o.led.includes('raf') ? shelfCount + 1 : 1 }, (_, index) => (
            <mesh
              key={index}
              position={[
                0,
                cabinetBottom + cabinetHeight - 0.025 - (cabinetHeight * index) / (shelfCount + 1),
                -depth / 2 + 0.02,
              ]}
            >
              <boxGeometry args={[Math.max(0.01, width - 0.045), 0.008, 0.015]} />
              <meshStandardMaterial
                color={colors.led}
                emissive={colors['led-emission']}
                emissiveIntensity={3}
              />
            </mesh>
          ))}
          {upper && (unit.kind === 'glass' || showInterior) ? (
            <pointLight
              position={[0, cabinetBottom + cabinetHeight * 0.75, 0]}
              color={colors.led}
              intensity={0.055}
              distance={0.65}
            />
          ) : null}
        </>
      ) : null}
    </group>
  )
}
function KitchenRun({
  lower,
  upper,
  length,
  ...props
}: KitchenSceneProps & { lower: KitchenUnit[]; upper: KitchenUnit[]; length: number }) {
  const c = props.config,
    colors = useSceneColors()
  if (!c.k) return null
  const g = kitchenGeometry(c),
    depth = c.d.d / 100,
    upperDepth = g.upperDepth / 100
  const base = g.base / 100,
    height = c.d.h / 100,
    gap = c.k.gap / 100,
    upperHeight = c.k.upperHeight / 100
  const hasCounter = !['yok', 'karar'].includes(c.o.tezgah),
    top = height + (hasCounter ? 0.04 : 0),
    upperY = top + gap
  const body =
    c.o.govde === 'kapak'
      ? colorHex(c.o)
      : c.o.govde === 'beyaz'
        ? palette.beyaz.hex
        : c.o.govde === 'antrasit'
          ? palette.antrasit.hex
          : palette.mese.hex
  const sink = lower.find((unit) => unit.row === g.sink?.row && unit.section === g.sink.section)
  const hob = lower.find((unit) => unit.row === g.hob?.row && unit.section === g.hob.section)
  return (
    <group>
      {c.o.baza === 'ayak' ? (
        <Boards
          color={colors.metal}
          items={lower.flatMap((unit) =>
            [-1, 1].flatMap((x) =>
              [-1, 1].map((z): Board => ({
                p: [
                  unit.x / 100 + x * Math.max(0.01, unit.width / 200 - 0.05),
                  base / 2,
                  z * (depth / 2 - 0.05),
                ],
                s: [0.024, base, 0.024],
              })),
            ),
          )}
        />
      ) : base > 0 ? (
        <Boards
          color={palette.siyah.hex}
          items={[{ p: [0, base / 2, -0.035], s: [length, base, depth - 0.07] }]}
        />
      ) : null}
      {lower.map((unit) => (
        <Unit
          key={`${unit.row}-${unit.section}`}
          {...props}
          unit={unit}
          bottom={base}
          height={height - base}
          depth={depth}
          body={body}
        />
      ))}
      {c.o.ust ? (
        <group position={[0, 0, -(depth - upperDepth) / 2]}>
          {upper.map((unit) => (
            <Unit
              key={`${unit.row}-${unit.section}`}
              {...props}
              unit={unit}
              bottom={upperY}
              height={upperHeight}
              depth={upperDepth}
              body={body}
            />
          ))}
        </group>
      ) : null}
      {hasCounter ? (
        <Countertop
          width={length}
          depth={depth}
          height={height}
          sink={sink}
          material={c.o.tezgah}
        />
      ) : null}
      {sink ? <KitchenSink unit={sink} height={top} depth={depth} /> : null}
      {hob ? <KitchenHob unit={hob} height={top} depth={depth} /> : null}
      {c.o.ust ? (
        <Boards
          color={colors.counter}
          stone
          items={[{ p: [0, top + gap / 2, -depth / 2 + 0.012], s: [length, gap, 0.015] }]}
        />
      ) : null}
      {c.o.ust && c.o.led.includes('alt') ? (
        <>
          <mesh position={[0, upperY - 0.008, -depth / 2 + upperDepth - 0.035]}>
            <boxGeometry args={[length, 0.008, 0.018]} />
            <meshStandardMaterial
              color={colors.led}
              emissive={colors['led-emission']}
              emissiveIntensity={4}
            />
          </mesh>
          <pointLight
            position={[-length * 0.25, upperY - 0.03, -depth / 2 + upperDepth]}
            color={colors.led}
            intensity={0.18}
            distance={1.6}
          />
          <pointLight
            position={[length * 0.25, upperY - 0.03, -depth / 2 + upperDepth]}
            color={colors.led}
            intensity={0.18}
            distance={1.6}
          />
        </>
      ) : null}
      {c.o.led.includes('gola') ? (
        <mesh position={[0, height - 0.022, depth / 2 + 0.018]}>
          <boxGeometry args={[length, 0.006, 0.006]} />
          <meshStandardMaterial
            color={colors.led}
            emissive={colors['led-emission']}
            emissiveIntensity={3}
          />
        </mesh>
      ) : null}
      {c.o.led.includes('ust') ? (
        <mesh
          position={[
            0,
            c.o.ust ? upperY + upperHeight + 0.01 : height + 0.01,
            -depth / 2 + upperDepth / 2,
          ]}
        >
          <boxGeometry args={[length, 0.008, 0.018]} />
          <meshStandardMaterial
            color={colors.led}
            emissive={colors['led-emission']}
            emissiveIntensity={3}
          />
        </mesh>
      ) : null}
      {c.o.panel ? (
        <Boards
          color={body}
          items={[-1, 1].map((side) => ({
            p: [side * (length / 2 + 0.009), (height + base) / 2, 0],
            s: [0.018, height - base, depth + 0.012],
          }))}
        />
      ) : null}
    </group>
  )
}
export function KitchenCabinet(props: KitchenSceneProps) {
  const c = props.config,
    colors = useSceneColors()
  if (!c.k) return null
  const k = c.k,
    g = kitchenGeometry(c),
    width = c.d.w / 100,
    depth = c.d.d / 100,
    upperDepth = g.upperDepth / 100
  const returnWidth = g.returnWidth / 100,
    height = c.d.h / 100,
    base = g.base / 100
  const top = height + (['yok', 'karar'].includes(c.o.tezgah) ? 0 : 0.04),
    upperY = top + k.gap / 100,
    upperH = k.upperHeight / 100
  const side = k.layout === 'left' ? -1 : 1,
    body =
      c.o.govde === 'beyaz'
        ? palette.beyaz.hex
        : c.o.govde === 'ahsap'
          ? palette.mese.hex
          : colorHex(c.o)
  const cornerUpper: KitchenUnit = {
    row: 'upper',
    section: -1,
    x: 0,
    width: (depth - upperDepth) * 100,
    kind: 'door',
    glass: 'fume',
  }
  return (
    <group name="modern-kitchen" position={[0, c.o.baza === 'asma' ? 0.25 : 0, 0]}>
      <KitchenRun {...props} length={width} lower={g.modules} upper={g.upperModules} />
      {k.layout !== 'straight' ? (
        <>
          <group position={[(side * (width - depth)) / 2, 0, 0]}>
            <Boards color={body} items={frame(depth, base, height - base, depth)} />
          </group>
          <group
            position={[(side * (width - depth)) / 2, 0, depth / 2 + returnWidth / 2]}
            rotation={[0, k.layout === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
            name="kitchen-return"
          >
            <KitchenRun
              {...props}
              length={returnWidth}
              lower={g.returnModules}
              upper={g.returnUpperModules}
            />
          </group>
          {c.o.ust ? (
            <>
              <Boards
                color={colors.counter}
                stone
                items={[
                  {
                    p: [side * (width / 2 - 0.012), top + k.gap / 200, 0],
                    s: [0.015, k.gap / 100, depth],
                  },
                ]}
              />
              <group
                position={[(side * (width - depth - upperDepth)) / 2, 0, -(depth - upperDepth) / 2]}
              >
                <Unit
                  {...props}
                  unit={cornerUpper}
                  bottom={upperY}
                  height={upperH}
                  depth={upperDepth}
                  body={body}
                />
              </group>
              <group
                position={[(side * (width - upperDepth)) / 2, 0, upperDepth / 2]}
                rotation={[0, k.layout === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
              >
                <Unit
                  {...props}
                  unit={cornerUpper}
                  bottom={upperY}
                  height={upperH}
                  depth={upperDepth}
                  body={body}
                />
              </group>
            </>
          ) : null}
        </>
      ) : null}
    </group>
  )
}
