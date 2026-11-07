'use client'
import { StudioIcon } from '../StudioIcon'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { SiteDropdown } from '@/components/site/SiteDropdown'

export function NumberField({
  label,
  value,
  min,
  max,
  step = 0.5,
  onChange,
  disabled = false,
  slider = true,
  recommended,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
  disabled?: boolean
  slider?: boolean
  recommended?: readonly [number, number]
}) {
  const id = useId()
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<{ base: number; text: string } | null>(null)
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  function commit(raw: string) {
    const n = Number(raw)
    if (!raw || !Number.isFinite(n) || n < min || n > max) {
      setError(`${min}–${max} cm arasında bir değer girin.`)
      return
    }
    setError('')
    onChange(n)
    setDraft(null)
  }
  return (
    <div className="dc-number-field">
      <label htmlFor={id}>{label}</label>
      <div className="dc-number">
        <button
          aria-label={`${label} azalt`}
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          type="button"
        >
          <StudioIcon name="minus" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={draft?.base === value ? draft.text : value}
          onChange={(e) => setDraft({ base: value, text: e.target.value })}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={(e) => {
            commit(e.target.value)
            setDraft(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const increment = e.shiftKey ? 10 : step
              commit(
                String(
                  Math.max(
                    min,
                    Math.min(max, value + (e.key === 'ArrowUp' ? increment : -increment)),
                  ),
                ),
              )
            }
            if (e.key === 'Enter') {
              commit(e.currentTarget.value)
              setDraft(null)
            }
          }}
        />
        <span>cm</span>
        <button
          aria-label={`${label} artır`}
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          type="button"
        >
          <StudioIcon name="plus" />
        </button>
      </div>
      {slider ? (
        <div className="dc-slider-wrap">
          {recommended ? (
            <span
              className="dc-recommended-band"
              aria-hidden="true"
              style={{
                left: `${((recommended[0] - min) / (max - min)) * 100}%`,
                width: `${((recommended[1] - recommended[0]) / (max - min)) * 100}%`,
              }}
            />
          ) : null}
          <input
            aria-label={`${label} sürgüsü`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onKeyDown={(e) => {
              if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
                e.preventDefault()
                e.stopPropagation()
                const direction = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1
                onChange(Math.max(min, Math.min(max, value + direction * (e.shiftKey ? 10 : step))))
              }
            }}
            onChange={(e) => {
              const next = Number(e.target.value)
              cancelAnimationFrame(frame.current)
              frame.current = requestAnimationFrame(() => onChange(next))
            }}
          />
          <div className="dc-range-labels">
            <span>{min} cm</span>
            {recommended ? (
              <span>
                Önerilen: {recommended[0]}–{recommended[1]}
              </span>
            ) : null}
            <span>{max} cm</span>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="dc-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
export function SelectField<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: T
  values: readonly T[] | readonly { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = useId()
  const options = values.map((item) => ({
    label: typeof item === 'string' ? item : item.label,
    value: typeof item === 'string' ? item : item.value,
  }))
  return (
    <div className="dc-field">
      <span>{label}</span>
      <SiteDropdown
        id={id}
        label={label}
        options={options}
        value={value}
        variant="studio"
        onValueChange={(nextValue) => {
          const option = values.find(
            (item) => (typeof item === 'string' ? item : item.value) === nextValue,
          )
          if (option) onChange(typeof option === 'string' ? option : option.value)
        }}
      />
    </div>
  )
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="dc-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  )
}
export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dc-field-group">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
