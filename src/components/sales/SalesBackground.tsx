import { useReducedMotion } from 'framer-motion'
import { useSalesSettings } from '../../context/SalesSettings'

/**
 * Full-screen Sales-Mode backdrop. Either an uploaded custom image (cover, with
 * a subtle ken-burns drift + a dark scrim for legibility) or the active theme's
 * painted background plus a few large blurred ambient blobs that drift.
 *
 * Always pointer-events-none so it never intercepts clicks on the board.
 */
export default function SalesBackground() {
  const { currentTheme, customBg } = useSalesSettings()
  const reduce = useReducedMotion()
  const isDarkTheme = currentTheme.kind === 'dark'

  if (customBg) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={customBg}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover ${
            reduce ? '' : 'animate-ken-burns'
          }`}
          draggable={false}
        />
        {/* dark scrim so foreground text/cards stay legible over any photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
        <div className="absolute inset-0 bg-black/25" />
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: currentTheme.background }}
    >
      {/* ambient drifting blobs tinted with the theme glow */}
      <Blob
        className="-top-44 left-1/2 h-[560px] w-[760px] -translate-x-1/2"
        color={currentTheme.glow}
        opacity={isDarkTheme ? 0.32 : 0.22}
        animate={reduce ? 'none' : 'aurora'}
      />
      <Blob
        className="-bottom-52 left-[6%] h-[460px] w-[560px]"
        color={currentTheme.glow}
        opacity={isDarkTheme ? 0.2 : 0.16}
        animate={reduce ? 'none' : 'pulse'}
        delay="-6s"
      />
      <Blob
        className="-right-40 top-1/3 h-[420px] w-[480px]"
        color={currentTheme.glow}
        opacity={isDarkTheme ? 0.16 : 0.12}
        animate={reduce ? 'none' : 'aurora'}
        delay="-11s"
      />

      {/* faint dotted grid — dark themes only */}
      {isDarkTheme && (
        <div className="bg-grid-dark absolute inset-0 opacity-50" />
      )}
    </div>
  )
}

function Blob({
  className,
  color,
  opacity,
  animate,
  delay,
}: {
  className: string
  color: string
  opacity: number
  animate: 'aurora' | 'pulse' | 'none'
  delay?: string
}) {
  const animClass =
    animate === 'aurora'
      ? 'animate-aurora'
      : animate === 'pulse'
        ? 'animate-pulse-glow'
        : ''
  return (
    <div
      className={`absolute rounded-full blur-[130px] ${animClass} ${className}`}
      style={{
        backgroundColor: color,
        opacity,
        animationDelay: delay,
      }}
    />
  )
}
