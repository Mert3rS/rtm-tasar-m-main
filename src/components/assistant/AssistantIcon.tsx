/**
 * Brand mark for the RTM Tasarım assistant: an angular speech bubble framing a cabinet
 * elevation (frame, centre division, handle square). Stroke uses currentColor so it reads on
 * both the brand icon box and dark surfaces; the corner dot uses --assistant-icon-dot.
 * Shared by the launcher and the panel avatar. No 'use client': it is static markup.
 */
export function AssistantIcon({ className, dot = true }: { className?: string; dot?: boolean }) {
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
      <g className="assistant-icon-bubble">
        <path
          d="M3.5 4.5h17v12.25h-9.5l-4.5 3.75v-3.75h-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="miter"
        />
        <path d="M8 8h8v5.25H8z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 8v5.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.1 10.1h.9v.9h-.9zM13 10.1h.9v.9H13z" fill="currentColor" />
      </g>
      {dot ? (
        <circle
          cx="20.5"
          cy="4.5"
          r="2.25"
          className="assistant-icon-dot"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ) : null}
    </svg>
  )
}
