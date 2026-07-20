type PrivateLedgerMarkProps = {
  className?: string
}

export function PrivateLedgerMark({ className = 'monogram' }: PrivateLedgerMarkProps) {
  return <svg
    className={className}
    viewBox="0 0 48 48"
    width="48"
    height="48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    shapeRendering="geometricPrecision"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="5" y="7" width="38" height="34" rx="3" />
    <line x1="13" y1="7" x2="13" y2="41" />
    <line x1="30" y1="18" x2="36" y2="18" />
  </svg>
}
