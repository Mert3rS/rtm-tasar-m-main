'use client'

import type { Config } from '@/lib/configurator/config'
import { kitchenRow, kitchenSelectionUnit } from '@/lib/configurator/kitchen'
import {
  kitchenKindNames,
  kitchenRowNames,
  type KitchenSelection,
} from '@/lib/configurator/kitchenSchema'

export function KitchenSelectionDock({
  config,
  selection,
  onSelect,
  focused,
  onFocus,
}: {
  config: Config
  selection: KitchenSelection
  onSelect: (value: KitchenSelection) => void
  focused: boolean
  onFocus: () => void
}) {
  const row = kitchenRow(config, selection.row),
    unit = kitchenSelectionUnit(config, selection)
  return (
    <div className="dc-kitchen-selection-dock" aria-label="Mutfak seçimi">
      <button
        type="button"
        aria-label="Sahnede önceki modül"
        onClick={() =>
          onSelect({
            row: selection.row,
            index: (selection.index + row.w.length - 1) % row.w.length,
          })
        }
      >
        ←
      </button>
      <span>
        {kitchenRowNames[selection.row]} · {selection.index + 1}
        <small>
          {unit ? `${kitchenKindNames[unit.kind]} · ${unit.width} cm` : 'Kör köşe alanı'}
        </small>
      </span>
      <button
        type="button"
        aria-label="Sahnede sonraki modül"
        onClick={() =>
          onSelect({ row: selection.row, index: (selection.index + 1) % row.w.length })
        }
      >
        →
      </button>
      <button type="button" aria-pressed={focused} disabled={!unit} onClick={onFocus}>
        {focused ? 'Tüm mutfağı göster' : 'Seçime yaklaş'}
      </button>
    </div>
  )
}
