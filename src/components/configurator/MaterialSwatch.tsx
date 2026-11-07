import { palette } from '@/lib/configurator/config'

export function MaterialSwatch({ color, glossy = false }: { color: string; glossy?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`dc-swatch ${palette[color]?.wood ? 'dc-swatch-wood' : ''} ${glossy ? 'dc-swatch-gloss' : ''}`}
      style={{ backgroundColor: `var(--material-${color})` }}
    />
  )
}
