import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Official MG badge. Uses the real MG logo artwork (transparent PNG) so it
 * sits cleanly on both light surfaces and the dark Sales-Mode stage.
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
    <img
      src="/mg-logo.png"
      alt="MG"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      draggable={false}
    />
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
