import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Authentic MG octagon badge (Morris Garages mark): red octagon ring with a
 * white interior and the interlocking red "MG" monogram. The white fill keeps
 * the mark legible on both light surfaces and the dark Sales-Mode stage.
 */
export function MgBadge({
  size = 40,
  className,
  /** Kept for API compatibility; the official mark renders identically. */
  variant: _variant,
}: {
  size?: number
  className?: string
  variant?: 'solid' | 'outline'
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="MG"
    >
      {/* Octagon: white interior + red ring (stroke straddles the path). */}
      <path
        d="M29 4 H71 L96 29 V71 L71 96 H29 L4 71 V29 Z"
        fill="#ffffff"
        stroke="#E11D24"
        strokeWidth="8.5"
        strokeLinejoin="round"
      />
      {/* Interlocking MG monogram. */}
      <g fill="#E11D24">
        <path d="M16 26 H25 V76 H16 Z" />
        <path d="M43 26 H52 V76 H43 Z" />
        <path d="M16 26 H25 L38 60 H29 Z" />
        <path d="M52 26 H43 L30 60 H39 Z" />
        <path d="M83.34 35.6 A22 25 0 1 0 83.34 66.4 L75.85 60.55 A12.5 15.5 0 1 1 75.85 41.45 Z" />
        <path d="M64 46.5 H80 V55.5 H64 Z" />
      </g>
    </svg>
  )
}

export function Wordmark({
  className,
  subtitle = 'Sales Cloud',
  animate = false,
}: {
  className?: string
  subtitle?: string
  animate?: boolean
}) {
  const Comp = animate ? motion.div : 'div'
  return (
    <Comp
      className={clsx('flex items-center gap-3', className)}
      {...(animate
        ? {
            initial: { opacity: 0, y: -8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: 'easeOut' },
          }
        : {})}
    >
      <MgBadge size={36} />
      <div className="leading-none">
        <div className="text-[15px] font-extrabold tracking-tight">
          MG <span className="text-mg-mute font-semibold">Maroc</span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mg-red">
          {subtitle}
        </div>
      </div>
    </Comp>
  )
}
