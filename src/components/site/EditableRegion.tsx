'use client'

import { useRef, useSyncExternalStore, type HTMLAttributes } from 'react'

function subscribe(onChange: () => void) {
  document.addEventListener('rtm-preview-editing', onChange)
  return () => document.removeEventListener('rtm-preview-editing', onChange)
}

/** Each region owns its focusability so streamed HTML is never changed before hydration. */
export function EditableRegion({
  as,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as: 'article' | 'div' | 'h1' | 'p' | 'section'
  'data-rtm-edit'?: string
}) {
  const element = useRef<HTMLElement>(null)
  const editing = useSyncExternalStore(
    subscribe,
    () =>
      Boolean(
        element.current &&
          window.parent !== window &&
          document.documentElement.dataset.rtmEditMode === 'true' &&
          !element.current.closest('[aria-hidden="true"]'),
      ),
    () => false,
  )

  const Tag = as
  return (
    <Tag
      {...props}
      ref={(node) => {
        element.current = node
      }}
      tabIndex={editing && props['data-rtm-edit'] ? 0 : props.tabIndex}
    />
  )
}
