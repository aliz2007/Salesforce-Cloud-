import clsx from 'clsx'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin-slow', className)}
      viewBox="0 0 24 24"
      fill="none"
      width="1em"
      height="1em"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#0F7A6B'
  if (score >= 60) return '#C2941F'
  return '#CF5B33'
}

/** Animated circular score gauge. */
export function ScoreRing({
  score,
  size = 132,
  label,
  sublabel,
}: {
  score: number
  size?: number
  label?: string
  sublabel?: string
}) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * (1 - Math.max(0, Math.min(100, score)) / 100)
  const color = scoreColor(score)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E7DFD0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          className="animate-draw"
          style={{ ['--dash' as any]: `${c}px` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl font-semibold leading-none" style={{ color }}>
          {Math.round(score)}
        </span>
        {label && <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide2 text-mute">{label}</span>}
        {sublabel && <span className="text-[11px] text-mute">{sublabel}</span>}
      </div>
    </div>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-serif text-xl font-semibold text-card shadow-brand">
        L
      </div>
      <div className="leading-tight">
        <div className="font-serif text-lg font-semibold tracking-tight">LinguaRead</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide2 text-mute">read · explain · master</div>
      </div>
    </div>
  )
}
