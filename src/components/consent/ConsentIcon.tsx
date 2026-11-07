/** Line shield with a lime accent dot (consent card and re-open button). Static markup. */
export function ConsentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3.25 19.25 6v5.4c0 4.4-3 7.75-7.25 9.35-4.25-1.6-7.25-4.95-7.25-9.35V6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      <path d="M8.75 12.1 11 14.3l4.25-4.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.6" cy="5.4" r="2" className="consent-icon-dot" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}
