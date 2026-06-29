import type { Transition, Variants } from 'framer-motion'

/**
 * Shared motion language for MG Sales Cloud.
 *
 * Import these instead of re-declaring variants per component so every
 * surface eases, springs and staggers identically. Keep timing in here —
 * tweak once, the whole app moves together.
 */

/** Signature MG easing — a smooth, slightly overshooting ease-out. */
export const EASE = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/** Springs */
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26 }
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 30 }
export const springBouncy: Transition = { type: 'spring', stiffness: 300, damping: 18 }

/** Entrance: fade up */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: EASE } },
}

/** Entrance: fade */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

/** Entrance: pop / scale in */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 18 },
  show: { opacity: 1, scale: 1, y: 0, transition: springBouncy },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } },
}

/** Stagger parent — children animate in sequence. */
export function staggerContainer(stagger = 0.07, delayChildren = 0.04): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren },
    },
  }
}

/** Horizontal slide set for paged content (custom = direction sign). */
export const slideX: Variants = {
  enter: (d: number) => ({ x: d >= 0 ? 80 : -80, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d >= 0 ? -80 : 80, opacity: 0, scale: 0.98 }),
}

/** Common hover/tap presets for interactive cards & buttons. */
export const hoverLift = {
  whileHover: { y: -6, transition: springSoft },
  whileTap: { scale: 0.97 },
}
export const hoverPop = {
  whileHover: { scale: 1.06, transition: springSoft },
  whileTap: { scale: 0.96 },
}
