type BrandLogoProps = {
  ariaLabel?: string
  className?: string
  decorative?: boolean
  variant?: 'full' | 'icon' | 'mark'
}

const rPath =
  'M78 22H208C241 22 258 40 249 69C242 93 220 104 191 104H124L93 166H26L80 58H191C200 58 205 55 208 48C210 42 206 39 197 39H69L78 22ZM146 104H204L246 166H179L146 104Z'
const tPath = 'M275 22H451L433 60H376L323 166H257L310 60H256L275 22Z'
const mPath =
  'M463 22H524L550 102L618 22H681L625 166H568L604 73L555 132H514L492 73L456 166H399L463 22Z'

export function BrandLogo({
  ariaLabel = 'RTM Tasarım',
  className,
  decorative = false,
  variant = 'full',
}: BrandLogoProps) {
  const viewBox =
    variant === 'icon' ? '0 0 260 180' : variant === 'mark' ? '0 0 700 180' : '0 0 700 285'

  return (
    <svg
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : 'img'}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor" transform="skewX(-5)">
        <path d={rPath} />
        {variant !== 'icon' ? (
          <>
            <path d={tPath} />
            <path d={mPath} />
          </>
        ) : null}
      </g>
      {variant === 'full' ? (
        <>
          <path d="M24 185H674" fill="none" stroke="currentColor" strokeWidth="5" />
          <text
            fill="currentColor"
            fontFamily="Arial Black, Arial, sans-serif"
            fontSize="77"
            fontStyle="italic"
            fontWeight="900"
            lengthAdjust="spacingAndGlyphs"
            textLength="646"
            x="22"
            y="263"
          >
            TASARIM
          </text>
        </>
      ) : null}
    </svg>
  )
}
