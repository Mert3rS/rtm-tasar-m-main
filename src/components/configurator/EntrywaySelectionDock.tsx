'use client'
import type { Config } from '@/lib/configurator/config'
import { entrywayLayoutNames } from '@/lib/configurator/entrywaySchema'

export function EntrywaySelectionDock({
  config: c,
  selected,
  onSelect,
  focused,
  onFocus,
}: {
  config: Config
  selected: number
  onSelect: (section: number, cell: number) => void
  focused: boolean
  onFocus: () => void
}) {
  if (!c.entryway) return null
  return (
    <div className="dc-kitchen-selection-dock" aria-label="Vestiyer seçimi">
      <button
        type="button"
        aria-label="Sahnede önceki vestiyer bölmesi"
        onClick={() => onSelect((selected + c.r.main.w.length - 1) % c.r.main.w.length, 0)}
      >
        ←
      </button>
      <span>
        {selected + 1}. bölme · {c.r.main.w[selected]} cm
        <small>{entrywayLayoutNames[c.entryway.layouts[selected]]}</small>
      </span>
      <button
        type="button"
        aria-label="Sahnede sonraki vestiyer bölmesi"
        onClick={() => onSelect((selected + 1) % c.r.main.w.length, 0)}
      >
        →
      </button>
      <button type="button" aria-pressed={focused} onClick={onFocus}>
        {focused ? 'Tüm vestiyeri göster' : 'Bölmeye yaklaş'}
      </button>
    </div>
  )
}
