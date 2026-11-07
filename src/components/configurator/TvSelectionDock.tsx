'use client'
import type { Config } from '@/lib/configurator/config'
import { tvGeometry } from '@/lib/configurator/tv'
import { tvKindNames, type TvSelection } from '@/lib/configurator/tvSchema'

export function TvSelectionDock({
  config: c,
  selection,
  onSelect,
  focused,
  onFocus,
}: {
  config: Config
  selection: TvSelection
  onSelect: (selection: TvSelection) => void
  focused: boolean
  onFocus: () => void
}) {
  if (!c.tvUnit) return null
  const units = tvGeometry(c)[selection.row],
    unit = units[selection.index]
  return (
    <div className="dc-kitchen-selection-dock" aria-label="TV seçimi">
      <button
        type="button"
        aria-label="Sahnede önceki TV bölmesi"
        onClick={() =>
          onSelect({
            row: selection.row,
            index: (selection.index + units.length - 1) % units.length,
          })
        }
      >
        ←
      </button>
      <span>
        {selection.row === 'upper' ? 'Üst' : 'Alt'} dolap · {selection.index + 1} · {unit.width} cm
        <small>{tvKindNames[unit.kind]}</small>
      </span>
      <button
        type="button"
        aria-label="Sahnede sonraki TV bölmesi"
        onClick={() =>
          onSelect({ row: selection.row, index: (selection.index + 1) % units.length })
        }
      >
        →
      </button>
      <button type="button" aria-pressed={focused} onClick={onFocus}>
        {focused ? 'Tüm üniteyi göster' : 'Bölmeye yaklaş'}
      </button>
    </div>
  )
}
