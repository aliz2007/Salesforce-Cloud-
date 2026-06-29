import { motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { DocMeta } from '../../../types'
import { useThumb } from '../../../hooks'
import { CATEGORY_MAP } from '../../../data/categories'
import { popIn, springSoft, staggerContainer } from '../../../motion'
import { useSalesSettings } from '../../../context/SalesSettings'

/**
 * A clean responsive grid of square tiles. Image cover (or category
 * gradient + icon for seed posters), bottom scrim with title/model, hover
 * lift + image zoom + glow ring + Play badge.
 */
export default function GridLayout({
  docs,
  onPick,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
}) {
  return (
    <motion.div
      variants={staggerContainer(0.045, 0.05)}
      initial="hidden"
      animate="show"
      className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 px-6 py-24 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
    >
      {docs.map((doc, i) => (
        <Tile key={doc.id} doc={doc} index={i} onClick={() => onPick(i)} />
      ))}
    </motion.div>
  )
}

function Tile({
  doc,
  index,
  onClick,
}: {
  doc: DocMeta
  index: number
  onClick: () => void
}) {
  const reduce = useReducedMotion()
  const { float } = useSalesSettings()
  const thumb = useThumb(doc)
  const cat = CATEGORY_MAP[doc.category]
  const Icon = cat.icon
  const showImage = !!thumb && doc.source !== 'seed'

  const drifting = float && !reduce
  const duration = 4.4 + (index % 5) * 0.5
  const delay = (index % 6) * 0.25
  const amplitude = 5 + (index % 3)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={popIn}
      whileHover={{ y: -6, transition: springSoft }}
      whileTap={{ scale: 0.97 }}
      className="group relative block aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left shadow-bubble outline-none ring-2 ring-mg-red/0 transition-[box-shadow,--tw-ring-color] duration-300 hover:shadow-glow hover:ring-mg-red/60 focus-visible:ring-mg-red/70"
      aria-label={`Ouvrir ${doc.title}`}
    >
      <motion.div
        className="absolute inset-0"
        animate={drifting ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={
          drifting
            ? { duration, repeat: Infinity, ease: 'easeInOut', delay }
            : { duration: 0.3 }
        }
      >
        {showImage ? (
          <img
            src={thumb}
            alt={doc.title}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center transition-transform duration-[600ms] ease-out group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
          >
            <Icon className="h-1/4 w-1/4 text-white/90" />
          </div>
        )}
      </motion.div>

      {/* legibility scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      {/* hover play affordance */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
          <Play className="h-6 w-6 translate-x-[1px] text-white" fill="currentColor" />
        </span>
      </div>

      {/* caption */}
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        {doc.model && (
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-mg-red-light">
            {doc.model}
          </div>
        )}
        <div className="line-clamp-2 text-sm font-semibold leading-snug drop-shadow">
          {doc.title}
        </div>
      </div>
    </motion.button>
  )
}
