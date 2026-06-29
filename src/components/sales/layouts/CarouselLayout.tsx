import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import type { DocMeta } from '../../../types'
import { useThumb } from '../../../hooks'
import { CATEGORY_MAP } from '../../../data/categories'
import { springSoft } from '../../../motion'

/**
 * Horizontal cover-flow. The centred card is large; immediate neighbours are
 * smaller, dimmed and rotated in 3D (perspective on the container). Arrow keys
 * and on-screen buttons move the active index (wrapping); clicking the centre
 * card opens it, clicking a side card brings it forward.
 */
export default function CarouselLayout({
  docs,
  onPick,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
}) {
  const [active, setActive] = useState(0)
  const total = docs.length

  // Keep active in range if the doc set shrinks.
  useEffect(() => {
    setActive((a) => (a >= total ? Math.max(0, total - 1) : a))
  }, [total])

  const go = useCallback(
    (delta: number) => setActive((a) => (a + delta + total) % total),
    [total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const activeDoc = docs[active]
  const activeCat = activeDoc ? CATEGORY_MAP[activeDoc.category] : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-24">
      <div
        className="relative flex h-[clamp(280px,52vh,560px)] w-full max-w-6xl items-center justify-center"
        style={{ perspective: '1600px' }}
      >
        {docs.map((doc, i) => {
          // shortest signed offset on a wrapped ring
          let offset = i - active
          if (offset > total / 2) offset -= total
          if (offset < -total / 2) offset += total

          const abs = Math.abs(offset)
          if (abs > 2) return null // only render the nearest few cards

          return (
            <Card
              key={doc.id}
              doc={doc}
              offset={offset}
              onClick={() => (offset === 0 ? onPick(i) : setActive(i))}
            />
          )
        })}
      </div>

      {/* arrows */}
      {total > 1 && (
        <div className="mt-8 flex items-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            className="ctl h-12 w-12"
            aria-label="Document précédent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums opacity-80">
            {active + 1} / {total}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            className="ctl h-12 w-12"
            aria-label="Document suivant"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* active caption */}
      {activeDoc && activeCat && (
        <motion.div
          key={activeDoc.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 max-w-xl px-4 text-center"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-mg-red-light">
            {activeCat.label}
            {activeDoc.model ? ` · ${activeDoc.model}` : ''}
          </div>
          <div className="mt-1 text-balance text-lg font-bold leading-tight">
            {activeDoc.title}
          </div>
        </motion.div>
      )}

      {/* dots */}
      {total > 1 && total <= 12 && (
        <div className="mt-5 flex items-center gap-2">
          {docs.map((doc, i) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Aller au document ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-mg-red' : 'w-2 bg-current opacity-30 hover:opacity-60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Card({
  doc,
  offset,
  onClick,
}: {
  doc: DocMeta
  offset: number
  onClick: () => void
}) {
  const thumb = useThumb(doc)
  const cat = CATEGORY_MAP[doc.category]
  const Icon = cat.icon
  const showImage = !!thumb && doc.source !== 'seed'
  const isCenter = offset === 0
  const abs = Math.abs(offset)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isCenter ? `Ouvrir ${doc.title}` : `Mettre ${doc.title} au centre`}
      aria-hidden={abs > 1}
      className="absolute left-1/2 top-1/2 aspect-[4/3] w-[clamp(220px,40vw,460px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] shadow-bubble outline-none focus-visible:ring-2 focus-visible:ring-mg-red"
      initial={false}
      animate={{
        x: `calc(-50% + ${offset * 56}%)`,
        scale: isCenter ? 1 : 0.78 - (abs - 1) * 0.08,
        rotateY: offset === 0 ? 0 : offset > 0 ? -34 : 34,
        opacity: abs > 2 ? 0 : isCenter ? 1 : 0.55 - (abs - 1) * 0.18,
        zIndex: 20 - abs,
        filter: isCenter ? 'brightness(1)' : 'brightness(0.6)',
      }}
      transition={springSoft}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {showImage ? (
        <img
          src={thumb}
          alt={doc.title}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
        >
          <Icon className="h-1/4 w-1/4 text-white/90" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

      {isCenter && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
            <Play className="h-7 w-7 translate-x-[1px] text-white" fill="currentColor" />
          </span>
        </div>
      )}
    </motion.button>
  )
}
