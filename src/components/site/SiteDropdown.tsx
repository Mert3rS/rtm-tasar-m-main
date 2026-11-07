'use client'

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'

export type SiteDropdownOption = {
  label: string
  value: string
}

type Props = {
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  className?: string
  defaultValue?: string
  disabled?: boolean
  id?: string
  label: string
  name?: string
  onValueChange?: (value: string) => void
  options: readonly SiteDropdownOption[]
  required?: boolean
  value?: string
  variant?: 'default' | 'studio'
}

export function SiteDropdown({
  ariaDescribedBy,
  ariaInvalid,
  className,
  defaultValue = '',
  disabled = false,
  id,
  label,
  name,
  onValueChange,
  options,
  required,
  value,
  variant = 'default',
}: Props) {
  const generatedId = useId()
  const controlId = id ?? `site-dropdown-${generatedId}`
  const listId = `${controlId}-options`
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState<CSSProperties | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const focusOptionOnOpen = useRef(false)
  const currentValue = value ?? internalValue
  const selectedIndex = options.findIndex((option) => option.value === currentValue)
  const selectedLabel =
    selectedIndex >= 0 ? options[selectedIndex]?.label : options[0]?.label ?? 'Seçim yapın'

  const updateMenuPosition = () => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const gap = 6
    const edge = 12
    const below = window.innerHeight - rect.bottom - edge - gap
    const above = rect.top - edge - gap
    const openAbove = below < 160 && above > below
    const maxHeight = Math.min(240, Math.max(120, openAbove ? above : below))
    setMenuPosition({
      bottom: openAbove ? window.innerHeight - rect.top + gap : undefined,
      left: Math.max(edge, Math.min(rect.left, window.innerWidth - rect.width - edge)),
      maxHeight,
      position: 'fixed',
      top: openAbove ? undefined : rect.bottom + gap,
      width: rect.width,
    })
  }

  const openMenu = (focusOption: boolean) => {
    if (disabled) return
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0
    setActiveIndex(nextIndex)
    focusOptionOnOpen.current = focusOption
    updateMenuPosition()
    setIsOpen(true)
  }

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const selectValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
    closeMenu(true)
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updateMenuPosition()
    if (focusOptionOnOpen.current) {
      focusOptionOnOpen.current = false
      optionRefs.current[activeIndex]?.focus()
    }
  }, [activeIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      closeMenu()
    }
    const handleViewportChange = () => updateMenuPosition()
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen])

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return
    const handleExternalValue = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') return
      const nextValue = event.detail
      if (!options.some((option) => option.value === nextValue)) return
      if (value === undefined) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }
    button.addEventListener('site-dropdown:set', handleExternalValue)
    return () => button.removeEventListener('site-dropdown:set', handleExternalValue)
  }, [onValueChange, options, value])

  const focusOption = (index: number) => {
    const nextIndex = (index + options.length) % options.length
    setActiveIndex(nextIndex)
    optionRefs.current[nextIndex]?.focus()
  }

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(index + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(options.length - 1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
    }
  }

  const menu = isOpen && menuPosition && typeof document !== 'undefined'
    ? createPortal(
        <ul
          aria-label={`${label} seçenekleri`}
          className={`site-dropdown__menu site-dropdown__menu--${variant}`}
          id={listId}
          ref={menuRef}
          role="listbox"
          style={menuPosition}
        >
          {options.map((option, index) => (
            <li key={option.value} role="none">
              <button
                aria-selected={currentValue === option.value}
                className={currentValue === option.value ? 'is-selected' : undefined}
                onClick={() => selectValue(option.value)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                role="option"
                tabIndex={index === activeIndex ? 0 : -1}
                type="button"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )
    : null

  return (
    <div
      className={`site-dropdown site-dropdown--${variant}${isOpen ? ' site-dropdown--open' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      {name ? <input name={name} type="hidden" value={currentValue} /> : null}
      <button
        aria-controls={listId}
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={ariaInvalid || undefined}
        aria-label={label}
        aria-required={required || undefined}
        className="site-dropdown__button"
        disabled={disabled}
        id={controlId}
        onClick={() => (isOpen ? closeMenu() : openMenu(false))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu(true)
          } else if (event.key === 'Escape' && isOpen) {
            event.preventDefault()
            closeMenu(true)
          }
        }}
        ref={buttonRef}
        role="combobox"
        type="button"
      >
        <span>{selectedLabel}</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="m19 9-7 7-7-7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {menu}
    </div>
  )
}
