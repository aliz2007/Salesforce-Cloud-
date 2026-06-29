import { motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { DocMeta } from '../../../types'
import { useThumb } from '../../../hooks'
import { CATEGORY_MAP } from '../../../data/categories'
import { popIn, springSoft, staggerContainer } from '../../../motion'
import { useSalesSettings } from '../../../context/SalesSettings'

/**
 * Floating circular bubbles. Each bubble drifts on a gentle, deterministic
 * loop (offsets derived from the index — never Math.random — so the motion is
 * stable across renders and reduced-motion can switch it off cleanly).
 */
export default function BubblesLayout({
  docs,
  onPick,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
}) {
  return (
    <motion.div
      variants={staggerContainer(0.05, 0.05)}
      initial="hidden"
      animate="show"
      className="flex min-h-full flex-wrap content-center items-center justify-center gap-x-8 gap-y-11 px-6 py-24 sm:gap-x-10"
    >
      {docs.map((doc, i) => (
        <Bubble key={doc.id} doc={doc} index={i} onClick={() => onPick(i)} />
      ))}
    </motion.div>
  )
}

function Bubble({
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
  // Real photo/video thumbnails fill the circle; demo posters (which embed
  // their own title text) and thumbnail-less files use a clean gradient + icon.
  const showImage = !!thumb && doc.source !== 'seed'

  const drifting = float && !reduce
  // Deterministic per-index variation (no randomness).
  const duration = 3.6 + (index % 4) * 0.45
  const delay = (index % 5) * 0.3
  const amplitude = 6 + (index % 3) * 1.5

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={popIn}
      whileHover={{ scale: 1.06, transition: springSoft }}
      whileTap={{ scale: 0.97 }}
      className="group flex w-32 flex-col items-center gap-3.5 outline-none focus-visible:scale-[1.04] sm:w-40 lg:w-44"
      aria-label={`Ouvrir ${doc.title}`}
    >
      <motion.div
        animate={drifting ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={
          drifting
            ? { duration, repeat: Infinity, ease: 'easeInOut', delay }
            : { duration: 0.3 }
        }
        className="relative aspect-square w-full overflow-hidden rounded-full border-2 border-white/12 shadow-bubble ring-2 ring-mg-red/0 transition-[box-shadow,border-color,--tw-ring-color] duration-300 group-hover:border-mg-red/70 group-hover:shadow-glow group-hover:ring-mg-red/50 group-focus-visible:ring-mg-red/60"
      >
        {showImage ? (
          <img
            src={thumb}
            alt={doc.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
          >
            <Icon className="h-1/3 w-1/3 text-white/90" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/45" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
            <Play className="h-6 w-6 translate-x-[1px] text-white" fill="currentColor" />
          </span>
        </div>
      </motion.div>

      <div className="px-1 text-center">
        {doc.model && (
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-mg-red-light">
            {doc.model}
          </div>
        )}
        <div className="line-clamp-2 text-sm font-semibold leading-snug">{doc.title}</div>
      </div>
    </motion.button>
  )
}
