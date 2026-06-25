import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Play,
} from 'lucide-react'
import type { DocMeta } from '../types'
import { useStore } from '../context/StoreContext'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'
import { MgBadge } from './Brand'
import { useThumb } from '../hooks'
import DocViewer from './DocViewer'

type Phase = 'intro' | 'menu' | 'stage'

export default function SalesMode({ onExit }: { onExit: () => void }) {
  const { selectedDocs } = useStore()
  const [phase, setPhase] = useState<Phase>('intro')
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0])

  // Auto-advance the intro.
  useEffect(() => {
    if (phase !== 'intro') return
    const t = setTimeout(() => setPhase('menu'), 1900)
    return () => clearTimeout(t)
  }, [phase])

  const open = useCallback((i: number) => {
    setIndex([i, 0])
    setPhase('stage')
  }, [])

  const go = useCallback(
    (delta: number) => {
      setIndex(([i]) => {
        const next = (i + delta + selectedDocs.length) % selectedDocs.length
        return [next, delta]
      })
    },
    [selectedDocs.length],
  )

  if (selectedDocs.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mg-black">
        <p className="text-mg-mute">Aucun document sélectionné.</p>
        <button onClick={onExit} className="btn-primary mt-4">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-mg-black">
      <AnimatePresence mode="wait">
        {phase === 'intro' && <Intro key="intro" onSkip={() => setPhase('menu')} />}

        {phase === 'menu' && (
          <Menu key="menu" docs={selectedDocs} onPick={open} onExit={onExit} onPlayAll={() => open(0)} />
        )}

        {phase === 'stage' && (
          <Stage
            key="stage"
            docs={selectedDocs}
            index={index}
            dir={dir}
            onNav={go}
            onJump={(i) => setIndex([i, i > index ? 1 : -1])}
            onMenu={() => setPhase('menu')}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── Intro ─────────────────────────── */

function Intro({ onSkip }: { onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
      onClick={onSkip}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-mg-black"
    >
      <motion.div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-mg-red/25 blur-[120px]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateY: 90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <MgBadge size={96} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-7 text-center"
      >
        <div className="text-3xl font-extrabold tracking-tight">
          Sales <span className="text-mg-red">Mode</span>
        </div>
        <div className="mt-2 text-sm uppercase tracking-[0.3em] text-mg-mute">MG Maroc</div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────── Menu ─────────────────────────── */

function Menu({
  docs,
  onPick,
  onExit,
  onPlayAll,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
  onExit: () => void
  onPlayAll: () => void
}) {
  // index lookup so a grouped tile knows its absolute position
  const indexOf = useMemo(() => new Map(docs.map((d, i) => [d.id, i])), [docs])
  const groups = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        items: docs.filter((d) => d.category === cat.id),
      })).filter((g) => g.items.length > 0),
    [docs],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 overflow-y-auto"
    >
      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none fixed -top-32 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-mg-red/15 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* header */}
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-mg-red">
              <MgBadge size={30} />
              <span className="text-xs font-semibold uppercase tracking-[0.25em]">Sales Mode</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Votre présentation
            </h1>
            <p className="mt-2 text-mg-mute">
              {docs.length} support{docs.length > 1 ? 's' : ''} prêt{docs.length > 1 ? 's' : ''} ·
              choisissez par quoi commencer
            </p>
          </motion.div>
          <button
            onClick={onExit}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
            title="Quitter le Sales Mode"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onPlayAll}
          className="btn-primary mt-7 px-6 py-3 text-base"
        >
          <Play className="h-5 w-5" fill="currentColor" />
          Démarrer la présentation
        </motion.button>

        {/* grouped grid */}
        <div className="mt-10 space-y-10 pb-16">
          {groups.map((g, gi) => {
            const Icon = g.cat.icon
            return (
              <motion.section
                key={g.cat.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + gi * 0.07 }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: `linear-gradient(135deg, ${g.cat.from}, ${g.cat.to})` }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">
                    {g.cat.label}
                  </h2>
                  <span className="text-xs text-mg-mute">{g.items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {g.items.map((d) => (
                    <MenuTile key={d.id} doc={d} onClick={() => onPick(indexOf.get(d.id)!)} />
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function MenuTile({ doc, onClick }: { doc: DocMeta; onClick: () => void }) {
  const thumb = useThumb(doc)
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="group relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/10 bg-mg-panel text-left"
    >
      {thumb ? (
        <img src={thumb} alt={doc.title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-white/[0.04]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        {doc.model && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-mg-red">
            {doc.model}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{doc.title}</h3>
      </div>
      <div className="absolute right-3 top-3 flex h-9 w-9 scale-90 items-center justify-center rounded-full bg-mg-red/90 opacity-0 shadow-glow transition-all group-hover:scale-100 group-hover:opacity-100">
        <Play className="h-4 w-4 translate-x-[1px] text-white" fill="currentColor" />
      </div>
    </motion.button>
  )
}

/* ─────────────────────────── Stage ─────────────────────────── */

const slide = {
  enter: (d: number) => ({ x: d >= 0 ? 80 : -80, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d >= 0 ? -80 : 80, opacity: 0, scale: 0.98 }),
}

function Stage({
  docs,
  index,
  dir,
  onNav,
  onJump,
  onMenu,
  onExit,
}: {
  docs: DocMeta[]
  index: number
  dir: number
  onNav: (delta: number) => void
  onJump: (i: number) => void
  onMenu: () => void
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
      else if (e.key === 'Escape') onMenu()
      else if (e.key.toLowerCase() === 'g') onMenu()
      poke()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNav, onMenu, poke])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col bg-mg-black"
      onMouseMove={poke}
      onTouchStart={poke}
    >
      {/* Top chrome */}
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
                onClick={onMenu}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                <LayoutGrid className="h-4 w-4" /> Menu
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

      {/* Stage */}
      <div className="relative min-h-0 flex-1 px-4 pb-4 pt-4 sm:px-16 sm:pb-24 sm:pt-20">
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

        {/* Title (mobile / when chrome hidden, subtle) */}
      </div>

      {/* Nav arrows */}
      {docs.length > 1 && (
        <>
          <NavArrow side="left" onClick={() => onNav(-1)} show={chrome} />
          <NavArrow side="right" onClick={() => onNav(1)} show={chrome} />
        </>
      )}

      {/* Filmstrip */}
      <AnimatePresence>
        {chrome && docs.length > 1 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10"
          >
            <div className="no-scrollbar mx-auto flex max-w-4xl gap-2 overflow-x-auto">
              {docs.map((d, i) => (
                <FilmThumb key={d.id} doc={d} active={i === index} onClick={() => onJump(i)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function FilmThumb({
  doc,
  active,
  onClick,
}: {
  doc: DocMeta
  active: boolean
  onClick: () => void
}) {
  const thumb = useThumb(doc)
  return (
    <button
      onClick={onClick}
      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all ${
        active ? 'ring-2 ring-mg-red' : 'opacity-60 ring-1 ring-white/15 hover:opacity-100'
      }`}
    >
      {thumb ? (
        <img src={thumb} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-white/[0.06]" />
      )}
    </button>
  )
}
