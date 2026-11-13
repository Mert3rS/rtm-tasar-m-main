import type { ReactNode } from 'react'

// A single small SVG vocabulary; no icon package enters the public bundle.
const paths = {
  panel: 'M4 4h16v16H4zM10 4v16M6 8h2M6 12h2',
  undo: 'M8 5 3 10l5 5M3 10h10a6 6 0 0 1 0 12',
  redo: 'm16 5 5 5-5 5M21 10h-10a6 6 0 0 0 0 12',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  link: 'm9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1',
  human: 'M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4M6 10h12m-6-2v7m0 0-4 6m4-6 4 6',
  door: 'M4 3h16v18H4zM12 3v18m-3-11v3m6-3v3',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  fit: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8z',
  reset: 'M4 9a8 8 0 1 1-1 7M4 3v6h6',
  measure: 'M3 8h18v8H3zM7 8v4m5-4v6m5-6v4',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3',
  unlock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 7-2',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v1',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M18 10h.01M7 14h.01M10 14h7',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 11v6m0-10v.01',
  layers: 'm12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5',
} satisfies Record<string, string>

export function StudioIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export function DetailIcon({ value }: { value: string }): ReactNode {
  const handle =
    value === 'cubuk'
      ? 'M8 5v14m8-14v14'
      : value === 'bas-ac'
        ? 'M9 9h6v6H9z'
        : value === 'yok'
          ? 'm7 7 10 10'
          : 'M5 8h14v3H5z'
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="26" height="26" rx="3" />
      <g transform="translate(4 4)">
        <path d={handle} />
      </g>
    </svg>
  )
}
