import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Calculator, Library, Presentation, Users } from 'lucide-react'
import { MgBadge } from './Brand'
import AccountChip from './auth/AccountChip'
import { useAuth } from '../context/AuthContext'
import { fadeUp, springSoft, staggerContainer } from '../motion'

export type HubDest = 'marketing' | 'vendeur' | 'accounts' | 'tco'

const CARDS: {
  dest: HubDest
  title: string
  who: string
  desc: string
  icon: typeof Library
  cta: string
  highlight?: boolean
}[] = [
  {
    dest: 'marketing',
    title: 'Bibliothèque documentaire',
    who: 'Dépôt & organisation',
    desc: 'Ajoutez et organisez les supports par catégorie. La source unique du réseau.',
    icon: Library,
    cta: 'Gérer les documents',
  },
  {
    dest: 'vendeur',
    title: 'Espace Vendeur',
    who: 'Présentation client',
    desc: 'Sélectionnez vos supports et lancez le Sales Mode plein écran.',
    icon: Presentation,
    cta: 'Entrer en présentation',
    highlight: true,
  },
  {
    dest: 'accounts',
    title: 'Gestion des comptes',
    who: 'Administration',
    desc: 'Créez et gérez les comptes vendeurs, rôles et mots de passe.',
    icon: Users,
    cta: 'Gérer les comptes',
  },
  {
    dest: 'tco',
    title: 'Simulateur TCO',
    who: 'Aide à la vente',
    desc: 'Comparez le coût total de possession électrique / essence / diesel et exportez la fiche.',
    icon: Calculator,
    cta: 'Ouvrir le simulateur',
  },
]

export default function Hub({ onNavigate }: { onNavigate: (d: HubDest) => void }) {
  const { user } = useAuth()
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-hidden bg-mg-base">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-mg-red/10 blur-[130px]"
        animate={reduce ? undefined : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity }}
      />

      {/* top bar */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <MgBadge size={34} />
          <span className="text-sm font-extrabold tracking-tight text-mg-ink">
            MG <span className="text-mg-mute font-semibold">Sales Cloud</span>
          </span>
        </div>
        <AccountChip />
      </div>

      <motion.div
        variants={staggerContainer(0.09)}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl px-6 pb-20 pt-8 sm:pt-16"
      >
        <motion.div variants={fadeUp} className="overline">
          Espace d’administration
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mt-2 text-3xl font-extrabold tracking-tight text-mg-ink sm:text-4xl"
        >
          Bonjour, {user?.displayName?.split(' ')[0] || 'Imane'}.
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 max-w-xl text-mg-ink-soft">
          Que souhaitez-vous faire aujourd’hui&nbsp;?
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <HubCard key={c.dest} {...c} onClick={() => onNavigate(c.dest)} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

function HubCard({
  title,
  who,
  desc,
  icon: Icon,
  cta,
  highlight,
  onClick,
}: {
  title: string
  who: string
  desc: string
  icon: typeof Library
  cta: string
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-mg-panel p-6 text-left shadow-card transition-shadow hover:shadow-card-hover ${
        highlight ? 'border-mg-red/30' : 'border-mg-line'
      }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-mg-red/10 blur-2xl" />
      )}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          highlight ? 'bg-mg-grad text-white shadow-glow' : 'bg-mg-wash text-mg-ink'
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-mg-ink">{title}</h3>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-mg-mute">{who}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mg-ink-soft">{desc}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-mg-red">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  )
}
