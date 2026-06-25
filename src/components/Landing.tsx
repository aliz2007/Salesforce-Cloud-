import { motion } from 'framer-motion'
import { ArrowRight, UploadCloud, Presentation } from 'lucide-react'
import type { Role } from '../types'
import { MgBadge } from './Brand'
import { useStore } from '../context/StoreContext'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function Landing({ onPick }: { onPick: (role: Role) => void }) {
  const { docs } = useStore()

  return (
    <div className="relative min-h-screen overflow-hidden bg-mg-black">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-mg-red/20 blur-[140px]"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16"
      >
        <motion.div variants={item}>
          <MgBadge size={68} />
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-7 text-center text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl"
        >
          MG Maroc <span className="text-mg-red">Sales Cloud</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 max-w-xl text-center text-base text-mg-mute sm:text-lg text-balance"
        >
          Le marketing dépose les supports, le vendeur les présente. Un espace unique pour
          tarifs, fiches techniques, photos, vidéos, comparatifs et offres MG.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-12 grid w-full gap-5 sm:grid-cols-2"
        >
          <RoleCard
            role="marketing"
            title="Espace Marketing"
            who="Imane · Direction Marketing & Communication"
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

        <motion.div variants={item} className="mt-10 text-xs text-mg-mute/70">
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
  return (
    <motion.button
      onClick={() => onPick(role)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`group relative overflow-hidden rounded-3xl border p-7 text-left transition-colors ${
        highlight
          ? 'border-mg-red/40 bg-gradient-to-b from-mg-red/[0.12] to-transparent'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mg-red/30 blur-3xl transition-opacity group-hover:opacity-80" />
      )}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          highlight ? 'bg-mg-grad text-white shadow-glow' : 'bg-white/[0.06] text-white'
        }`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-mg-mute">{who}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{desc}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mg-red">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  )
}
