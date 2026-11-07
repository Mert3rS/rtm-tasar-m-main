'use client'
import { baseHeight, round, type Config } from '@/lib/configurator/config'
import { tvGeometry } from '@/lib/configurator/tv'
import { tvKindNames, type TvSelection } from '@/lib/configurator/tvSchema'
import { humanSvgPoints } from '@/lib/configurator/humanProfile'

export function TvDrawing({
  config: c,
  selection,
  onSelect,
  human,
}: {
  config: Config
  selection?: TvSelection
  onSelect?: (selection: TvSelection) => void
  human?: boolean
}) {
  const t = c.tvUnit,
    g = tvGeometry(c)
  if (!t) return null
  const scale = Math.min(600 / c.d.w, 490 / Math.max(g.top, human ? 180 : 0)),
    x = 120,
    floor = 650,
    px = 845,
    py = 150,
    ps = 280 / c.d.w
  const ink = 'var(--studio-text)',
    muted = 'var(--studio-muted)',
    surface = 'var(--studio-muted-surface)'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 750"
      className="design-drawing"
      role={onSelect ? 'group' : 'img'}
      aria-label={`TV ünitesi teknik çizimi: ${c.d.w} cm, ${c.o.tv} inç, toplam üst kot ${g.top} cm`}
    >
      <rect width="1200" height="750" fill="var(--studio-surface)" />
      <g fontFamily="Arial, sans-serif" fill={ink} strokeWidth="1" fontSize="11">
        <text x="35" y="32" fontSize="15" letterSpacing="3">
          RTM / TV ÜNİTESİ TASARIMI
        </text>
        <text x={x} y="75" letterSpacing="2">
          ÖLÇÜLÜ ÖN GÖRÜNÜŞ
        </text>
        <text x={px} y="75" letterSpacing="2">
          YERLEŞİM / ÜSTTEN
        </text>
        {g.upper
          .filter((u) => u.kind === 'slats')
          .map((u) => {
            const left = x + (u.x + c.d.w / 2 - u.width / 2) * scale,
              w = u.width * scale,
              h = (g.top - g.offset) * scale
            return (
              <g key={u.index} pointerEvents="none">
                {Array.from({ length: Math.max(4, Math.floor(u.width / 4)) }, (_, i) => (
                  <path
                    key={i}
                    d={`M${left + (i + 0.5) * 4 * scale},${floor - g.top * scale}v${h}`}
                    stroke={muted}
                  />
                ))}
                <rect
                  x={left}
                  y={floor - g.top * scale}
                  width={w}
                  height={h}
                  fill="none"
                  stroke={muted}
                />
              </g>
            )
          })}
        {[...g.lower, ...g.upper].map((u) => {
          const left = x + (u.x + c.d.w / 2 - u.width / 2) * scale,
            y = floor - (u.bottom + u.height) * scale,
            w = u.width * scale,
            h = u.height * scale,
            upper = u.row === 'upper',
            feature = u.kind === 'tv' || u.kind === 'slats'
          return (
            <g key={`${u.row}-${u.index}`}>
              <rect
                x={left + 1}
                y={y}
                width={w - 2}
                height={h}
                fill={
                  selection?.row === u.row && selection.index === u.index
                    ? 'var(--studio-accent-subtle)'
                    : feature
                      ? 'transparent'
                      : surface
                }
                stroke={feature ? muted : ink}
                strokeDasharray={feature ? '4 3' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                aria-label={
                  onSelect
                    ? `${upper ? 'Üst' : 'Alt'} ${u.index + 1}. TV bölmesi, ${u.width} cm, ${tvKindNames[u.kind]}`
                    : undefined
                }
                onClick={() => onSelect?.({ row: u.row, index: u.index })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect?.({ row: u.row, index: u.index })
                  }
                }}
              />
              <g pointerEvents="none">
                {u.kind === 'drawers'
                  ? Array.from({ length: u.drawers - 1 }, (_, i) => (
                      <path
                        key={i}
                        d={`M${left},${y + (h * (i + 1)) / u.drawers}h${w}`}
                        stroke={muted}
                      />
                    ))
                  : !feature
                    ? Array.from({ length: u.shelves }, (_, i) => (
                        <path
                          key={i}
                          d={`M${left + 2},${y + (h * (i + 1)) / (u.shelves + 1)}h${w - 4}`}
                          stroke={muted}
                          strokeDasharray={u.kind === 'open' ? undefined : '3 3'}
                        />
                      ))
                    : null}
                {u.kind === 'glass' ? (
                  <path
                    d={`M${left + w * 0.2},${y + h * 0.2}l${w * 0.6},${h * 0.3}m${-w * 0.6},${h * 0.1}l${w * 0.6},${h * 0.3}`}
                    stroke={muted}
                  />
                ) : null}
                {u.kind === 'lift' ? (
                  <path
                    d={`M${left + w * 0.3},${y + h * 0.3}l${w * 0.2},${-h * 0.15}l${w * 0.2},${h * 0.15}`}
                    stroke={muted}
                  />
                ) : null}
                {u.kind !== 'tv' ? (
                  <text
                    x={left + w / 2}
                    y={y + h / 2 + 4}
                    textAnchor="middle"
                    fontSize={w < 100 ? 8 : 10}
                  >
                    {u.kind === 'drawers'
                      ? `${u.drawers} çekmece`
                      : u.kind === 'slats'
                        ? 'Çıta'
                        : tvKindNames[u.kind]}
                  </text>
                ) : null}
              </g>
              <path d={`M${left},${upper ? y - 16 : floor + 19}h${w}`} stroke={muted} />
              <text x={left + w / 2} y={upper ? y - 22 : floor + 35} textAnchor="middle">
                {round(u.width)}
              </text>
            </g>
          )
        })}
        {g.area && g.screen ? (
          <g pointerEvents="none">
            {t.frameLed ? (
              <rect
                x={x + (g.area.x + c.d.w / 2 - g.area.width / 2 + 5.5) * scale}
                y={floor - (g.top - 5.5) * scale}
                width={(g.area.width - 11) * scale}
                height={(t.upperHeight - 11) * scale}
                fill="none"
                stroke={ink}
                strokeDasharray="5 3"
              />
            ) : null}
            <rect
              x={x + (g.screen.x + c.d.w / 2 - g.screen.width / 2) * scale}
              y={floor - (g.screen.y + g.screen.height / 2) * scale}
              width={g.screen.width * scale}
              height={g.screen.height * scale}
              rx={3}
              fill={surface}
              stroke={ink}
              strokeWidth="2"
            />
            <text
              x={x + (g.screen.x + c.d.w / 2) * scale}
              y={floor - g.screen.y * scale}
              textAnchor="middle"
              fontSize="16"
            >
              {c.o.tv}″ TV
            </text>
            {t.soundbar ? (
              <path
                d={`M${x + (g.screen.x + c.d.w / 2 - g.screen.width * 0.3) * scale},${floor - (g.screen.y - g.screen.height / 2 - 7) * scale}h${g.screen.width * 0.6 * scale}`}
                stroke={ink}
                strokeWidth="4"
              />
            ) : null}
          </g>
        ) : null}
        <rect
          x={x}
          y={floor - g.counter * scale}
          width={c.d.w * scale}
          height={2 * scale}
          fill={ink}
        />
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
          d={`M${x - 40},${floor}v${-g.top * scale}M${x},${floor + 48}h${c.d.w * scale}`}
          stroke={muted}
        />
        <text
          x={x - 52}
          y={floor - (g.top * scale) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${x - 52} ${floor - (g.top * scale) / 2})`}
        >
          Toplam üst kot {g.top} cm
        </text>
        <text x={x + (c.d.w * scale) / 2} y={floor + 65} textAnchor="middle">
          {c.d.w} cm toplam genişlik
        </text>
        <rect x={px} y={py} width={c.d.w * ps} height={c.d.d * ps} fill={surface} stroke={ink} />
        {g.upper.map((u) => (
          <rect
            key={u.index}
            x={px + (u.x + c.d.w / 2 - u.width / 2) * ps}
            y={py}
            width={u.width * ps}
            height={u.depth * ps}
            fill="none"
            stroke={muted}
            strokeDasharray={u.kind === 'tv' || u.kind === 'slats' ? '3 3' : undefined}
          />
        ))}
        <text x={px} y={py + c.d.d * ps + 25}>
          Alt derinlik {c.d.d} cm · üst {t.upperDepth} cm
        </text>
        <text x={px} y="355">
          Alt ünite yüksekliği: {c.d.h} cm
        </text>
        <text x={px} y="380">
          Üst bölüm yüksekliği: {t.upperHeight} cm
        </text>
        <text x={px} y="405">
          {c.o.baza === 'asma' ? `Yerden ${t.floorGap} cm asma ünite` : `Baza ${baseHeight(c)} cm`}
        </text>
        <text x={px} y="430">
          TV alanı: {g.area?.width} cm
        </text>
        <text x={px} y="455">
          {t.frameLed ? 'Gizli LED çerçeve' : 'Çerçeve LED yok'}
        </text>
        <text x={px} y="480">
          {c.o.panel
            ? `TV arkası ${t.backdrop === 'stone' ? 'taş' : t.backdrop === 'slats' ? 'çıtalı' : 'düz'} panel`
            : 'TV arkası panel yok'}
        </text>
        <text x={px} y="505">
          {t.cableChannel ? 'Kablo kanalı' : 'Kablo kanalı yok'}
        </text>
        {human ? (
          <g data-human-scale>
            <polygon
              points={humanSvgPoints}
              transform={`translate(32 ${floor}) scale(${scale * 100})`}
              fill={muted}
            />
            <text x="12" y={floor + 25} fontSize="9">
              180 cm
            </text>
          </g>
        ) : null}
        <text x="35" y="742" fontSize="10" fill={muted}>
          Ön tasarımdır. Ekran ölçüsü temsilî 16:9 oranındadır; duvar bağlantısı, havalandırma ve kablo
          güzergâhı üretim öncesi doğrulanır.
        </text>
      </g>
    </svg>
  )
}
