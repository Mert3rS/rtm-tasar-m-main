'use client'

import { baseHeight, optionName, round, type Config } from '@/lib/configurator/config'
import { humanSvgPoints } from '@/lib/configurator/humanProfile'
import { wardrobeUnits } from '@/lib/configurator/wardrobe'
import { wardrobeDoorNames, wardrobeLayoutNames } from '@/lib/configurator/wardrobeSchema'

export function WardrobeDrawing({
  config: c,
  selected = 0,
  onSelect,
  human,
}: {
  config: Config
  selected?: number
  onSelect?: (section: number, cell: number) => void
  human?: boolean
}) {
  const wd = c.wardrobe
  if (!wd) return null
  const units = wardrobeUnits(c),
    scale = Math.min(540 / c.d.w, 500 / c.d.h),
    frontScale = Math.min(285 / c.d.w, 500 / c.d.h)
  const x = 120,
    floor = 650,
    fx = 835,
    base = baseHeight(c)
  const ink = 'var(--studio-text)',
    muted = 'var(--studio-muted)',
    surface = 'var(--studio-muted-surface)',
    accent = 'var(--studio-accent-subtle)'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 750"
      className="design-drawing"
      role={onSelect ? 'group' : 'img'}
      aria-label={`Gardırop teknik çizimi: ${c.d.w} × ${c.d.h} × ${c.d.d} cm · ${c.o.acilim === 'surgulu' ? 'Sürgülü' : 'Menteşeli'}${wd.loft ? ` · ${wd.loftHeight} cm üst depolama` : ''}`}
    >
      <rect width="1200" height="750" fill="var(--studio-surface)" />
      <g fontFamily="Arial, sans-serif" fill={ink} strokeWidth="1" fontSize="11">
        <text x="35" y="32" fontSize="15" letterSpacing="3">
          RTM / GARDIROP TASARIMI
        </text>
        <text x={x} y="75" letterSpacing="2">
          ÖLÇÜLÜ İÇ GÖRÜNÜŞ
        </text>
        <text x={fx} y="75" letterSpacing="2">
          KAPAK PLANI
        </text>
        <rect
          x={x}
          y={floor - c.d.h * scale}
          width={c.d.w * scale}
          height={c.d.h * scale}
          fill="none"
          stroke={ink}
          strokeWidth="2"
        />
        <rect
          x={x}
          y={floor - base * scale}
          width={c.d.w * scale}
          height={base * scale}
          fill={surface}
          stroke={muted}
        />
        {units.map((unit) => {
          const ux = x + (unit.x + c.d.w / 2 - unit.width / 2) * scale,
            uw = unit.width * scale
          return (
            <g key={unit.index}>
              <rect
                x={ux + 1}
                y={floor - c.d.h * scale + 1}
                width={uw - 2}
                height={(c.d.h - base) * scale - 2}
                fill={selected === unit.index ? accent : surface}
                stroke={muted}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                aria-label={
                  onSelect
                    ? `${unit.index + 1}. gardırop bölmesi, ${unit.width} cm, ${wardrobeLayoutNames[wd.layouts[unit.index]]}`
                    : undefined
                }
                onClick={() => onSelect?.(unit.index, 0)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect?.(unit.index, 0)
                  }
                }}
              />
              {wd.loft ? (
                <g pointerEvents="none">
                  <path
                    d={`M${ux},${floor - (c.d.h - wd.loftHeight) * scale}h${uw}`}
                    stroke={ink}
                  />
                  <text
                    x={ux + uw / 2}
                    y={floor - (c.d.h - wd.loftHeight / 2) * scale}
                    textAnchor="middle"
                    fontSize="10"
                  >
                    Üst depolama · {wd.loftHeight} cm
                  </text>
                </g>
              ) : null}
              {unit.zones.map((zone, index) => {
                const y = floor - (zone.bottom + zone.height) * scale,
                  h = zone.height * scale
                return (
                  <g key={index} pointerEvents="none">
                    <path d={`M${ux + 2},${y}h${uw - 4}`} stroke={muted} />
                    {zone.kind === 'rail' ? (
                      <>
                        <path
                          d={`M${ux + 5},${y + 12 * scale}h${uw - 10}`}
                          stroke={ink}
                          strokeWidth="2"
                        />
                        <text x={ux + uw / 2} y={y + h * 0.5} textAnchor="middle">
                          Askı · {round(zone.height)} cm
                        </text>
                      </>
                    ) : null}
                    {zone.kind === 'shelves' || zone.kind === 'shoes' ? (
                      <>
                        {Array.from({ length: zone.count }, (_, i) => (
                          <path
                            key={i}
                            d={`M${ux + 2},${y + (h * (i + 1)) / (zone.count + 1)}h${uw - 4}`}
                            stroke={muted}
                          />
                        ))}
                        <text x={ux + uw / 2} y={y + 13} textAnchor="middle" fontSize="9">
                          {zone.kind === 'shoes' ? 'Ayakkabılık' : 'Raf'}
                          {zone.count ? ` · ${zone.count}` : ''}
                        </text>
                      </>
                    ) : null}
                    {zone.kind === 'drawers' ? (
                      <>
                        {Array.from({ length: zone.count }, (_, i) => (
                          <g key={i}>
                            <rect
                              x={ux + 4}
                              y={y + (h * i) / zone.count + 2}
                              width={uw - 8}
                              height={h / zone.count - 4}
                              fill="none"
                              stroke={ink}
                            />
                            <path
                              d={`M${ux + uw * 0.35},${y + (h * i) / zone.count + 8}h${uw * 0.3}`}
                              stroke={muted}
                            />
                          </g>
                        ))}
                        <text x={ux + uw / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize="10">
                          {zone.count} iç çekmece
                        </text>
                      </>
                    ) : null}
                    {zone.kind === 'trousers' ? (
                      <>
                        <path d={`M${ux + 6},${y + 12 * scale}h${uw - 12}`} stroke={ink} />
                        <text x={ux + uw / 2} y={y + h / 2} textAnchor="middle">
                          Pantolonluk
                        </text>
                      </>
                    ) : null}
                  </g>
                )
              })}
              <path d={`M${ux},${floor + 19}h${uw}`} stroke={muted} />
              <text x={ux + uw / 2} y={floor + 35} textAnchor="middle">
                {round(unit.width)}
              </text>
            </g>
          )
        })}
        <path
          d={`M85,${floor}v${-c.d.h * scale} M${x},${floor + 48}h${c.d.w * scale}`}
          stroke={muted}
        />
        <text
          x="72"
          y={floor - (c.d.h * scale) / 2}
          textAnchor="middle"
          transform={`rotate(-90 72 ${floor - (c.d.h * scale) / 2})`}
        >
          {c.d.h} cm
        </text>
        <text x={x + (c.d.w * scale) / 2} y={floor + 65} textAnchor="middle">
          {c.d.w} cm toplam genişlik
        </text>
        {human ? (
          <g data-human-scale>
            <polygon
              points={humanSvgPoints}
              transform={`translate(45 ${floor}) scale(${scale * 100})`}
              fill={muted}
            />
            <text x="15" y={floor + 25} fontSize="9">
              180 cm
            </text>
          </g>
        ) : null}
        <rect
          x={fx}
          y={floor - c.d.h * frontScale}
          width={c.d.w * frontScale}
          height={c.d.h * frontScale}
          fill={surface}
          stroke={ink}
        />
        {(c.o.acilim === 'surgulu' ? wd.slidingDoors : wd.doors).map((door, index, doors) => {
          const left =
            c.o.acilim === 'surgulu'
              ? (c.d.w * index) / doors.length
              : c.r.main.w.slice(0, index).reduce((total, width) => total + width, 0)
          const width = c.o.acilim === 'surgulu' ? c.d.w / doors.length : c.r.main.w[index]
          const px = fx + left * frontScale,
            py = floor - c.d.h * frontScale,
            pw = width * frontScale,
            ph = (c.d.h - base) * frontScale
          const leaves = c.o.acilim === 'surgulu' ? 1 : Math.ceil(width / 65)
          return (
            <g key={index}>
              <rect
                x={px + 1}
                y={py + 1}
                width={pw - 2}
                height={ph - 2}
                fill="none"
                stroke={muted}
                strokeDasharray={door === 'open' ? '4 3' : undefined}
              />
              {Array.from({ length: leaves - 1 }, (_, i) => (
                <path key={i} d={`M${px + (pw * (i + 1)) / leaves},${py}v${ph}`} stroke={muted} />
              ))}
              {wd.loft && c.o.acilim !== 'surgulu' ? (
                <path d={`M${px},${py + wd.loftHeight * frontScale}h${pw}`} stroke={muted} />
              ) : null}
              {door === 'mirror' || door === 'glass' ? (
                <path
                  d={`M${px + pw * 0.2},${py + ph * 0.3}l${pw * 0.6},${ph * 0.25}m${-pw * 0.6},${ph * 0.1}l${pw * 0.6},${ph * 0.25}`}
                  stroke={muted}
                  fill="none"
                />
              ) : null}
              {door !== 'open' && pw > 45 ? (
                <text x={px + pw / 2} y={py + ph * 0.6} textAnchor="middle" fontSize="8">
                  {wardrobeDoorNames[door]}
                </text>
              ) : null}
            </g>
          )
        })}
        <text x={fx} y={floor + 25}>
          {c.o.acilim === 'surgulu'
            ? `${wd.slidingDoors.length} sürgü paneli`
            : 'Menteşeli kapak sistemi'}
        </text>
        <text x={fx} y={floor + 44}>
          Derinlik {c.d.d} cm · Baza {base} cm
        </text>
        <text x={fx} y={floor + 63}>
          Kulp: {optionName(c.o.kulp)}
        </text>
        <text x="35" y="742" fontSize="10" fill={muted}>
          Ön tasarımdır. Ayna/cam görünümü temsilîdir; üretim öncesi yerinde ölçü ve donanım uyumu
          doğrulanmalıdır.
        </text>
      </g>
    </svg>
  )
}
