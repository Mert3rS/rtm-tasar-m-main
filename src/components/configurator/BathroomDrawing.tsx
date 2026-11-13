'use client'
import { baseHeight, round, type Config } from '@/lib/configurator/config'
import { bathroomBasinSize, bathroomGeometry } from '@/lib/configurator/bathroom'
import { bathroomKindNames, type BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { humanSvgPoints } from '@/lib/configurator/humanProfile'

export function BathroomDrawing({
  config: c,
  selection,
  onSelect,
  human,
}: {
  config: Config
  selection?: BathroomSelection
  onSelect?: (selection: BathroomSelection) => void
  human?: boolean
}) {
  const b = c.bathroom,
    g = bathroomGeometry(c)
  if (!b) return null
  const scale = Math.min(540 / g.totalWidth, 495 / Math.max(g.top, human ? 180 : 0)),
    ps = Math.min(285 / g.totalWidth, 220 / c.d.d),
    x = 125 + (-g.left - c.d.w / 2) * scale,
    floor = 650,
    px = 835 + (-g.left - c.d.w / 2) * ps,
    py = 150
  const ink = 'var(--studio-text)',
    muted = 'var(--studio-muted)',
    surface = 'var(--studio-muted-surface)'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 750"
      className="design-drawing"
      role={onSelect ? 'group' : 'img'}
      aria-label={`Banyo teknik çizimi: ${c.d.w} cm, ${g.sinks.length} lavabo, toplam üst kot ${g.top} cm`}
    >
      <rect width="1200" height="750" fill="var(--studio-surface)" />
      <g fontFamily="Arial, sans-serif" fill={ink} strokeWidth="1" fontSize="11">
        <text x="35" y="32" fontSize="15" letterSpacing="3">
          RTM / BANYO TASARIMI
        </text>
        <text x={x} y="75" letterSpacing="2">
          ÖLÇÜLÜ ÖN GÖRÜNÜŞ
        </text>
        <text x={px} y="75" letterSpacing="2">
          TEZGÂH / LAVABO PLANI
        </text>
        {[...g.lower, ...(b.upperEnabled ? g.upper : []), ...g.side].map((unit) => {
          const ux = x + (unit.x + c.d.w / 2 - unit.width / 2) * scale,
            uy = floor - (unit.bottom + unit.height) * scale,
            uw = unit.width * scale,
            uh = unit.height * scale,
            upper = unit.row === 'upper'
          const drawers =
            unit.row !== 'upper' &&
            (unit.kind === 'drawers' || (unit.kind === 'sink' && b.sinkFront === 'drawers'))
          const active = selection?.row === unit.row && selection.index === unit.index
          return (
            <g key={`${unit.row}-${unit.index}`}>
              <rect
                x={ux + 1}
                y={uy}
                width={uw - 2}
                height={uh}
                fill={active ? 'var(--studio-accent-subtle)' : surface}
                stroke={ink}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                aria-label={
                  onSelect
                    ? `${unit.row === 'side' ? 'Boy dolabı' : upper ? 'Üst' : 'Alt'} ${unit.index + 1}. banyo bölmesi, ${unit.width} cm, ${bathroomKindNames[unit.kind]}`
                    : undefined
                }
                onClick={() => onSelect?.({ row: unit.row, index: unit.index })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect?.({ row: unit.row, index: unit.index })
                  }
                }}
              />
              <g pointerEvents="none">
                {drawers ? (
                  Array.from({ length: unit.drawers - 1 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${ux},${uy + (uh * (i + 1)) / unit.drawers}h${uw}`}
                      stroke={muted}
                    />
                  ))
                ) : unit.kind === 'mirror' || unit.kind === 'glass' ? (
                  <>
                    <path
                      d={`M${ux + uw * 0.2},${uy + uh * 0.2}l${uw * 0.6},${uh * 0.25}m${-uw * 0.6},${uh * 0.1}l${uw * 0.6},${uh * 0.25}`}
                      stroke={muted}
                    />
                    {unit.width > 65 ? (
                      <path d={`M${ux + uw / 2},${uy}v${uh}`} stroke={muted} />
                    ) : null}
                  </>
                ) : unit.kind === 'washer' ? (
                  <>
                    <circle
                      cx={ux + uw / 2}
                      cy={uy + uh * 0.55}
                      r={Math.min(uw, uh) * 0.3}
                      fill="none"
                      stroke={muted}
                    />
                    <path d={`M${ux},${uy + uh * 0.12}h${uw}`} stroke={muted} />
                  </>
                ) : (
                  Array.from({ length: unit.shelves }, (_, i) => (
                    <path
                      key={i}
                      d={`M${ux + 2},${uy + (uh * (i + 1)) / (unit.shelves + 1)}h${uw - 4}`}
                      stroke={muted}
                      strokeDasharray={unit.kind === 'open' ? undefined : '3 3'}
                    />
                  ))
                )}
                <text
                  x={ux + uw / 2}
                  y={uy + uh / 2 + 4}
                  textAnchor="middle"
                  fontSize={uw < 80 ? 8 : 10}
                >
                  {drawers ? `${unit.drawers} çekmece` : bathroomKindNames[unit.kind]}
                </text>
              </g>
              <path d={`M${ux},${upper ? uy - 16 : floor + 19}h${uw}`} stroke={muted} />
              <text x={ux + uw / 2} y={upper ? uy - 22 : floor + 35} textAnchor="middle">
                {round(unit.width)}
              </text>
            </g>
          )
        })}
        {!b.upperEnabled
          ? g.sinks.map((unit) => {
              const w =
                  Math.min(
                    (b.sideCabinet ? c.d.w : unit.width) * 0.85,
                    b.mirrorShape === 'round' ? b.upperHeight : b.upperHeight * 0.8,
                  ) * scale,
                h = b.mirrorShape === 'round' ? w : b.upperHeight * scale,
                cx = x + (unit.x + c.d.w / 2) * scale,
                cy = floor - (g.counter + b.gap + b.upperHeight / 2) * scale
              return (
                <g key={unit.index}>
                  {b.mirrorShape === 'round' ? (
                    <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={surface} stroke={ink} />
                  ) : (
                    <rect
                      x={cx - w / 2}
                      y={cy - h / 2}
                      width={w}
                      height={h}
                      rx={b.mirrorShape === 'capsule' ? w / 2 : 3}
                      fill={surface}
                      stroke={ink}
                    />
                  )}
                  <text x={cx} y={cy} textAnchor="middle">
                    Duvar aynası
                  </text>
                </g>
              )
            })
          : null}
        {g.sideCabinet ? (
          <g aria-label={b.sideCabinet?.side === 'left' ? 'Sol boy dolabı' : 'Sağ boy dolabı'}>
            <text x={x + (g.sideCabinet.x + c.d.w / 2) * scale}
              y={floor - (g.sideCabinet.bottom + g.sideCabinet.height) * scale - 12} textAnchor="middle">
              Boy dolabı {g.sideCabinet.width} × {g.sideCabinet.height} cm
            </text>
          </g>
        ) : null}
        <rect
          x={x}
          y={floor - g.counter * scale}
          width={c.d.w * scale}
          height={2 * scale}
          fill={ink}
        />
        {g.sinks.map((unit) => {
          const size = bathroomBasinSize(c, unit),
            cx = x + (unit.x + c.d.w / 2) * scale,
            y = floor - g.counter * scale,
            w = size.width * scale,
            h = 12 * scale,
            vessel = b.basin !== 'inset'
          return (
            <g key={unit.index}>
              <path
                d={
                  vessel
                    ? `M${cx - w / 2},${y - h}q${w * 0.1},${h} ${w / 2},${h}q${w * 0.4},0 ${w / 2},${-h}z`
                    : `M${cx - w / 2},${y}q${w * 0.1},${h} ${w / 2},${h}q${w * 0.4},0 ${w / 2},${-h}`
                }
                stroke={muted}
                fill={vessel ? surface : 'none'}
              />
              <path
                d={`M${cx},${y - (vessel ? 32 : 22) * scale}v${(vessel ? 32 : 22) * scale}m0,${-(vessel ? 32 : 22) * scale}h${9 * scale}`}
                stroke={ink}
                strokeWidth="2"
              />
            </g>
          )
        })}
        {baseHeight(c) ? (
          <rect
            x={x + 2}
            y={floor - baseHeight(c) * scale}
            width={c.d.w * scale - 4}
            height={baseHeight(c) * scale}
            fill={surface}
            stroke={muted}
          />
        ) : null}
        <path
          d={`M${x - 55},${floor}v${-g.top * scale}M${x - 25},${floor - g.offset * scale}v${-c.d.h * scale}M${x},${floor + 48}h${c.d.w * scale}`}
          stroke={muted}
        />
        <text
          x={x - 66}
          y={floor - (g.top * scale) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${x - 66} ${floor - (g.top * scale) / 2})`}
        >
          Toplam üst kot {round(g.top)} cm
        </text>
        <text
          x={x - 32}
          y={floor - (g.offset + c.d.h / 2) * scale}
          textAnchor="middle"
          transform={`rotate(-90 ${x - 32} ${floor - (g.offset + c.d.h / 2) * scale})`}
        >
          {c.d.h} cm alt dolap
        </text>
        <text x={x + (c.d.w * scale) / 2} y={floor + 65} textAnchor="middle">
          {c.d.w} cm lavabo ünitesi{b.sideCabinet ? ` / yerleşim ${g.totalWidth} cm` : ''}
        </text>
        <text x={x + c.d.w * scale + 12} y={floor - (g.counter + b.gap / 2) * scale}>
          {b.gap} cm ara
        </text>
        {c.o.baza === 'asma' ? (
          <text x={x + 4} y={floor - (g.offset * scale) / 2}>
            Yerden {b.floorGap} cm
          </text>
        ) : null}
        <rect x={px} y={py} width={c.d.w * ps} height={c.d.d * ps} fill={surface} stroke={ink} />
        {g.sideCabinet ? <rect
          x={px + (g.sideCabinet.x + c.d.w / 2 - g.sideCabinet.width / 2) * ps}
          y={py + (b.sideCabinet?.alignment === 'front' ? c.d.d - g.sideCabinet.depth : 0) * ps} width={g.sideCabinet.width * ps} height={g.sideCabinet.depth * ps}
          fill={surface} stroke={ink} /> : null}
        {g.sinks.map((unit) => {
          const size = bathroomBasinSize(c, unit),
            cx = px + (unit.x + c.d.w / 2) * ps,
            cy = py + (c.d.d / 2 + size.z) * ps
          return (
            <g key={unit.index}>
              {b.basin === 'inset' ? (
                <rect
                  x={cx - (size.width * ps) / 2}
                  y={cy - (size.depth * ps) / 2}
                  width={size.width * ps}
                  height={size.depth * ps}
                  rx={5}
                  fill="none"
                  stroke={muted}
                />
              ) : (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={(size.width * ps) / 2}
                  ry={(size.depth * ps) / 2}
                  fill="none"
                  stroke={muted}
                />
              )}
              <circle cx={cx} cy={cy} r={3} fill={muted} />
              <circle cx={cx} cy={py + 5.5 * ps} r={4} fill={ink} />
            </g>
          )
        })}
        <text x={px} y={py + c.d.d * ps + 25}>
          Derinlik {c.d.d} cm · {g.sinks.length} lavabo
        </text>
        <text x={px} y="420">
          Tezgâh üst kotu: {g.counter} cm
        </text>
        <text x={px} y="445">
          Lavabo üst kotu: {g.counter + (b.basin === 'inset' ? 0 : 12)} cm
        </text>
        <text x={px} y="470">
          Üst bölüm: {b.upperHeight} cm
        </text>
        {b.upperEnabled ? (
          <text x={px} y="495">
            Üst derinlik: {b.upperDepth} cm
          </text>
        ) : null}
        <text x={px} y="520">
          {b.mirrorLed ? 'Ayna çevresi LED' : 'Ayna LED yok'}
        </text>
        <text x={px} y="545">
          {b.splashback ? '24 cm tezgâh arkası panel' : 'Arka panel yok'}
        </text>
        {g.sideCabinet ? <>
          <text x="835" y="575">Boy: {g.sideCabinet.width} × {g.sideCabinet.height} × {g.sideCabinet.depth} cm</text>
          <text x="835" y="600">{b.sideCabinet?.side === 'left' ? 'Solda' : 'Sağda'} · Yerden {g.sideCabinet.bottom} cm · Ara {b.sideCabinet?.gap} cm</text>
          <text x="835" y="625">{g.side.length} göz · Toplam yerleşim {g.totalWidth} cm</text>
        </> : null}
        {human ? (
          <g data-human-scale>
            <polygon
              points={humanSvgPoints}
              transform={`translate(28 ${floor}) scale(${scale * 100})`}
              fill={muted}
            />
            <text x="12" y={floor + 25} fontSize="9">
              180 cm
            </text>
          </g>
        ) : null}
        <text x="35" y="742" fontSize="10" fill={muted}>
          Ön tasarımdır. Tesisat, duvar bağlantısı, ıslak hacim malzemesi ve cihaz boşlukları üretim
          öncesi doğrulanır.
        </text>
      </g>
    </svg>
  )
}
