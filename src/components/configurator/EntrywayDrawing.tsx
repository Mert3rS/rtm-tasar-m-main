'use client'

import { baseHeight, round, type Config } from '@/lib/configurator/config'
import { entrywayUnits } from '@/lib/configurator/entryway'
import { entrywayFrontNames, entrywayLayoutNames } from '@/lib/configurator/entrywaySchema'
import { humanSvgPoints } from '@/lib/configurator/humanProfile'

export function EntrywayDrawing({
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
  const entry = c.entryway
  if (!entry) return null
  const units = entrywayUnits(c),
    scale = Math.min(540 / c.d.w, 500 / c.d.h),
    frontScale = Math.min(285 / c.d.w, 500 / c.d.h)
  const x = 120,
    fx = 835,
    floor = 650,
    base = baseHeight(c)
  const ink = 'var(--studio-text)',
    muted = 'var(--studio-muted)',
    surface = 'var(--studio-muted-surface)'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 750"
      className="design-drawing"
      role={onSelect ? 'group' : 'img'}
      aria-label={`Vestiyer teknik çizimi: ${c.d.w} × ${c.d.h} × ${c.d.d} cm`}
    >
      <rect width="1200" height="750" fill="var(--studio-surface)" />
      <g fontFamily="Arial, sans-serif" fill={ink} strokeWidth="1" fontSize="11">
        <text x="35" y="32" fontSize="15" letterSpacing="3">
          RTM / VESTİYER TASARIMI
        </text>
        <text x={x} y="75" letterSpacing="2">
          ÖLÇÜLÜ İÇ GÖRÜNÜŞ
        </text>
        <text x={fx} y="75" letterSpacing="2">
          ÖN YÜZ PLANI
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
          const left = unit.x + c.d.w / 2 - unit.width / 2,
            ux = x + left * scale,
            uw = unit.width * scale
          const px = fx + left * frontScale,
            pw = unit.width * frontScale,
            py = floor - unit.top * frontScale,
            ph = (unit.top - base) * frontScale
          const layout = entry.layouts[unit.index]
          return (
            <g key={unit.index}>
              <rect
                x={ux + 1}
                y={floor - c.d.h * scale + 1}
                width={uw - 2}
                height={(c.d.h - base) * scale - 2}
                fill={selected === unit.index ? 'var(--studio-accent-subtle)' : surface}
                stroke={muted}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                aria-label={
                  onSelect
                    ? `${unit.index + 1}. vestiyer bölmesi, ${unit.width} cm, ${entrywayLayoutNames[layout]}`
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
              <g pointerEvents="none">
                {entry.upper ? (
                  <>
                    <path d={`M${ux},${floor - unit.top * scale}h${uw}`} stroke={ink} />
                    <text
                      x={ux + uw / 2}
                      y={floor - (unit.top + entry.upperHeight / 2) * scale}
                      textAnchor="middle"
                      fontSize="9"
                    >
                      Üst bölüm · {entry.upperHeight} cm
                    </text>
                  </>
                ) : null}
                {unit.zones.map((zone, index) => {
                  const y = floor - (zone.bottom + zone.height) * scale,
                    h = zone.height * scale
                  return (
                    <g key={index}>
                      {zone.kind !== 'hooks' ? (
                        <path d={`M${ux + 2},${y}h${uw - 4}`} stroke={muted} />
                      ) : null}
                      {zone.kind === 'hooks' ? (
                        <>
                          {entry.slats[unit.index]
                            ? Array.from(
                                { length: Math.min(24, Math.floor(unit.width / 5)) },
                                (_, i) => (
                                  <path
                                    key={i}
                                    d={`M${ux + ((i + 0.5) * uw) / Math.floor(unit.width / 5)},${y + 2}v${h - 4}`}
                                    stroke={muted}
                                    opacity="0.3"
                                  />
                                ),
                              )
                            : null}
                          {Array.from({ length: zone.count }, (_, i) => (
                            <path
                              key={i}
                              d={`M${ux + (uw * (i + 1)) / (zone.count + 1)},${floor - unit.hookY * scale}v${-5 * scale}h${2 * scale}`}
                              stroke={ink}
                              strokeWidth="2"
                            />
                          ))}
                          <text x={ux + uw / 2} y={y + h * 0.6} textAnchor="middle">
                            {zone.count} askı kancası
                          </text>
                        </>
                      ) : zone.kind === 'hanging' ? (
                        <>
                          <path
                            d={`M${ux + 5},${y + 12 * scale}h${uw - 10}`}
                            stroke={ink}
                            strokeWidth="2"
                          />
                          <text x={ux + uw / 2} y={y + h / 2} textAnchor="middle">
                            Askı dolabı
                          </text>
                        </>
                      ) : zone.kind === 'drawers' ? (
                        Array.from({ length: zone.count }, (_, i) => (
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
                        ))
                      ) : (
                        <>
                          {Array.from({ length: zone.count }, (_, i) => (
                            <path
                              key={i}
                              d={`M${ux + 2},${y + (h * (i + 1)) / (zone.count + 1)}h${uw - 4}`}
                              stroke={muted}
                            />
                          ))}
                          <text x={ux + uw / 2} y={y + 12} textAnchor="middle" fontSize="9">
                            {zone.kind === 'shoes' ? 'Ayakkabılık' : 'Raf'}
                            {zone.count ? ` · ${zone.count}` : ''}
                          </text>
                        </>
                      )}
                    </g>
                  )
                })}
                {layout === 'bench' ? (
                  <>
                    <rect
                      x={ux + 2}
                      y={floor - unit.seatBoardTop * scale}
                      width={uw - 4}
                      height={3 * scale}
                      fill={ink}
                    />
                    {entry.cushion ? (
                      <rect
                        x={ux + 3}
                        y={floor - entry.seatHeight * scale}
                        width={uw - 6}
                        height={4 * scale}
                        rx={3}
                        fill={muted}
                      />
                    ) : null}
                    <text
                      x={ux + uw / 2}
                      y={floor - entry.seatHeight * scale - 9}
                      textAnchor="middle"
                      fontSize="9"
                    >
                      Oturma {entry.seatHeight} cm{entry.cushion ? ' · minderli' : ''}
                    </text>
                  </>
                ) : null}
              </g>
              <path d={`M${ux},${floor + 19}h${uw}`} stroke={muted} />
              <text x={ux + uw / 2} y={floor + 35} textAnchor="middle">
                {round(unit.width)}
              </text>
              <rect
                x={px + 1}
                y={floor - c.d.h * frontScale}
                width={pw - 2}
                height={(c.d.h - base) * frontScale}
                fill={surface}
                stroke={muted}
              />
              {entry.upper ? <path d={`M${px},${py}h${pw}`} stroke={muted} /> : null}
              <rect
                x={px + 2}
                y={py + 1}
                width={pw - 4}
                height={ph - 2}
                fill="none"
                stroke={muted}
                strokeDasharray={unit.front === 'open' ? '4 3' : undefined}
              />
              {['mirror', 'glass'].includes(unit.front) ? (
                <path
                  d={`M${px + pw * 0.2},${py + ph * 0.25}l${pw * 0.6},${ph * 0.25}m${-pw * 0.6},${ph * 0.1}l${pw * 0.6},${ph * 0.25}`}
                  stroke={muted}
                />
              ) : null}
              {unit.width > 65 && unit.front !== 'open' ? (
                <path d={`M${px + pw / 2},${py}v${ph}`} stroke={muted} />
              ) : null}
              {layout === 'bench' ? (
                <path d={`M${px},${floor - entry.seatHeight * frontScale}h${pw}`} stroke={ink} />
              ) : null}
              <text x={px + pw / 2} y={py + ph * 0.6} textAnchor="middle" fontSize="9">
                {entrywayFrontNames[unit.front]}
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
        <text x={fx} y={floor + 25}>
          Derinlik {c.d.d} cm · Baza {base} cm
        </text>
        <text x={fx} y={floor + 44}>
          {entry.upper ? `${entry.upperHeight} cm üst depolama` : 'Üst bölüm yok'}
        </text>
        <text x="35" y="742" fontSize="10" fill={muted}>
          Ön tasarımdır. Ayna/cam ve minder temsilîdir; üretim öncesi yerinde ölçü ve donanım uyumu
          doğrulanır.
        </text>
      </g>
    </svg>
  )
}
