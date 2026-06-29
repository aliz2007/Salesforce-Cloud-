import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowLeft, Settings } from 'lucide-react'
import type { DocMeta } from '../types'
import { useStore } from '../context/StoreContext'
import { CATEGORY_MAP } from '../data/categories'
import { MgBadge } from './Brand'
import { slideX, EASE } from '../motion'
import {
  SalesSettingsProvider,
  useSalesSettings,
} from '../context/SalesSettings'
import SalesBackground from './sales/SalesBackground'
import SettingsPanel from './sales/SettingsPanel'
import { LAYOUTS } from './sales/layouts'
import DocViewer from './DocViewer'

type Phase = 'board' | 'stage'

/**
 * Personalisable Sales Mode. The vendeur sees a board of ONLY the selected
 * files, can re-skin it (layout / theme / custom background), and taps a file
 * to open it full-screen on a clean spotlight stage.
 */
export default function SalesMode({ onExit }: { onExit: () => void }) {
  return (
    <SalesSettingsProvider>
      <SalesModeInner onExit={onExit} />
    </SalesSettingsProvider>
  )
}

function SalesModeInner({ onExit }: { onExit: () => void }) {
  const { selectedDocs } = useStore()
  const { isLight } = useSalesSettings()
  const [phase, setPhase] = useState<Phase>('board')
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0])

  // The board is sorted alphabetically by title (French collation).
  const docs = useMemo(
    () => [...selectedDocs].sort((a, b) => a.title.localeCompare(b.title, 'fr')),
    [selectedDocs],
  )

  const openStage = useCallback((i: number) => {
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
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-mg-stage ${
        isLight ? 'text-mg-ink' : 'text-white'
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === 'board' && (
          <Board key="board" docs={docs} onPick={openStage} onExit={onExit} />
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

/* ─────────────────────────── Board ─────────────────────────── */

function Board({
  docs,
  onPick,
  onExit,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
  onExit: () => void
}) {
  const { layout, isLight } = useSalesSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { Component } = LAYOUTS[layout]

  // Escape exits the board — unless the settings panel is open (it handles Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settingsOpen) onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit, settingsOpen])

  // Control buttons flip to dark-on-light when a light theme is active.
  const ctlClass = isLight
    ? 'flex items-center justify-center rounded-full border border-black/10 bg-black/[0.05] text-mg-ink transition-all duration-200 hover:bg-black/[0.1] active:scale-95'
    : 'ctl'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 overflow-y-auto scroll-dark"
    >
      <SalesBackground />

      {/* minimal chrome */}
      <div className="pointer-events-none fixed left-6 top-6 z-20 opacity-80">
        <MgBadge size={34} />
      </div>

      <div className="fixed right-6 top-6 z-20 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`${ctlClass} h-11 w-11`}
          aria-label="Personnaliser la présentation"
          title="Personnaliser"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          className={`${ctlClass} h-11 w-11`}
          aria-label="Quitter le Sales Mode"
          title="Quitter (Échap)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* active layout — cross-fades/scales when the disposition changes */}
      <div className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={layout}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="min-h-screen"
          >
            <Component docs={docs} onPick={onPick} />
          </motion.div>
        </AnimatePresence>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.div>
  )
}

/* ─────────────────────────── Focused stage ─────────────────────────── */

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
      else if (e.key === 'Escape' || e.key === 'Backspace' || e.key.toLowerCase() === 'g')
        onBack()
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
      // The stage is ALWAYS a clean dark spotlight, whatever the board theme.
      className="absolute inset-0 flex flex-col bg-mg-stage text-white"
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
                type="button"
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
                type="button"
                onClick={onExit}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-mg-red"
                aria-label="Quitter"
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
            variants={slideX}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: EASE }}
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
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClick}
          aria-label={side === 'left' ? 'Précédent' : 'Suivant'}
          className={`absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 ${
            side === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
          }`}
        >
          <Icon className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
