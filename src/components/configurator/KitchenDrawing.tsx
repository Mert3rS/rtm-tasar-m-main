'use client'

import { round, type Config } from '@/lib/configurator/config'
import { humanSvgPoints } from '@/lib/configurator/humanProfile'
import { kitchenGeometry, kitchenLayouts, type KitchenUnit } from '@/lib/configurator/kitchen'
import {
  kitchenKindNames,
  kitchenRowNames,
  type KitchenSelection,
} from '@/lib/configurator/kitchenSchema'

export function KitchenDrawing({
  config: c,
  selected = 0,
  onSelect,
  human,
  kitchenSelection,
  onKitchenSelect,
}: {
  config: Config
  selected?: number
  cell?: number
  onSelect?: (s: number, i: number) => void
  human?: boolean
  kitchenSelection?: KitchenSelection
  onKitchenSelect?: (selection: KitchenSelection) => void
}) {
  if (!c.k) return null
  const k = c.k,
    g = kitchenGeometry(c),
    isL = k.layout !== 'straight'
  const ink = 'var(--studio-text)',
    muted = 'var(--studio-muted)',
    surface = 'var(--studio-muted-surface)',
    accent = 'var(--studio-accent-subtle)'
  const selection = kitchenSelection ?? { row: 'lower', index: selected }
  const interactive = Boolean(onKitchenSelect || onSelect)
  const layout = kitchenLayouts.find((layout) => layout.value === k.layout)?.label
  const top = c.d.h + (['yok', 'karar'].includes(c.o.tezgah) ? 0 : 4),
    upperBottom = top + k.gap
  function select(unit: KitchenUnit) {
    if (onKitchenSelect) onKitchenSelect({ row: unit.row, index: unit.section })
    else if (unit.row === 'lower') onSelect?.(unit.section, 0)
  }
  function elevation(
    lower: KitchenUnit[],
    upper: KitchenUnit[],
    total: number,
    x: number,
    floor: number,
    scale: number,
  ) {
    return (
      <g>
        <rect
          x={x}
          y={floor - c.d.h * scale}
          width={total * scale}
          height={c.d.h * scale}
          fill="none"
          stroke={muted}
        />
        <rect
          x={x}
          y={floor - g.base * scale}
          width={total * scale}
          height={g.base * scale}
          fill={surface}
          stroke={muted}
        />
        {[...lower, ...upper].map((unit) => {
          const up = unit.row === 'upper' || unit.row === 'returnUpper'
          const ux = x + (unit.x + total / 2 - unit.width / 2) * scale,
            uw = unit.width * scale
          const bottom = up ? upperBottom : g.base,
            height = up ? k.upperHeight : c.d.h - g.base
          const uy = floor - (bottom + height) * scale,
            uh = height * scale
          const active = selection.row === unit.row && selection.index === unit.section
          const oven = g.ovenUnit?.row === unit.row && g.ovenUnit.section === unit.section
          const dishwasher = g.dishwasher?.row === unit.row && g.dishwasher.section === unit.section
          const glass = unit.kind === 'glass',
            hood = up && unit.kind === 'hood'
          return (
            <g key={`${unit.row}-${unit.section}`}>
              <rect
                x={ux + 1}
                y={uy + 1}
                width={Math.max(1, uw - 2)}
                height={Math.max(1, uh - 2)}
                fill={active ? accent : surface}
                stroke={active ? ink : muted}
                strokeDasharray={unit.kind === 'open' ? '4 3' : undefined}
                tabIndex={interactive ? 0 : undefined}
                role={interactive ? 'button' : undefined}
                aria-label={
                  interactive
                    ? `${kitchenRowNames[unit.row]} ${unit.section + 1}. modül ${kitchenKindNames[unit.kind]}, ${round(unit.width)} cm`
                    : undefined
                }
                onClick={() => select(unit)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    select(unit)
                  }
                }}
              />
              {glass ? (
                <path
                  d={`M${ux + 4},${uy + 4}l${Math.max(1, uw - 8)},${Math.max(1, uh - 8)}m${-uw + 8},0l${Math.max(1, uw - 8)},${-uh + 8}`}
                  stroke={muted}
                  fill="none"
                  pointerEvents="none"
                />
              ) : null}
              {unit.kind === 'drawers'
                ? [0.25, 0.625].map((ratio) => (
                    <path
                      key={ratio}
                      d={`M${ux + 2},${uy + uh * ratio}h${Math.max(1, uw - 4)}`}
                      stroke={ink}
                      pointerEvents="none"
                    />
                  ))
                : null}
              {oven || dishwasher ? (
                <rect
                  x={ux + 4}
                  y={uy + uh * 0.18}
                  width={Math.max(1, uw - 8)}
                  height={uh * 0.65}
                  fill="none"
                  stroke={ink}
                  pointerEvents="none"
                />
              ) : null}
              {hood ? (
                <path
                  d={`M${ux + uw * 0.32},${uy + uh * 0.44}v${uh * 0.3}l${-uw * 0.2},${uh * 0.2}h${uw * 0.76}l${-uw * 0.2},${-uh * 0.2}v${-uh * 0.3}`}
                  fill="none"
                  stroke={ink}
                  pointerEvents="none"
                />
              ) : null}
              {uw > 35 && uh > 24 ? (
                <text
                  x={ux + uw / 2}
                  y={uy + uh * 0.52 + (hood ? -uh * 0.25 : 0)}
                  textAnchor="middle"
                  fontSize="9"
                  pointerEvents="none"
                >
                  {kitchenKindNames[unit.kind]}
                </text>
              ) : null}
              {!up ? (
                <text x={ux + uw / 2} y={floor + 15} textAnchor="middle" fontSize="9">
                  {round(unit.width)}
                </text>
              ) : null}
            </g>
          )
        })}
        {top > c.d.h ? (
          <rect
            x={x - 1}
            y={floor - top * scale}
            width={total * scale + 2}
            height={4 * scale}
            fill={surface}
            stroke={ink}
          />
        ) : null}
        {lower
          .filter((unit) => g.sink?.row === unit.row && g.sink.section === unit.section)
          .map((unit) => (
            <path
              key={unit.section}
              d={`M${x + (unit.x + total / 2) * scale},${floor - top * scale}v${-17 * scale}q0,${-9 * scale} ${10 * scale},${-9 * scale}v${6 * scale}`}
              fill="none"
              stroke={ink}
              strokeWidth="1.5"
            />
          ))}
        <path
          d={`M${x},${floor + 28}h${total * scale} M${x},${floor + 24}v8 M${x + total * scale},${floor + 24}v8`}
          stroke={muted}
        />
        <text x={x + (total * scale) / 2} y={floor + 44} textAnchor="middle">
          {total} cm
        </text>
      </g>
    )
  }
  const mainScale = Math.min(630 / c.d.w, 300 / Math.max(g.height, human ? 180 : 0))
  const returnScale = Math.min(630 / Math.max(1, g.returnWidth), 185 / g.height)
  const planLength = isL ? k.length : c.d.d,
    ps = Math.min(270 / c.d.w, 260 / planLength),
    px = 850,
    py = 135,
    pd = c.d.d * ps
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 750"
      className="design-drawing"
      role={interactive ? 'group' : 'img'}
      aria-label={`Mutfak teknik çizimi: ${layout}, ana duvar ${c.d.w} cm${isL ? `, dönüş ${k.length} cm` : ''}`}
    >
      <rect width="1200" height="750" fill="var(--studio-surface)" />
      <g fontFamily="Arial, sans-serif" fill={ink} fontSize="12" strokeWidth="1">
        <text x="35" y="32" letterSpacing="3" fontSize="15">
          RTM / MUTFAK TASARIMI
        </text>
        <text x="110" y="65" letterSpacing="2">
          ANA DUVAR · ÖN GÖRÜNÜŞ
        </text>
        {elevation(g.modules, g.upperModules, c.d.w, 110, 390, mainScale)}
        <path d={`M85,390v${-g.height * mainScale}`} stroke={muted} />
        <text
          x="73"
          y={390 - (g.height * mainScale) / 2}
          transform={`rotate(-90 73 ${390 - (g.height * mainScale) / 2})`}
          textAnchor="middle"
        >
          Toplam {g.height} cm
        </text>
        {human ? (
          <g data-human-scale>
            <polygon
              points={humanSvgPoints}
              transform={`translate(42 390) scale(${mainScale * 100})`}
              fill={muted}
            />
            <text x="15" y="420" fontSize="9">
              180 cm
            </text>
          </g>
        ) : null}
        {isL ? (
          <>
            <text x="110" y="478" letterSpacing="2">
              DÖNÜŞ DUVARI · KÖŞEDEN DIŞA
            </text>
            {elevation(
              g.returnModules.map((unit) => ({
                ...unit,
                x: unit.x * (k.layout === 'left' ? -1 : 1),
              })),
              g.returnUpperModules.map((unit) => ({
                ...unit,
                x: unit.x * (k.layout === 'left' ? -1 : 1),
              })),
              g.returnWidth,
              110,
              682,
              returnScale,
            )}
            <text x="850" y="475">
              Dönüş {k.length} cm · köşe dahil
            </text>
          </>
        ) : null}
        <text x={px} y="65" letterSpacing="2">
          {layout?.toLocaleUpperCase('tr-TR')}
        </text>
        <text x={px} y="85" fontSize="10">
          ÜSTTEN PLAN
        </text>
        <rect x={px} y={py} width={c.d.w * ps} height={pd} fill={surface} stroke={ink} />
        {isL ? (
          <>
            <rect
              x={k.layout === 'left' ? px : px + (c.d.w - c.d.d) * ps}
              y={py + pd}
              width={pd}
              height={g.returnWidth * ps}
              fill={surface}
              stroke={ink}
            />
            <rect
              x={k.layout === 'left' ? px : px + (c.d.w - c.d.d) * ps}
              y={py}
              width={pd}
              height={pd}
              fill="none"
              stroke={muted}
              strokeDasharray="3 3"
            />
          </>
        ) : null}
        {g.modules.map((unit) => {
          const x = px + (unit.x - unit.width / 2 + c.d.w / 2) * ps,
            width = unit.width * ps
          return (
            <g key={unit.section}>
              <path d={`M${x},${py}v${pd}`} stroke={muted} />
              {unit === g.sink ? (
                <rect
                  x={x + width * 0.15}
                  y={py + pd * 0.2}
                  width={width * 0.7}
                  height={pd * 0.6}
                  rx="2"
                  fill="none"
                  stroke={ink}
                />
              ) : null}
              {unit === g.hob
                ? [0.3, 0.7].flatMap((cx) =>
                    [0.3, 0.7].map((cy) => (
                      <circle
                        key={`${cx}-${cy}`}
                        cx={x + width * cx}
                        cy={py + pd * cy}
                        r={Math.min(width, pd) * 0.1}
                        fill="none"
                        stroke={ink}
                      />
                    )),
                  )
                : null}
            </g>
          )
        })}
        {g.returnModules.map((unit) => {
          const y =
              py +
              pd +
              (unit.x * (k.layout === 'left' ? -1 : 1) - unit.width / 2 + g.returnWidth / 2) * ps,
            x = k.layout === 'left' ? px : px + (c.d.w - c.d.d) * ps
          return (
            <g key={unit.section}>
              <path d={`M${x},${y}h${pd}`} stroke={muted} />
              {unit === g.sink ? (
                <rect
                  x={x + pd * 0.2}
                  y={y + unit.width * ps * 0.15}
                  width={pd * 0.6}
                  height={unit.width * ps * 0.7}
                  fill="none"
                  stroke={ink}
                />
              ) : null}
              {unit === g.hob ? (
                <rect
                  x={x + pd * 0.12}
                  y={y + 3}
                  width={pd * 0.76}
                  height={unit.width * ps - 6}
                  fill="none"
                  stroke={ink}
                />
              ) : null}
            </g>
          )
        })}
        <text x={px + (c.d.w * ps) / 2} y={py - 15} textAnchor="middle">
          {c.d.w} cm
        </text>
        <text x="850" y="510">
          Derinlik {c.d.d} cm
        </text>
        <text x="850" y="530">
          Alt dolap {c.d.h} cm
        </text>
        {c.o.ust ? (
          <>
            <text x="850" y="550">
              Üst dolap {k.upperHeight} cm
            </text>
            <text x="850" y="570">
              Tezgâh arası {k.gap} cm
            </text>
          </>
        ) : null}
        <text x="35" y="742" fontSize="10" fill={muted}>
          Ölçüler cm. Kör köşe ve cihazlar ön tasarımdır; üretim öncesi yerinde ölçü ve cihaz uyumu
          doğrulanmalıdır.
        </text>
      </g>
    </svg>
  )
}
