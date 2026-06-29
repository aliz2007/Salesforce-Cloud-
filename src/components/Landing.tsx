import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion'
import { ArrowRight, UploadCloud, Presentation } from 'lucide-react'
import type { Role } from '../types'
import { MgBadge } from './Brand'
import { useStore } from '../context/StoreContext'
import { staggerContainer, fadeUp, springSoft } from '../motion'

/** Spring options for useSpring (mirrors springSoft's feel; useSpring wants SpringOptions, not Transition). */
const TILT_SPRING = { stiffness: 260, damping: 26 } as const

export default function Landing({ onPick }: { onPick: (role: Role) => void }) {
  const { docs } = useStore()
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-hidden bg-mg-base">
      {/* Ambient — living aurora / mesh */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-mg-wash to-transparent" />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary MG-red bloom, top */}
        <motion.div
          className={`absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-mg-red/15 blur-[140px] ${
            reduce ? '' : 'animate-pulse-glow'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Drifting red blob, left */}
        <div
          className={`absolute -left-32 top-1/3 h-[460px] w-[460px] rounded-full bg-mg-red-light/12 blur-[130px] ${
            reduce ? '' : 'animate-aurora'
          }`}
        />
        {/* Warm amber counter-hue, right */}
        <div
          className={`absolute -right-28 top-1/2 h-[420px] w-[420px] rounded-full bg-amber-400/12 blur-[130px] ${
            reduce ? '' : 'animate-float-slow'
          }`}
        />
      </div>

      <motion.div
        variants={staggerContainer(0.1, 0.05)}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16"
      >
        <motion.div variants={fadeUp}>
          <motion.div
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MgBadge size={64} />
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 overline">
          Animés par la passion
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-3 text-center text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl"
        >
          MG Maroc{' '}
          <span
            className={`bg-gradient-to-r from-mg-red via-mg-red-light to-mg-red bg-clip-text text-mg-red text-transparent [background-size:200%_auto] ${
              reduce ? '' : 'animate-gradient-pan'
            }`}
          >
            Sales Cloud
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-4 max-w-xl text-center text-base text-mg-ink-soft sm:text-lg text-balance"
        >
          Le marketing dépose les supports, le vendeur les présente. Un espace unique pour
          tarifs, fiches techniques, photos, vidéos, comparatifs et offres MG.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-12 grid w-full gap-5 sm:grid-cols-2">
          <RoleCard
            role="marketing"
            title="Espace Marketing"
            who="Direction Marketing & Communication"
            desc="Déposez et organisez les documents par catégorie. C’est la source unique du réseau."
            icon={<UploadCloud className="h-6 w-6" />}
            cta="Gérer les documents"
            onPick={onPick}
          />
          <RoleCard
            role="vendeur"
            title="Espace Vendeur"
            who="Forces de vente · Showroom"
            desc="Sélectionnez vos supports, passez en Sales Mode et présentez au client, plein écran."
            icon={<Presentation className="h-6 w-6" />}
            cta="Entrer dans l’espace vente"
            highlight
            onPick={onPick}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10 text-xs text-mg-mute">
          {docs.length} document{docs.length > 1 ? 's' : ''} disponible
          {docs.length > 1 ? 's' : ''} · Démo locale (IndexedDB)
        </motion.div>
      </motion.div>
    </div>
  )
}

function RoleCard({
  role,
  title,
  who,
  desc,
  icon,
  cta,
  highlight,
  onPick,
}: {
  role: Role
  title: string
  who: string
  desc: string
  icon: React.ReactNode
  cta: string
  highlight?: boolean
  onPick: (r: Role) => void
}) {
  const reduce = useReducedMotion()

  // Pointer-driven 3D tilt.
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), TILT_SPRING)
  const rotateY = useSpring(useTransform(px, [0, 1], [-8, 8]), TILT_SPRING)

  // Cursor-following radial highlight.
  const glowX = useTransform(px, [0, 1], ['0%', '100%'])
  const glowY = useTransform(py, [0, 1], ['0%', '100%'])
  const glow = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, rgba(225,29,36,0.14), transparent 60%)`

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }
  const handlePointerLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.button
      onClick={() => onPick(role)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
      style={
        reduce
          ? undefined
          : { rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }
      }
      className={`group relative overflow-hidden rounded-2xl border bg-mg-panel p-7 text-left shadow-card transition-shadow hover:shadow-card-hover ${
        highlight ? 'border-mg-red/30' : 'border-mg-line'
      }`}
    >
      {/* Cursor-following glow highlight */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glow }}
        />
      )}
      {highlight && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-mg-red/10 blur-2xl transition-all duration-500 group-hover:bg-mg-red/20" />
      )}
      <motion.div
        style={reduce ? undefined : { transform: 'translateZ(36px)' }}
        whileHover={reduce ? undefined : { rotate: -6, scale: 1.08 }}
        transition={springSoft}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${
          highlight ? 'bg-mg-grad text-white shadow-glow' : 'bg-mg-wash text-mg-ink'
        }`}
      >
        {icon}
      </motion.div>
      <h3 className="relative mt-5 text-xl font-bold text-mg-ink">{title}</h3>
      <p className="relative mt-1 text-[11px] font-bold uppercase tracking-wider text-mg-mute">
        {who}
      </p>
      <p className="relative mt-3 text-sm leading-relaxed text-mg-ink-soft">{desc}</p>
      <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mg-red">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
      </div>
    </motion.button>
  )
}
