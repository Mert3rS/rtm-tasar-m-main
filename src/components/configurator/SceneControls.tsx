'use client'

import { useEffect, useId, useState } from 'react'
import { hexColor, roomSwatches, type ScenePreferences } from '@/lib/configurator/scenePreferences'
import { useTheme } from '@/components/theme/ThemeProvider'

function ColorField({
  kind,
  value,
  onChange,
  onCommit,
}: {
  kind: 'wall' | 'floor'
  value: string
  onChange: (value: string, commit: boolean) => void
  onCommit: () => void
}) {
  const id = useId()
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const title = kind === 'wall' ? 'Duvar rengi' : 'Zemin rengi'
  function apply() {
    const parsed = hexColor.safeParse(text ?? value)
    setError(!parsed.success)
    if (parsed.success) {
      setText(null)
      onChange(parsed.data, true)
    }
  }
  return (
    <fieldset className="dc-room-color">
      <legend>{title}</legend>
      <div className="dc-room-inputs">
        <label>
          <span className="sr-only">{title} seçici</span>
          <input
            type="color"
            value={value}
            onChange={(e) => {
              setText(null)
              setError(false)
              onChange(e.target.value, false)
            }}
            onBlur={onCommit}
            onPointerUp={onCommit}
          />
        </label>
        <label htmlFor={id} className="sr-only">
          {title} HEX
        </label>
        <input
          id={id}
          type="text"
          value={text ?? value}
          maxLength={7}
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setText(e.target.value)
            setError(false)
          }}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              apply()
            }
          }}
        />
      </div>
      {error ? (
        <p role="status" id={`${id}-error`}>
          #RRGGBB biçiminde geçerli bir renk girin. Son geçerli renk korundu.
        </p>
      ) : null}
      <div className="dc-room-swatches">
        {roomSwatches[kind].map(([name, hex]) => (
          <button
            type="button"
            key={hex}
            aria-label={`${title}: ${name}`}
            aria-pressed={value === hex}
            onClick={() => {
              setText(null)
              setError(false)
              onChange(hex, true)
            }}
          >
            <i style={{ backgroundColor: hex }} />
            {name}
          </button>
        ))}
      </div>
      <output aria-live="polite">
        {title}: {value.toUpperCase()}
      </output>
    </fieldset>
  )
}
export function SceneControls({
  preferences,
  update,
  persist,
  reset,
}: {
  preferences: ScenePreferences
  update: (patch: Partial<ScenePreferences>, commit?: boolean) => void
  persist: () => void
  reset: () => void
}) {
  const { theme } = useTheme()
  const [resetVersion, setResetVersion] = useState(0)
  const [defaults, setDefaults] = useState({ wall: '#eee8de', floor: '#ddd2bf' })
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const style = getComputedStyle(
        document.querySelector('.configurator-shell') ?? document.documentElement,
      )
      setDefaults({
        wall: style.getPropertyValue('--studio-wall').trim(),
        floor: style.getPropertyValue('--studio-floor').trim(),
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [theme])
  return (
    <section className="dc-room-controls" aria-label="Mekân ayarları">
      <p className="dc-eyebrow">MEKÂN / GÖRÜNTÜ TERCİHLERİ</p>
      {(['wall', 'floor'] as const).map((kind) => {
        const value = preferences[kind] ?? defaults[kind]
        return (
          <ColorField
            key={`${kind}-${resetVersion}`}
            kind={kind}
            value={value}
            onChange={(value, commit) => update({ [kind]: value }, commit)}
            onCommit={persist}
          />
        )
      })}
      <label className="dc-room-check">
        <input
          type="checkbox"
          checked={preferences.textured}
          onChange={(e) => update({ textured: e.target.checked })}
        />
        Dokulu zemin (kapalıyken düz renk)
      </label>
      <label className="dc-room-check">
        <input
          type="checkbox"
          checked={preferences.props}
          onChange={(e) => update({ props: e.target.checked })}
        />
        Eşyaları göster
      </label>
      <button
        type="button"
        className="dc-room-reset"
        onClick={() => {
          reset()
          setResetVersion((version) => version + 1)
        }}
      >
        Varsayılana dön
      </button>
      <p className="dc-hint">
        Bu tercihler yalnızca bu tarayıcıda saklanır; tasarım bağlantısına eklenmez.
      </p>
    </section>
  )
}
