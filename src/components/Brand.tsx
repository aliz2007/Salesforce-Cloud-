import { motion } from 'framer-motion'
import clsx from 'clsx'

/** MG hexagon badge. */
export function MgBadge({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <path
        d="M32 5l23.4 13.5v27L32 59 8.6 45.5v-27L32 5z"
        fill="none"
        stroke="url(#mgStroke)"
        strokeWidth="3"
      />
      <text
        x="32"
        y="41"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="#fff"
        textAnchor="middle"
      >
        MG
      </text>
      <defs>
        <linearGradient id="mgStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF2D45" />
          <stop offset="1" stopColor="#B30015" />
        </linearGradient>
      </defs>
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
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mg-red">
          {subtitle}
        </div>
      </div>
    </Comp>
  )
}
