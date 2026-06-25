import { useId } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * MG octagon badge (Morris Garages mark) — filled deep-red octagon with the
 * MG monogram. `variant` toggles a solid fill vs. an outline treatment.
 */
export function MgBadge({
  size = 40,
  className,
  variant = 'solid',
}: {
  size?: number
  className?: string
  variant?: 'solid' | 'outline'
}) {
  const id = useId().replace(/:/g, '')
  // Vertically-elongated octagon, MG's signature silhouette.
  const octagon = 'M24 3 H40 L51 15 V49 L40 61 H24 L13 49 V15 Z'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="MG">
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E11519" />
          <stop offset="1" stopColor="#9E0E12" />
        </linearGradient>
      </defs>
      {variant === 'solid' ? (
        <>
          <path d={octagon} fill={`url(#fill-${id})`} stroke="#F26D6F" strokeWidth="1.25" />
          <path
            d={octagon}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            transform="scale(0.86) translate(5.2 5.2)"
          />
        </>
      ) : (
        <path d={octagon} fill="none" stroke={`url(#fill-${id})`} strokeWidth="3" />
      )}
      <text
        x="32"
        y="40.5"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="20"
        fontWeight="900"
        letterSpacing="-0.5"
        fill="#fff"
        textAnchor="middle"
      >
        MG
      </text>
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
