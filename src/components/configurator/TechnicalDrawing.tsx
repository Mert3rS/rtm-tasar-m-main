'use client'

import { HUMAN_HEIGHT, humanSvgPoints } from '@/lib/configurator/humanProfile'
import { useId } from 'react'
import { KitchenDrawing } from './KitchenDrawing'
import { TvDrawing } from './TvDrawing'
import type { TvSelection } from '@/lib/configurator/tvSchema'
import { BathroomDrawing } from './BathroomDrawing'
import type { BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { EntrywayDrawing } from './EntrywayDrawing'
import { WardrobeDrawing } from './WardrobeDrawing'
import type { KitchenSelection } from '@/lib/configurator/kitchenSchema'
import { baseHeight, frontNames, round, type Config } from '@/lib/configurator/config'

export function TechnicalDrawing({
  config: c,
  selected = 0,
  cell = 0,
  onSelect,
  human = false,
  kitchenSelection,
  bathroomSelection,
  tvSelection,
  onTvSelect,
  onBathroomSelect,
  onKitchenSelect,
}: {
  config: Config
  human?: boolean
  selected?: number
  cell?: number
  onSelect?: (s: number, i: number) => void
  tvSelection?: TvSelection
  onTvSelect?: (selection: TvSelection) => void
  bathroomSelection?: BathroomSelection
  onBathroomSelect?: (selection: BathroomSelection) => void
  kitchenSelection?: KitchenSelection
  onKitchenSelect?: (selection: KitchenSelection) => void
}) {
  const markerId = useId().replace(/:/g, '')
  if (c.tvUnit) return <TvDrawing config={c} selection={tvSelection} onSelect={onTvSelect} human={human} />
  if (c.bathroom) return <BathroomDrawing config={c} selection={bathroomSelection} onSelect={onBathroomSelect} human={human} />
  if (c.entryway) return <EntrywayDrawing config={c} selected={selected} onSelect={onSelect} human={human} />
  if (c.wardrobe) return <WardrobeDrawing config={c} selected={selected} onSelect={onSelect} human={human} />
  if (c.k) return <KitchenDrawing config={c} selected={selected} cell={cell} onSelect={onSelect} human={human} kitchenSelection={kitchenSelection} onKitchenSelect={onKitchenSelect} />
  const scale = Math.min(420 / c.d.w, 360 / Math.max(c.d.h, human ? 180 : 0)),
    w = c.d.w * scale,
    h = c.d.h * scale,
    d = c.d.d * scale
  const x = 100,
    y = 70 + (human ? Math.max(0, 180 * scale - h) : 0),
    base = baseHeight(c) * scale
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 560"
      className="design-drawing"
      role={onSelect ? 'group' : 'img'}
      aria-label={`Teknik çizim: ${c.d.w} × ${c.d.h} × ${c.d.d} cm`}
    >
      <rect width="900" height="560" fill="var(--studio-surface)" />
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--studio-muted)" />
        </marker>
      </defs>
      <g fontFamily="Arial, sans-serif" fill="var(--studio-text)" fontSize="12" strokeWidth="1">
        <text x="40" y="30" fontSize="13" letterSpacing="3">
          RTM / ÖN TASARIM
        </text>
        <text x={x} y="52" fontSize="10" letterSpacing="2">
          ÖN GÖRÜNÜŞ
        </text>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="none"
          stroke="var(--studio-text)"
          strokeWidth="2"
        />
        {c.r.main.w.map((width, s) => {
          const sx = x + c.r.main.w.slice(0, s).reduce((a, b) => a + b, 0) * scale,
            sw = width * scale
          return (
            <g key={s}>
              {c.r.main.g[s].h.map((height, i) => {
                const sh = height * scale
                const sy =
                  y + h - base - c.r.main.g[s].h.slice(0, i + 1).reduce((a, b) => a + b, 0) * scale
                return (
                  <g key={i}>
                    <rect
                      x={sx + 1}
                      y={sy + 1}
                      width={sw - 2}
                      height={sh - 2}
                      fill={
                        selected === s && cell === i
                          ? 'var(--studio-accent-subtle)'
                          : 'var(--studio-muted-surface)'
                      }
                      stroke="var(--studio-muted)"
                      tabIndex={onSelect ? 0 : undefined}
                      role={onSelect ? 'button' : undefined}
                      aria-label={onSelect ? `${s + 1}. bölme ${i + 1}. göz, ${round(width)} × ${round(height)} cm` : undefined}
                      onClick={() => onSelect?.(s, i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelect?.(s, i)
                        }
                      }}
                    />
                    {sh > 28 ? (
                      <>
                        <text
                          x={sx + sw / 2}
                          y={sy + sh / 2 - 3}
                          textAnchor="middle"
                          fontSize="10"
                          pointerEvents="none"
                        >
                          {frontNames[c.r.main.g[s].f[i]]}
                        </text>
                        <text
                          x={sx + sw / 2}
                          y={sy + sh / 2 + 11}
                          textAnchor="middle"
                          fontSize="10"
                          pointerEvents="none"
                        >
                          {round(height)} cm
                        </text>
                      </>
                    ) : null}
                    {c.r.main.g[s].f[i] === 'cekmece' ? (
                      <path
                        d={`M${sx + sw * 0.3},${sy + 8}h${sw * 0.4}`}
                        stroke="var(--studio-muted)"
                      />
                    ) : null}
                  </g>
                )
              })}
              <path
                d={`M${sx},${y + h + 18}h${sw}`}
                stroke="var(--studio-muted)"
                markerStart={`url(#${markerId})`}
                markerEnd={`url(#${markerId})`}
              />
              <text x={sx + sw / 2} y={y + h + 36} textAnchor="middle">
                {round(width)}
              </text>
            </g>
          )
        })}
        {base > 0 ? (
          <rect
            x={x}
            y={y + h - base}
            width={w}
            height={base}
            fill="var(--studio-muted-surface)"
            stroke="var(--studio-muted)"
          />
        ) : null}
        <path
          d={`M${x - 28},${y}v${h} M${x},${y + h + 55}h${w}`}
          fill="none"
          stroke="var(--studio-muted)"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text
          x={x - 40}
          y={y + h / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${x - 40} ${y + h / 2})`}
        >
          {c.d.h} cm
        </text>
        <text x={x + w / 2} y={y + h + 75} textAnchor="middle">
          {c.d.w} cm
        </text>
        {human ? (
          <g aria-label="İnsan ölçeği 180 cm" data-human-scale>
            <polygon
              points={humanSvgPoints}
              transform={`translate(585 ${y + h}) scale(${scale * 100})`}
              fill="var(--studio-muted)"
            />
            <path
              d={`M530,${y + h}v${-HUMAN_HEIGHT * scale * 100} M525,${y + h}h10 M525,${y + h - HUMAN_HEIGHT * scale * 100}h10`}
              stroke="var(--studio-text)"
              fill="none"
            />
            <text x="525" y={y + h - HUMAN_HEIGHT * scale * 50} textAnchor="end" fontSize="11">
              180 cm
            </text>
          </g>
        ) : null}
        <text x="650" y="52" fontSize="10" letterSpacing="2">
          YAN KESİT
        </text>
        <rect
          x="650"
          y={y}
          width={d}
          height={h}
          fill="var(--studio-muted-surface)"
          stroke="var(--studio-text)"
          strokeWidth="2"
        />
        <path
          d={`M650,${y + h + 20}h${d}`}
          stroke="var(--studio-muted)"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text x={650 + d / 2} y={y + h + 40} textAnchor="middle">
          {c.d.d} cm
        </text>
        <text x="40" y="535" fontSize="10" fill="var(--studio-muted)">
          Ölçüler cm cinsindedir. Ön tasarımdır; üretim öncesi teknik doğrulama gerektirir.
        </text>
      </g>
    </svg>
  )
}
