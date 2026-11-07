'use client'

import {
  memo,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  Environment,
  ContactShadows,
  Lightformer,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei'
import {
  OrthographicCamera as ThreeOrthographicCamera,
  Vector3,
  ACESFilmicToneMapping,
  Shape,
  DoubleSide,
  type DirectionalLight,
} from 'three'
import { baseHeight, colorHex, palette, type Config } from '@/lib/configurator/config'

import { Boards, Front, type Board } from './CabinetParts'
import { KitchenCabinet } from './KitchenCabinet'
import { WardrobeCabinet } from './WardrobeCabinet'
import { TvCabinet } from './TvCabinet'
import { tvGeometry, tvFocus } from '@/lib/configurator/tv'
import type { TvSelection } from '@/lib/configurator/tvSchema'
import { BathroomCabinet } from './BathroomCabinet'
import { bathroomGeometry, bathroomFocus } from '@/lib/configurator/bathroom'
import type { BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { EntrywayCabinet } from './EntrywayCabinet'
import { entrywayFocus } from '@/lib/configurator/entryway'
import { wardrobeFocus } from '@/lib/configurator/wardrobe'
import { kitchenHeight, kitchenCameraFocus } from '@/lib/configurator/kitchen'
import type { KitchenSelection } from '@/lib/configurator/kitchenSchema'
import { SelectionOutline } from './SelectionOutline'
import { MeasurementLines } from './MeasurementLines'
import { HUMAN_HEIGHT, humanProfile } from '@/lib/configurator/humanProfile'
import { contrastInk, luminance, type ScenePreferences } from '@/lib/configurator/scenePreferences'
import { layoutProps, shelfCount, type PropPlacement } from '@/lib/configurator/props/layout'
import { Html } from '@react-three/drei'
import { AdaptiveQuality, StudioAtmosphere } from './StudioAtmosphere'
import { SceneThemeContext, useSceneColors, useSceneTheme } from './SceneTheme'
import { useReducedMotion } from '../useReducedMotion'
import { useMobileStudio } from '../useMobileStudio'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))

export type SceneProps = {
  config: Config
  preferences: ScenePreferences
  selected: number
  cell: number
  onSelect: (s: number, c: number) => void
  open: boolean
  human: boolean
  front: boolean
  zoom: number
  reset: number
  dimensions: boolean
  onBoundary: (index: number, delta: number) => void
  onError: () => void
  onHover: (label: string) => void
  onReady: () => void
  kitchenSelection?: KitchenSelection
  onKitchenSelect?: (selection: KitchenSelection) => void
  kitchenFocus?: boolean
  wardrobeFocus?: boolean
  entrywayFocus?: boolean
  tvFocus?: boolean
  tvSelection?: TvSelection
  onTvSelect?: (selection: TvSelection) => void
  bathroomFocus?: boolean
  bathroomSelection?: BathroomSelection
  onBathroomSelect?: (selection: BathroomSelection) => void
}
const thickness = 0.018
const humanExtrusion = { depth: 0.025, bevelEnabled: false }

function CameraRig({
  front,
  zoom,
  reset,
  w,
  h,
  centerZ = 0,
  side = 1,
  centerX = 0,
  centerY,
}: {
  front: boolean
  zoom: number
  reset: number
  w: number
  h: number
  centerZ?: number
  side?: number
  centerX?: number
  centerY?: number
}) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { get, camera, invalidate, size } = useThree()
  const reduced = useReducedMotion()
  const goal = useRef<Vector3 | null>(null)
  const initialized = useRef(false)
  const manuallyMoved = useRef(false)
  const previousReset = useRef(reset)
  const previousZoom = useRef(zoom)
  const previousFront = useRef(front)
  const previousSize = useRef(`${size.width}:${size.height}`)
  const previousPlan = useRef(`${centerZ}:${side}`)
  const targetY = centerY ?? h * 0.5
  useFrame((_, delta) => {
    const camera = get().camera
    if (!goal.current || camera.position.distanceTo(goal.current) < 0.002) {
      if (goal.current) {
        camera.position.copy(goal.current)
        goal.current = null
      }
      return
    }
    camera.position.lerp(goal.current, reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 10))
    camera.lookAt(centerX, targetY, centerZ)
    ref.current?.update()
    invalidate()
  })
  useEffect(() => {
    const camera = get().camera
    const resized = previousSize.current !== `${size.width}:${size.height}`
    const planChanged = previousPlan.current !== `${centerX}:${targetY}:${centerZ}:${side}`
    previousPlan.current = `${centerX}:${targetY}:${centerZ}:${side}`
    const requested = previousReset.current !== reset
    const adjusted = previousZoom.current !== zoom || previousFront.current !== front
    previousReset.current = reset
    previousZoom.current = zoom
    previousFront.current = front
    previousSize.current = `${size.width}:${size.height}`
    if (requested || resized || planChanged) manuallyMoved.current = false
    if (manuallyMoved.current && !requested && !resized && !adjusted) return
    const distance =
      ((Math.max(h, (w * size.height) / Math.max(size.width, 1)) / (2 * Math.tan(Math.PI / 10))) *
        1.38) /
      zoom
    const position = new Vector3(
      centerX + (front ? 0 : distance * 0.52 * side),
      targetY + (front ? 0 : distance * 0.15),
      distance + centerZ,
    )
    if (!initialized.current || reduced || front) {
      camera.position.copy(position)
      initialized.current = true
      goal.current = null
    } else goal.current = position
    camera.lookAt(centerX, targetY, centerZ)
    if (camera instanceof ThreeOrthographicCamera) {
      camera.zoom = Math.min(size.width / (w * 1.3), size.height / (h * 1.38)) * zoom
      camera.updateProjectionMatrix()
    }
    if (ref.current) {
      ref.current.target.set(centerX, targetY, centerZ)
      ref.current.update()
    }
    invalidate()
  }, [
    get,
    camera,
    front,
    zoom,
    reset,
    w,
    h,
    centerZ,
    centerX,
    targetY,
    side,
    size.width,
    size.height,
    invalidate,
    reduced,
  ])
  return (
    <OrbitControls
      ref={ref}
      onStart={() => {
        manuallyMoved.current = true
        goal.current = null
      }}
      makeDefault
      enableDamping={!reduced}
      dampingFactor={0.12}
      enableRotate={!front}
      enablePan={false}
      minAzimuthAngle={-Math.PI * 0.44}
      maxAzimuthAngle={Math.PI * 0.44}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2 + 0.04}
      minDistance={0.8}
      maxDistance={20}
    />
  )
}
function Cabinet(props: SceneProps & { lowQuality: boolean; propsReady: boolean }) {
  const colors = useSceneColors()
  const { config: c, selected, cell, onSelect, open } = props
  const [hover, setHover] = useState<string | null>(null)
  const [openCells, setOpenCells] = useState<Set<string>>(() => new Set())
  const placements = useMemo(
    () => (props.preferences.props && props.propsReady ? layoutProps(c, props.lowQuality) : []),
    [c, props.preferences.props, props.propsReady, props.lowQuality],
  )
  const visiblePlacements = useMemo(
    () =>
      placements
        .filter((p) => {
          if (p.cell === 'surface') return true
          const [s, i] = p.cell.split('-').map(Number)
          return open || c.r.main.g[s].f[i] === 'acik' || openCells.has(`${c.m}-${p.cell}`)
        })
        .map((p): PropPlacement => {
          if (p.cell === 'surface') return p
          const [s, i] = p.cell.split('-').map(Number)
          return c.r.main.g[s].f[i] === 'cekmece'
            ? { ...p, position: [p.position[0], p.position[1], (c.d.d / 100) * 0.8] }
            : p
        }),
    [placements, c, open, openCells],
  )
  const get = useThree((state) => state.get)
  const hoverFrame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(hoverFrame.current), [])
  function controlsEnabled(enabled: boolean) {
    const controls = get().controls
    if (controls && 'enabled' in controls) controls.enabled = enabled
  }
  const w = c.d.w / 100,
    h = c.d.h / 100,
    d = c.d.d / 100,
    b = baseHeight(c) / 100
  const wood = palette[c.o.renk].wood || c.o.malz === 'Ahşap kaplama'
  const doorColor = colorHex(c.o)
  const bodyColor =
    c.o.govde === 'kapak'
      ? doorColor
      : c.o.govde === 'beyaz'
        ? palette['kirik-beyaz'].hex
        : c.o.govde === 'ahsap'
          ? palette.mese.hex
          : palette.antrasit.hex
  const built = useMemo(() => {
    const boards: Board[] = [
      { p: [-w / 2 + thickness / 2, (h + b) / 2, 0], s: [thickness, h - b, d] },
      { p: [w / 2 - thickness / 2, (h + b) / 2, 0], s: [thickness, h - b, d] },
      { p: [0, h - thickness / 2, 0], s: [w, thickness, d] },
      { p: [0, b + thickness / 2, 0], s: [w, thickness, d] },
      { p: [0, (h + b) / 2, -d / 2 + 0.004], s: [w, h - b, 0.008] },
    ]
    if (c.o.baza === 'b8' || c.o.baza === 'b12')
      boards.push({ p: [0, b / 2, 0.015], s: [w - 0.06, b, d - 0.06] })
    if (c.o.baza === 'ayak')
      for (const x of [-w / 2 + 0.05, w / 2 - 0.05])
        for (const z of [-d / 2 + 0.05, d / 2 - 0.05])
          boards.push({ p: [x, b / 2, z], s: [0.035, b, 0.035] })
    const cells: {
      x: number
      y: number
      w: number
      h: number
      s: number
      i: number
      bottom: number
    }[] = []
    let x = -w / 2
    c.r.main.w.forEach((width, s) => {
      const sw = width / 100
      let y = b
      if (s > 0)
        boards.push({
          p: [x, (h + b) / 2, 0],
          s: [c.r.main.ay[s - 1] ? 0.036 : thickness, h - b, d],
        })
      const g = c.r.main.g[s]
      g.h.forEach((height, i) => {
        const ch = height / 100
        cells.push({ x: x + sw / 2, y: y + ch / 2, w: sw - thickness, h: ch, s, i, bottom: y })
        if (i > 0) boards.push({ p: [x + sw / 2, y, 0], s: [sw - thickness, thickness, d - 0.02] })
        if (g.ic[i] === 'raf' || g.ic[i] === 'ayakkabi') {
          const count = shelfCount(g.ic[i], g.rf[i], ch)
          for (let j = 1; j <= count; j++)
            boards.push({
              p: [x + sw / 2, y + (ch * j) / (count + 1), 0],
              s: [sw - thickness, thickness, d - 0.04],
            })
        }
        if (g.ic[i] === 'sepet')
          for (let j = 0; j < 6; j++)
            boards.push({
              p: [x + sw / 2, y + 0.06 + j * 0.015, 0.04],
              s: [sw - 0.05, 0.005, d - 0.1],
            })
        if (g.ic[i] === 'pantolonluk')
          for (let j = 0; j < 5; j++)
            boards.push({
              p: [x + 0.06 + (j * (sw - 0.12)) / 4, y + ch - 0.07, 0],
              s: [0.008, 0.008, d - 0.12],
            })
        y += ch
      })
      x += sw
    })
    if (c.o.panel) {
      boards.push(
        { p: [-w / 2 - 0.012, (h + b) / 2, 0.005], s: [0.018, h - b + 0.018, d + 0.02] },
        { p: [0, h + 0.01, 0], s: [w + 0.04, 0.018, d + 0.02] },
      )
    }
    return { boards, cells }
  }, [c, w, h, d, b])
  const drag = useRef<{ x: number; index: number; delta: number } | null>(null)
  function boundaryX(e: ThreeEvent<PointerEvent>) {
    const t = (d / 2 + 0.04 - e.ray.origin.z) / e.ray.direction.z
    return e.ray.origin.x + t * e.ray.direction.x
  }
  function boundaryUp(e: ThreeEvent<PointerEvent>) {
    if (!drag.current) return
    const delta = drag.current.delta
    if (Number.isFinite(delta)) props.onBoundary(drag.current.index, delta)
    drag.current = null
    cancelAnimationFrame(hoverFrame.current)
    controlsEnabled(true)
    props.onHover('')
    e.stopPropagation()
    if (
      e.target &&
      'releasePointerCapture' in e.target &&
      typeof e.target.releasePointerCapture === 'function'
    )
      e.target.releasePointerCapture(e.pointerId)
  }
  return (
    <group position={[0, c.o.baza === 'asma' ? 0.25 : 0, 0]}>
      <Boards
        items={built.boards}
        color={bodyColor}
        wood={Boolean(wood || c.o.govde === 'ahsap')}
      />
      {Math.abs(luminance(props.preferences.wall ?? colors.wall) - luminance(bodyColor)) < 0.12 ? (
        <SelectionOutline
          width={w}
          height={h}
          position={[0, h / 2, d / 2 + 0.025]}
          color={
            contrastInk(props.preferences.wall ?? colors.wall) === 'dark'
              ? colors['ink-shadow']
              : colors.light
          }
        />
      ) : null}
      <Suspense fallback={null}>
        {visiblePlacements.length ? <RepresentativeProps placements={visiblePlacements} /> : null}
      </Suspense>
      {built.cells.map((item) => {
        const { s, i } = item,
          g = c.r.main.g[s],
          isSelected = selected === s && cell === i
        const id = `${s}-${i}`
        const shelves =
          g.ic[i] === 'raf'
            ? g.rf[i] === -1
              ? Math.min(10, Math.max(0, Math.floor(item.h / 0.35) - 1))
              : g.rf[i]
            : 0
        return (
          <group key={id}>
            <mesh
              position={[item.x, item.y, d / 2 - 0.025]}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(s, i)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHover(id)
                props.onHover(
                  `${s + 1}. bölme · ${i + 1}. göz · ${Math.round(item.h * 10000) / 100} cm`,
                )
              }}
              onPointerOut={() => {
                setHover(null)
                props.onHover('')
              }}
            >
              <boxGeometry args={[item.w - 0.02, item.h - 0.02, 0.006]} />
              <meshBasicMaterial
                color={colors.selection}
                transparent
                opacity={isSelected ? 0.09 : hover === id ? 0.055 : 0}
                depthWrite={false}
              />
            </mesh>
            {g.ic[i] === 'aski' ? (
              <mesh
                position={[item.x, item.y + item.h / 2 - 0.12, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.012, 0.012, item.w - 0.03, 10]} />
                <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.3} />
              </mesh>
            ) : null}
            {c.o.led.includes('ic') || c.o.led.includes('raf')
              ? Array.from({ length: c.o.led.includes('raf') ? shelves + 1 : 1 }, (_, j) => (
                  <mesh
                    key={j}
                    position={[
                      item.x,
                      item.bottom + (item.h * (j + 1)) / (shelves + 1) - 0.018,
                      -d / 2 + 0.025,
                    ]}
                  >
                    <boxGeometry args={[item.w - 0.04, 0.008, 0.018]} />
                    <meshStandardMaterial
                      color={colors.led}
                      emissive={colors['led-emission']}
                      emissiveIntensity={3}
                    />
                  </mesh>
                ))
              : null}
            {isSelected || hover === id ? (
              <SelectionOutline
                width={item.w - 0.015}
                height={item.h - 0.015}
                position={[item.x, item.y, d / 2 + 0.04]}
                color={colors.selection}
              />
            ) : null}
            <Front
              x={item.x}
              y={item.y}
              w={item.w}
              h={item.h}
              depth={d}
              type={g.f[i]}
              color={c.o.iki && s % 2 === 1 ? palette[c.o.renk2].hex : doorColor}
              options={c.o}
              localOpen={openCells.has(`${c.m}-${id}`)}
              onToggle={() =>
                setOpenCells((current) => {
                  const next = new Set(current)
                  const key = `${c.m}-${id}`
                  if (next.has(key)) next.delete(key)
                  else next.add(key)
                  return next
                })
              }
              open={open}
              selected={isSelected}
              onSelect={() => onSelect(s, i)}
              onHover={(active) => {
                setHover(active ? id : null)
                props.onHover(
                  active
                    ? `${s + 1}. bölme · ${i + 1}. göz · ${Math.round(item.h * 10000) / 100} cm`
                    : '',
                )
              }}
            />
          </group>
        )
      })}
      {c.o.led.length > 0 ? (
        <pointLight
          position={[0, h * 0.65, d * 0.2]}
          color={colors.led}
          intensity={0.4}
          distance={h * 1.2}
        />
      ) : null}
      {c.o.led.includes('alt') ? (
        <>
          <mesh position={[0, 0.01, d / 2 - 0.06]}>
            <boxGeometry args={[w - 0.08, 0.008, 0.015]} />
            <meshStandardMaterial emissive={colors['led-emission']} emissiveIntensity={4} />
          </mesh>
          <pointLight
            position={[0, 0.035, d / 2]}
            color={colors.led}
            intensity={0.35}
            distance={2}
          />
        </>
      ) : null}
      {c.o.led.includes('ust') ? (
        <mesh position={[0, h + 0.025, 0]}>
          <boxGeometry args={[w - 0.04, 0.01, 0.025]} />
          <meshStandardMaterial emissive={colors['led-emission']} emissiveIntensity={3} />
        </mesh>
      ) : null}
      {c.o.ust ? (
        <Boards color={bodyColor} items={[{ p: [0, h + 0.25, -d * 0.1], s: [w, 0.45, d * 0.8] }]} />
      ) : null}
      {(c.m === 'mutfak' || c.m === 'banyo') && c.o.tezgah !== 'yok' && c.o.tezgah !== 'karar' ? (
        <Boards
          color={
            c.o.tezgah === 'masif'
              ? palette.mese.hex
              : c.o.tezgah === 'compact'
                ? palette.antrasit.hex
                : colors.counter
          }
          wood={c.o.tezgah === 'masif'}
          items={[{ p: [0, h + 0.025, 0.015], s: [w + 0.04, 0.04, d + 0.05] }]}
        />
      ) : null}
      {c.r.main.w.slice(0, -1).map((_, i) => {
        const x = -w / 2 + c.r.main.w.slice(0, i + 1).reduce((a, b) => a + b, 0) / 100
        return (
          <mesh
            key={i}
            visible={selected === i}
            position={[x, h * 0.5, d / 2 + 0.04]}
            onPointerDown={(e) => {
              e.stopPropagation()
              drag.current = { x: boundaryX(e), index: i, delta: 0 }
              if (c.r.main.lk[i] || c.r.main.lk[i + 1]) {
                props.onBoundary(i, 0)
                drag.current = null
                return
              }
              controlsEnabled(false)
              if (
                e.target &&
                'setPointerCapture' in e.target &&
                typeof e.target.setPointerCapture === 'function'
              )
                e.target.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!drag.current || drag.current.index !== i) return
              e.stopPropagation()
              const startWidth = c.r.main.w[i]
              const rightWidth = c.r.main.w[i + 1]
              let delta = Math.round((boundaryX(e) - drag.current.x) * 200) / 2
              const equal = (rightWidth - startWidth) / 2
              const neighbors = c.r.main.w.flatMap((width) => [
                width - startWidth,
                rightWidth - width,
              ])
              const target = [equal, ...neighbors].find((value) => Math.abs(value - delta) < 1)
              if (target !== undefined) delta = Math.round(target * 2) / 2
              drag.current.delta = Number.isFinite(delta) ? delta : 0
              const label = `${Math.round((startWidth + drag.current.delta) * 100) / 100} cm ↔ ${Math.round((rightWidth - drag.current.delta) * 100) / 100} cm${target !== undefined ? ' · Hizalandı' : ''}`
              cancelAnimationFrame(hoverFrame.current)
              hoverFrame.current = requestAnimationFrame(() => props.onHover(label))
            }}
            onPointerUp={boundaryUp}
            onPointerCancel={() => {
              drag.current = null
              cancelAnimationFrame(hoverFrame.current)
              props.onHover('')
              controlsEnabled(true)
            }}
          >
            <boxGeometry args={[0.025, h - b, 0.025]} />
            <meshBasicMaterial color={colors.selection} transparent opacity={0.65} />
          </mesh>
        )
      })}
    </group>
  )
}
function Human({ x, wall }: { x: number; wall: string }) {
  const colors = useSceneColors()
  const ink = contrastInk(wall) === 'dark' ? colors['ink-shadow'] : colors.light
  const edgeInk = contrastInk(wall) === 'dark' ? colors.light : colors['ink-shadow']
  const silhouette = useMemo(() => {
    const shape = new Shape()
    humanProfile.forEach(([x, y], i) => {
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
    shape.closePath()
    return shape
  }, [])
  const points = useMemo(
    () =>
      new Float32Array([
        -0.37,
        0,
        0.06,
        -0.37,
        HUMAN_HEIGHT,
        0.06,
        -0.42,
        0,
        0.06,
        -0.32,
        0,
        0.06,
        -0.42,
        HUMAN_HEIGHT,
        0.06,
        -0.32,
        HUMAN_HEIGHT,
        0.06,
      ]),
    [],
  )
  const outline = useMemo(
    () => new Float32Array(humanProfile.flatMap(([x, y]) => [x, y, 0.027])),
    [],
  )
  return (
    <group position={[x, 0, 0.1]} name="human-scale-180cm">
      <mesh>
        <extrudeGeometry args={[silhouette, humanExtrusion]} />
        <meshBasicMaterial color={ink} side={DoubleSide} toneMapped={false} />
      </mesh>
      <lineLoop renderOrder={9}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outline, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={edgeInk} toneMapped={false} depthTest={false} />
      </lineLoop>
      <lineSegments renderOrder={10}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={ink} depthTest={false} toneMapped={false} />
      </lineSegments>
      <Html center position={[-0.37, 0.9, 0.06]} style={{ pointerEvents: 'none' }}>
        <span className="dc-measure-label" data-human-scale>
          180 cm
        </span>
      </Html>
    </group>
  )
}
function Room({ depth, preferences }: { depth: number; preferences: ScenePreferences }) {
  const colors = useSceneColors()
  return (
    <>
      <Boards
        room
        wood={preferences.textured}
        repeat={[18, 5]}
        color={preferences.floor ?? colors.floor}
        items={[{ p: [0, -0.035, 0], s: [30, 0.06, 30] }]}
      />
      <Boards
        room
        plaster
        color={preferences.wall ?? colors.wall}
        items={[{ p: [0, 5, -depth / 2 - 0.06], s: [30, 10, 0.08] }]}
      />
      <Boards
        color={colors['ink-shadow']}
        items={[{ p: [0, 0.04, -depth / 2 + 0.005], s: [30, 0.08, 0.025] }]}
      />
    </>
  )
}
const StudioEnvironment = memo(function StudioEnvironment({
  mirrored = false,
}: {
  mirrored?: boolean
}) {
  const colors = useSceneColors()
  return (
    <Environment
      key={`${mirrored}-${colors.wall}`}
      resolution={64}
      frames={1}
      environmentIntensity={0.35}
    >
      {mirrored ? (
        <>
          <Lightformer form="box" scale={[24, 18, 24]} intensity={0.65} color={colors.light} />
          <Lightformer
            position={[0, -5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[24, 24, 1]}
            intensity={0.6}
            color={colors.floor}
          />
          <Lightformer
            position={[1.8, 1.5, 5]}
            scale={[1.5, 6, 1]}
            intensity={2.2}
            color={colors.light}
          />
        </>
      ) : null}
      <Lightformer position={[-3, 4, 3]} scale={[5, 5, 1]} intensity={2} color={colors.light} />
      <Lightformer
        position={[4, 3, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[4, 4, 1]}
        intensity={1.5}
      />
    </Environment>
  )
})
function SceneContent({
  lowQuality,
  onSlow,
  ...props
}: SceneProps & { lowQuality: boolean; onSlow: () => void }) {
  const colors = useSceneColors()
  const { config: c } = props
  const kitchenTarget =
    props.kitchenFocus && c.k
      ? kitchenCameraFocus(c, props.kitchenSelection ?? { row: 'lower', index: props.selected })
      : undefined
  const focus =
    kitchenTarget ??
    (props.wardrobeFocus && c.wardrobe ? wardrobeFocus(c, props.selected) : undefined) ??
    (props.entrywayFocus && c.entryway ? entrywayFocus(c, props.selected) : undefined) ??
    (props.bathroomFocus && c.bathroom ? bathroomFocus(c, props.bathroomSelection ?? { row: 'lower', index: 0 }) : undefined) ??
    (props.tvFocus && c.tvUnit ? tvFocus(c, props.tvSelection ?? { row: 'lower', index: 0 }) : undefined)
  const [propsReady, setPropsReady] = useState(false)
  const readyFrame = useRef(0)
  const propsScheduled = useRef(false)
  // Schedule the import after a rendered WebGL frame, rather than racing the first draw.
  useFrame(() => {
    if (propsScheduled.current) return
    propsScheduled.current = true
    readyFrame.current = requestAnimationFrame(() => setPropsReady(true))
  })
  useEffect(() => {
    return () => {
      cancelAnimationFrame(readyFrame.current)
      propsScheduled.current = false
    }
  }, [])
  const { onError } = props
  const gl = useThree((s) => s.gl)
  const keyLight = useRef<DirectionalLight>(null)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    const light = keyLight.current
    if (light?.shadow.map) {
      light.shadow.map.dispose()
      light.shadow.map = null
    }
    invalidate()
  }, [lowQuality, invalidate])
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      onError()
    }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onError])
  return (
    <>
      <StudioAtmosphere />
      <AdaptiveQuality onSlow={onSlow} />
      <StudioEnvironment
        mirrored={
          c.bathroom ? !c.bathroom.upperEnabled || c.bathroom.upper.t.includes('mirror') : c.entryway ? c.entryway.fronts.includes('mirror') : c.wardrobe
            ? (c.o.acilim === 'surgulu' ? c.wardrobe.slidingDoors : c.wardrobe.doors).includes(
                'mirror',
              )
            : c.r.main.g.some((group) => group.f.includes('ayna'))
        }
      />
      <directionalLight
        ref={keyLight}
        position={[-3, 6, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={lowQuality ? [512, 512] : [1024, 1024]}
        shadow-radius={3}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[4, 3, 1]} intensity={0.65} />
      {props.front ? (
        <OrthographicCamera
          makeDefault
          position={[0, 1, 5]}
          zoom={Math.min(180, (500 / Math.max(c.d.w, c.d.h)) * 100) * props.zoom}
        />
      ) : (
        <PerspectiveCamera makeDefault fov={36} />
      )}
      <CameraRig
        centerX={focus?.x}
        centerY={focus?.y}
        front={props.front}
        zoom={props.zoom}
        reset={props.reset}
        centerZ={focus?.z ?? (c.k && c.k.layout !== 'straight' ? (c.k.length - c.d.d) / 200 : 0)}
        side={c.k?.layout === 'right' ? -1 : 1}
        w={
          focus?.width ??
          c.d.w / 100 +
            (c.k && c.k.layout !== 'straight' ? c.k.length / 130 : c.d.d / 200) +
            (props.human ? 1.1 : 0) +
            (props.dimensions ? 0.3 : 0)
        }
        h={
          focus?.height ??
          Math.max(
            (c.tvUnit ? tvGeometry(c).top : c.bathroom ? bathroomGeometry(c).top : c.k ? kitchenHeight(c) : c.d.h) / 100 +
              (c.m === 'tv' && !c.tvUnit && props.preferences.props
                ? Math.min(c.o.tv * 0.02214, (c.d.w / 100) * 0.75) * 0.58 + 0.04
                : 0),
            props.human ? 1.8 : 0,
          )
        }
      />
      <Room depth={c.d.d / 100} preferences={props.preferences} />
      <ContactShadows
        key={`${c.m}-${c.d.w}-${c.d.h}-${c.d.d}-${c.o.baza}`}
        position={[0, 0.002, 0]}
        opacity={0.25}
        scale={Math.max(5, c.d.w / 60)}
        blur={2.5}
        far={c.d.h / 100 + 0.5}
        resolution={lowQuality ? 128 : 256}
        frames={1}
        color={colors['ink-shadow']}
      />
      {c.tvUnit ? (
        <TvCabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      ) : c.bathroom ? (
        <BathroomCabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      ) : c.entryway ? (
        <EntrywayCabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      ) : c.wardrobe ? (
        <WardrobeCabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      ) : c.k ? (
        <KitchenCabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      ) : (
        <Cabinet {...props} lowQuality={lowQuality} propsReady={propsReady} />
      )}
      {props.dimensions ? (
        <MeasurementLines
          width={c.d.w / 100}
          height={(c.tvUnit ? tvGeometry(c).top : c.bathroom ? bathroomGeometry(c).top : c.k ? kitchenHeight(c) : c.d.h) / 100}
          depth={c.d.d / 100}
          returnLength={c.k && c.k.layout !== 'straight' ? c.k.length / 100 : undefined}
          returnSide={c.k?.layout === 'left' ? 'left' : 'right'}
          ink={
            contrastInk(props.preferences.wall ?? colors.wall) === 'dark'
              ? colors['ink-shadow']
              : colors.light
          }
        />
      ) : null}
      {props.human ? (
        <Human x={-c.d.w / 200 - 0.48} wall={props.preferences.wall ?? colors.wall} />
      ) : null}
    </>
  )
}
export default memo(function CabinetScene(props: SceneProps) {
  const colors = useSceneTheme()
  const mobile = useMobileStudio()
  const [degraded, setDegraded] = useState(false)
  const lowerQuality = useCallback(() => setDegraded(true), [])
  const lowQuality = mobile || degraded
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={lowQuality ? 1 : [1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: true,
        toneMapping: ACESFilmicToneMapping,
      }}
      fallback={<p>3B bu cihazda kullanılamıyor. Teknik çizimden devam edebilirsiniz.</p>}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
        gl.domElement.setAttribute('role', 'img')
        props.onReady()
      }}
    >
      <SceneThemeContext value={colors}>
        <SceneContent {...props} lowQuality={lowQuality} onSlow={lowerQuality} />
      </SceneThemeContext>
    </Canvas>
  )
})
