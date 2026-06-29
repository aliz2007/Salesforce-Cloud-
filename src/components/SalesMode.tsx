import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowLeft, Play } from 'lucide-react'
import type { DocMeta } from '../types'
import { useStore } from '../context/StoreContext'
import { CATEGORY_MAP } from '../data/categories'
import { MgBadge } from './Brand'
import { useThumb } from '../hooks'
import DocViewer from './DocViewer'

type Phase = 'board' | 'stage'

export default function SalesMode({ onExit }: { onExit: () => void }) {
  const { selectedDocs } = useStore()
  const [phase, setPhase] = useState<Phase>('board')
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0])

  // Organise the selected files by name — the board is sorted alphabetically.
  const docs = useMemo(
    () => [...selectedDocs].sort((a, b) => a.title.localeCompare(b.title, 'fr')),
    [selectedDocs],
  )

  const open = useCallback((i: number) => {
    setIndex([i, 0])
    setPhase('stage')
  }, [])

  const go = useCallback(
    (delta: number) => {
      setIndex(([i]) => {
        const next = (i + delta + docs.length) % docs.length
        return [next, delta]
      })
    },
    [docs.length],
  )

  if (docs.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mg-stage text-white">
        <p className="text-white/55">Aucun document sélectionné.</p>
        <button onClick={onExit} className="btn-primary mt-4">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-mg-stage text-white">
      <AnimatePresence mode="wait">
        {phase === 'board' && (
          <Board key="board" docs={docs} onPick={open} onExit={onExit} />
        )}
        {phase === 'stage' && (
          <Stage
            key="stage"
            docs={docs}
            index={index}
            dir={dir}
            onNav={go}
            onBack={() => setPhase('board')}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── Bubble board ─────────────────────────── */

function Board({
  docs,
  onPick,
  onExit,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
  onExit: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onExit()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 overflow-y-auto"
    >
      {/* ambient backdrop — light, never competes with the bubbles */}
      <div className="pointer-events-none fixed -top-44 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-mg-red/20 blur-[130px]" />
      <div className="pointer-events-none fixed -bottom-40 left-[8%] h-[420px] w-[520px] rounded-full bg-mg-red/10 blur-[130px]" />

      {/* minimal chrome: brand mark + exit only */}
      <div className="pointer-events-none fixed left-6 top-6 z-10 opacity-80">
        <MgBadge size={34} />
      </div>
      <button
        onClick={onExit}
        className="fixed right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/[0.14]"
        title="Quitter le Sales Mode (Échap)"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex min-h-screen flex-wrap content-center items-center justify-center gap-x-8 gap-y-11 px-6 py-24 sm:gap-x-10">
        {docs.map((doc, i) => (
          <Bubble key={doc.id} doc={doc} index={i} onClick={() => onPick(i)} />
        ))}
      </div>
    </motion.div>
  )
}

function Bubble({ doc, index, onClick }: { doc: DocMeta; index: number; onClick: () => void }) {
  const thumb = useThumb(doc)
  const cat = CATEGORY_MAP[doc.category]
  const Icon = cat.icon
  // Real photo/video thumbnails fill the circle; demo posters (which embed
  // their own title text) and thumbnail-less files use a clean gradient + icon.
  const showImage = !!thumb && doc.source !== 'seed'

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.06 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      className="group flex w-32 flex-col items-center gap-3.5 sm:w-40 lg:w-44"
    >
      {/* floating circle */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{
          duration: 3.6 + (index % 4) * 0.45,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: (index % 5) * 0.3,
        }}
        className="relative aspect-square w-full overflow-hidden rounded-full border-2 border-white/12 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.7)] ring-0 ring-mg-red/0 transition-[box-shadow,border-color] duration-300 group-hover:border-mg-red/70 group-hover:shadow-glow"
      >
        {showImage ? (
          <img src={thumb} alt={doc.title} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
          >
            <Icon className="h-1/3 w-1/3 text-white/90" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/45" />
        {/* hover play affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
            <Play className="h-6 w-6 translate-x-[1px] text-white" fill="currentColor" />
          </span>
        </div>
      </motion.div>

      {/* caption */}
      <div className="px-1 text-center">
        {doc.model && (
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-mg-red-light">
            {doc.model}
          </div>
        )}
        <div className="line-clamp-2 text-sm font-semibold leading-snug text-white/90">
          {doc.title}
        </div>
      </div>
    </motion.button>
  )
}

/* ─────────────────────────── Focused stage ─────────────────────────── */

const slide = {
  enter: (d: number) => ({ x: d >= 0 ? 70 : -70, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d >= 0 ? -70 : 70, opacity: 0, scale: 0.98 }),
}

function Stage({
  docs,
  index,
  dir,
  onNav,
  onBack,
  onExit,
}: {
  docs: DocMeta[]
  index: number
  dir: number
  onNav: (delta: number) => void
  onBack: () => void
  onExit: () => void
}) {
  const doc = docs[index]
  const cat = CATEGORY_MAP[doc.category]
  const [chrome, setChrome] = useState(true)
  const hideTimer = useRef<number | undefined>(undefined)

  const poke = useCallback(() => {
    setChrome(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setChrome(false), 3500)
  }, [])

  useEffect(() => {
    poke()
    return () => window.clearTimeout(hideTimer.current)
  }, [poke, index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNav(1)
      else if (e.key === 'ArrowLeft') onNav(-1)
      else if (e.key === 'Escape' || e.key === 'Backspace' || e.key.toLowerCase() === 'g') onBack()
      poke()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNav, onBack, poke])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col bg-mg-stage"
      onMouseMove={poke}
      onTouchStart={poke}
    >
      <AnimatePresence>
        {chrome && (
          <motion.header
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> Tableau
              </button>
              <div className="hidden sm:block">
                <div
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: cat.from }}
                >
                  {cat.label} {doc.model ? `· ${doc.model}` : ''}
                </div>
                <div className="text-sm font-semibold">{doc.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs tabular-nums backdrop-blur">
                {index + 1} / {docs.length}
              </span>
              <button
                onClick={onExit}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-mg-red"
                title="Quitter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1 px-4 pb-4 pt-4 sm:px-16 sm:pb-12 sm:pt-20">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={doc.id}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            <DocViewer doc={doc} />
          </motion.div>
        </AnimatePresence>
      </div>

      {docs.length > 1 && (
        <>
          <NavArrow side="left" onClick={() => onNav(-1)} show={chrome} />
          <NavArrow side="right" onClick={() => onNav(1)} show={chrome} />
        </>
      )}
    </motion.div>
  )
}

function NavArrow({
  side,
  onClick,
  show,
}: {
  side: 'left' | 'right'
  onClick: () => void
  show: boolean
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClick}
          className={`absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/25 ${
            side === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
          }`}
        >
          <Icon className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
