'use client'

import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { RoundedBox } from '@react-three/drei'
import { baseHeight, colorHex, palette } from '@/lib/configurator/config'
import { tvGeometry, type TvUnit } from '@/lib/configurator/tv'
import { tvKindNames } from '@/lib/configurator/tvSchema'
import { fitProps, type PropPlacement } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { Boards, Front, type Board } from './CabinetParts'
import { SelectionOutline } from './SelectionOutline'
import { useSceneColors } from './SceneTheme'
import type { SceneProps } from './CabinetScene'

const RepresentativeProps = lazy(() => import('./RepresentativeProps'))
type TvSceneProps = SceneProps & { lowQuality: boolean; propsReady: boolean }

function TvBay({ unit, ...props }: TvSceneProps & { unit: TvUnit }) {
  const c = props.config,
    t = c.tvUnit,
    colors = useSceneColors()
  const [localOpen, setLocalOpen] = useState(false),
    [drawer, setDrawer] = useState<number | null>(null),
    [hover, setHover] = useState(false)
  if (!t) return null
  const upper = unit.row === 'upper',
    width = unit.width / 100,
    depth = unit.depth / 100,
    height = unit.height / 100,
    bottom = unit.bottom / 100
  const key = upper && c.o.iki ? c.o.renk2 : c.o.renk,
    face = upper && c.o.iki ? palette[key].hex : colorHex(c.o)
  const body =
    c.o.govde === 'beyaz'
      ? palette.beyaz.hex
      : c.o.govde === 'antrasit'
        ? palette.antrasit.hex
        : c.o.govde === 'ahsap'
          ? palette.mese.hex
          : face
  const selected =
    (props.tvSelection?.row ?? 'lower') === unit.row &&
    (props.tvSelection?.index ?? props.selected) === unit.index
  const boards: Board[] = [],
    led: Board[] = [],
    placements: PropPlacement[] = []
  const open = props.open || localOpen || unit.kind === 'open' || unit.kind === 'glass'
  function select() {
    props.onTvSelect?.({ row: unit.row, index: unit.index })
  }
  const decorative = unit.kind === 'tv' || unit.kind === 'slats'
  if (unit.kind === 'slats') {
    const count = Math.min(40, Math.max(5, Math.round(unit.width / 4))),
      g = tvGeometry(c),
      h = (g.top - g.offset) / 100
    for (let i = 0; i < count; i++)
      boards.push({
        p: [-width / 2 + ((i + 0.5) * width) / count, (g.top + g.offset) / 200, -depth / 2 + 0.035],
        s: [(width / count) * 0.58, h, 0.035],
      })
  } else if (!decorative) {
    boards.push(
      { p: [-(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
      { p: [(width - 0.018) / 2, bottom + height / 2, 0], s: [0.018, height, depth] },
      { p: [0, bottom + 0.009, 0], s: [width - 0.036, 0.018, depth] },
      { p: [0, bottom + height - 0.009, 0], s: [width - 0.036, 0.018, depth] },
      { p: [0, bottom + height / 2, -depth / 2 + 0.004], s: [width - 0.036, height, 0.008] },
    )
    if (unit.kind !== 'drawers')
      for (let i = 1; i <= unit.shelves; i++) {
        const y = bottom + (height * i) / (unit.shelves + 1)
        boards.push({ p: [0, y, 0], s: [width - 0.036, 0.018, depth - 0.025] })
        if (c.o.led.includes('raf'))
          led.push({ p: [0, y - 0.012, depth / 2 - 0.03], s: [width - 0.06, 0.006, 0.012] })
      }
    if (props.propsReady && props.preferences.props && open && unit.kind !== 'drawers')
      for (let i = 0; i <= Math.min(unit.shelves, props.lowQuality ? 0 : 3); i++) {
        const candidates = upper ? productPropSets.tv.top : productPropSets.tv.middle
        const contents = [
          ...candidates.slice(i % candidates.length),
          ...candidates.slice(0, i % candidates.length),
        ]
        placements.push(
          ...fitProps(
            contents,
            {
              x: 0,
              width: width - 0.045,
              bottom: bottom + (height * i) / (unit.shelves + 1) + 0.02,
              height: height / (unit.shelves + 1) - 0.025,
              depth: depth - 0.04,
              cell: `tv-${unit.row}-${unit.index}-${i}`,
              zone: 'middle',
            },
            props.lowQuality,
          ),
        )
      }
    if (upper && c.o.led.includes('ic'))
      for (const side of [-1, 1])
        led.push({
          p: [side * (width / 2 - 0.025), bottom + height / 2, -depth / 2 + 0.025],
          s: [0.008, height - 0.05, 0.012],
        })
  }
  const options = { ...c.o, renk: key, ral: upper && c.o.iki ? '' : c.o.ral, camt: unit.glass }
  const leaves = Math.ceil(unit.width / 65)
  return (
    <group
      position={[unit.x / 100, 0, unit.z / 100]}
      name={`tv-${unit.row}-${unit.index}`}
      onClick={(event) => {
        event.stopPropagation()
        select()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHover(true)
        props.onHover(
          `${upper ? 'Üst' : 'Alt'} ${unit.index + 1} · ${tvKindNames[unit.kind]} · ${unit.width} cm`,
        )
      }}
      onPointerOut={() => {
        setHover(false)
        props.onHover('')
      }}
    >
      <Boards
        items={boards}
        color={unit.kind === 'slats' ? face : body}
        wood={Boolean(palette[key].wood) || c.o.govde === 'ahsap'}
      />
      {unit.kind === 'drawers'
        ? Array.from({ length: unit.drawers }, (_, i) => (
            <Front
              key={i}
              x={0}
              y={bottom + (height * (i + 0.5)) / unit.drawers}
              w={width - 0.025}
              h={height / unit.drawers}
              depth={depth}
              type="cekmece"
              color={face}
              options={options}
              open={props.open}
              selected={false}
              localOpen={drawer === i}
              onSelect={select}
              onToggle={() => setDrawer((value) => (value === i ? null : i))}
              onHover={setHover}
            />
          ))
        : !decorative && unit.kind !== 'open'
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
                  tintedGlass
                  type={unit.kind === 'glass' ? 'cam' : unit.kind === 'lift' ? 'klapa' : 'kapak'}
                  color={face}
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
      <Suspense fallback={null}>
        {placements.length ? <RepresentativeProps placements={placements} /> : null}
      </Suspense>
      {selected || hover ? (
        <SelectionOutline
          width={width - 0.01}
          height={height - 0.01}
          position={[0, bottom + height / 2, decorative ? -depth / 2 + 0.065 : depth / 2 + 0.04]}
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
      {upper && c.o.led.includes('ic') && open && !decorative ? (
        <pointLight
          position={[0, bottom + height * 0.6, depth / 2 - 0.03]}
          color={colors.led}
          intensity={0.12}
          distance={1.6}
        />
      ) : null}
    </group>
  )
}
function TvFeatureWall(props: TvSceneProps) {
  const c = props.config,
    t = c.tvUnit,
    g = tvGeometry(c),
    colors = useSceneColors()
  const screenTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 288
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 512, 288)
      gradient.addColorStop(0, '#111a1c')
      gradient.addColorStop(0.55, '#070c10')
      gradient.addColorStop(1, '#1b2528')
      context.fillStyle = gradient
      context.fillRect(0, 0, 512, 288)
      context.fillStyle = 'rgba(255,255,255,0.025)'
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(512, 0)
      context.lineTo(0, 220)
      context.fill()
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
  useEffect(() => () => screenTexture.dispose(), [screenTexture])
  if (!t || !g.area || !g.screen) return null
  const area = g.area,
    w = area.width / 100,
    h = area.height / 100,
    bottom = area.bottom / 100,
    x = area.x / 100,
    z = -c.d.d / 200 + 0.025
  const led: Board[] = [
    { p: [-w / 2 + 0.055, bottom + h / 2, z + 0.055], s: [0.012, h - 0.1, 0.008] },
    { p: [w / 2 - 0.055, bottom + h / 2, z + 0.055], s: [0.012, h - 0.1, 0.008] },
    { p: [0, bottom + 0.055, z + 0.055], s: [w - 0.1, 0.012, 0.008] },
    { p: [0, bottom + h - 0.055, z + 0.055], s: [w - 0.1, 0.012, 0.008] },
  ]
  const slatCount = Math.min(65, Math.floor(w / 0.035)),
    sw = g.screen.width / 100,
    sh = g.screen.height / 100,
    sy = g.screen.y / 100
  return (
    <group
      position={[x, 0, 0]}
      name="tv-feature-wall"
      onClick={(event) => {
        event.stopPropagation()
        props.onTvSelect?.({ row: 'upper', index: area.index })
      }}
    >
      {c.o.panel ? (
        <>
          <Boards
            color={t.backdrop === 'stone' ? palette.kasmir.hex : palette.fildisi.hex}
            stone={t.backdrop === 'stone'}
            roughness={0.7}
            items={[{ p: [0, bottom + h / 2, z], s: [w - 0.025, h, 0.025] }]}
          />
          {t.backdrop === 'slats' ? (
            <Boards
              color={palette[c.o.iki ? c.o.renk2 : c.o.renk].hex}
              wood
              items={Array.from({ length: slatCount }, (_, i): Board => ({
                p: [-w / 2 + ((i + 0.5) * w) / slatCount, bottom + h / 2, z + 0.025],
                s: [(w / slatCount) * 0.55, h, 0.025],
              }))}
            />
          ) : null}
        </>
      ) : null}
      {t.frameLed ? (
        <>
          <group>
            {led.map((item, i) => (
              <mesh key={i} position={item.p}>
                <boxGeometry args={item.s} />
                <meshStandardMaterial
                  color={colors.led}
                  emissive={colors['led-emission']}
                  emissiveIntensity={4}
                />
              </mesh>
            ))}
          </group>
          <pointLight
            position={[0, bottom + h / 2, z + 0.18]}
            color={colors.led}
            intensity={0.2}
            distance={2}
          />
        </>
      ) : null}
      <RoundedBox
        position={[0, sy, z + 0.075]}
        args={[sw, sh, 0.035]}
        radius={0.009}
        smoothness={2}
        castShadow
      >
        <meshStandardMaterial color={palette.siyah.hex} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, sy, z + 0.093]}>
        <planeGeometry args={[sw - 0.018, sh - 0.018]} />
        <meshBasicMaterial map={screenTexture} toneMapped={false} />
      </mesh>
      <mesh position={[sw / 2 - 0.025, sy - sh / 2 + 0.005, z + 0.095]}>
        <sphereGeometry args={[0.002, 8, 8]} />
        <meshBasicMaterial color={colors.led} />
      </mesh>
      {t.soundbar ? (
        <RoundedBox
          position={[0, sy - sh / 2 - 0.07, z + 0.1]}
          args={[Math.min(1, sw * 0.65), 0.045, 0.065]}
          radius={0.012}
          smoothness={2}
          castShadow
        >
          <meshStandardMaterial color={palette.antrasit.hex} roughness={0.85} />
        </RoundedBox>
      ) : null}
      {t.cableChannel && !c.o.panel ? (
        <Boards
          color={palette.fildisi.hex}
          items={[
            { p: [0, (bottom + sy - sh / 2) / 2, z], s: [0.025, sy - sh / 2 - bottom, 0.015] },
          ]}
        />
      ) : null}
    </group>
  )
}
export function TvCabinet(props: TvSceneProps) {
  const c = props.config,
    colors = useSceneColors(),
    t = c.tvUnit,
    g = tvGeometry(c)
  if (!t) return null
  const w = c.d.w / 100,
    d = c.d.d / 100,
    base = baseHeight(c) / 100,
    body =
      c.o.govde === 'beyaz'
        ? palette.beyaz.hex
        : c.o.govde === 'antrasit'
          ? palette.antrasit.hex
          : c.o.govde === 'ahsap'
            ? palette.mese.hex
            : colorHex(c.o)
  return (
    <group name="modern-tv-unit">
      {base > 0 ? (
        <Boards
          color={c.o.baza === 'ayak' ? colors.metal : palette.siyah.hex}
          metalness={c.o.baza === 'ayak' ? 0.8 : 0}
          items={
            c.o.baza === 'ayak'
              ? [-1, 0, 1].flatMap((side) =>
                  [-1, 1].map((z): Board => ({
                    p: [side * (w / 2 - 0.06), base / 2, z * (d / 2 - 0.045)],
                    s: [0.025, base, 0.025],
                  })),
                )
              : [{ p: [0, base / 2, -0.025], s: [w - 0.03, base, d - 0.06] }]
          }
        />
      ) : null}
      {g.lower.map((unit) => (
        <TvBay key={`lower-${unit.index}`} {...props} unit={unit} />
      ))}
      <Boards
        color={body}
        wood={Boolean(palette[c.o.renk].wood)}
        items={[{ p: [0, g.counter / 100 - 0.01, 0], s: [w + 0.015, 0.02, d + 0.015] }]}
      />
      {g.upper.map((unit) => (
        <TvBay key={`upper-${unit.index}`} {...props} unit={unit} />
      ))}
      <TvFeatureWall {...props} />
      {c.o.led.includes('alt') ? (
        <mesh position={[0, g.offset / 100 + base + 0.008, d / 2 - 0.04]}>
          <boxGeometry args={[w - 0.06, 0.008, 0.015]} />
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
