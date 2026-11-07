'use client'
import type { Config } from '@/lib/configurator/config'
import { wardrobeLayoutNames } from '@/lib/configurator/wardrobeSchema'

export function WardrobeSelectionDock({
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
  if (!c.wardrobe) return null
  return (
    <div className="dc-kitchen-selection-dock" aria-label="Gardırop seçimi">
      <button
        type="button"
        aria-label="Sahnede önceki gardırop bölmesi"
        onClick={() => onSelect((selected + c.r.main.w.length - 1) % c.r.main.w.length, 0)}
      >
        ←
      </button>
      <span>
        {selected + 1}. bölme · {c.r.main.w[selected]} cm
        <small>{wardrobeLayoutNames[c.wardrobe.layouts[selected]]}</small>
      </span>
      <button
        type="button"
        aria-label="Sahnede sonraki gardırop bölmesi"
        onClick={() => onSelect((selected + 1) % c.r.main.w.length, 0)}
      >
        →
      </button>
      <button type="button" aria-pressed={focused} onClick={onFocus}>
        {focused ? 'Tüm gardırobu göster' : 'Bölmeye yaklaş'}
      </button>
    </div>
  )
}
