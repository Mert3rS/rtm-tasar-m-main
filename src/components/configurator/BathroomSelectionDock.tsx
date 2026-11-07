'use client'
import type { Config } from '@/lib/configurator/config'
import { bathroomGeometry } from '@/lib/configurator/bathroom'
import { bathroomKindNames, type BathroomSelection } from '@/lib/configurator/bathroomSchema'

export function BathroomSelectionDock({
  config: c,
  selection,
  onSelect,
  focused,
  onFocus,
}: {
  config: Config
  selection: BathroomSelection
  onSelect: (selection: BathroomSelection) => void
  focused: boolean
  onFocus: () => void
}) {
  if (!c.bathroom) return null
  const units = bathroomGeometry(c)[selection.row],
    unit = units[selection.index]
  return (
    <div className="dc-kitchen-selection-dock" aria-label="Banyo seçimi">
      <button
        type="button"
        aria-label="Sahnede önceki banyo bölmesi"
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
        <small>{bathroomKindNames[unit.kind]}</small>
      </span>
      <button
        type="button"
        aria-label="Sahnede sonraki banyo bölmesi"
        onClick={() =>
          onSelect({ row: selection.row, index: (selection.index + 1) % units.length })
        }
      >
        →
      </button>
      <button type="button" aria-pressed={focused} onClick={onFocus}>
        {focused ? 'Tüm banyoyu göster' : 'Bölmeye yaklaş'}
      </button>
    </div>
  )
}
