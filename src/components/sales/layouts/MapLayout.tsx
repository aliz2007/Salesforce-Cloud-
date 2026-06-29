import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { DocMeta } from '../../../types'
import { useThumb } from '../../../hooks'
import { CATEGORY_MAP } from '../../../data/categories'
import { springSoft } from '../../../motion'
import { useSalesSettings } from '../../../context/SalesSettings'

/**
 * "Constellation" view: each document is a small circular star scattered
 * across the canvas with faint lines linking nearest neighbours. Positions
 * are DETERMINISTIC (a tiny seeded LCG + golden-angle phyllotaxis) so the
 * layout is stable across renders.
 */

interface Pt {
  x: number // percent 0..100
  y: number // percent 0..100
}

const GOLDEN = 2.39996323 // golden angle in radians

/** Deterministic point set seeded from the doc count — stable across renders. */
function computePoints(n: number): Pt[] {
  if (n <= 0) return []
  // tiny LCG for repeatable jitter
  let seed = (n * 2654435761) >>> 0
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }
  const pts: Pt[] = []
  // usable field, leaving margins so chips don't clip
  const minP = 8
  const maxP = 92
  const span = maxP - minP
  const cx = 50
  const cy = 50
  // radius scales with count so dense sets spread wider
  const maxR = Math.min(44, 16 + Math.sqrt(n) * 7)

  for (let i = 0; i < n; i++) {
    if (n === 1) {
      pts.push({ x: cx, y: cy })
      continue
    }
    const t = (i + 0.5) / n
    const r = maxR * Math.sqrt(t)
    const a = i * GOLDEN + rand() * 0.5
    // squash vertically a touch so it reads landscape on wide screens
    let x = cx + r * Math.cos(a)
    let y = cy + r * Math.sin(a) * 0.92
    // gentle jitter
    x += (rand() - 0.5) * 6
    y += (rand() - 0.5) * 6
    x = Math.max(minP, Math.min(maxP, x))
    y = Math.max(minP, Math.min(maxP, y))
    pts.push({
      x: minP + ((x - minP) / span) * span,
      y,
    })
  }
  return pts
}

/** For each node, indices of its 1-2 nearest neighbours (deduped edges). */
function computeEdges(pts: Pt[]): Array<[number, number]> {
  const edges = new Set<string>()
  const out: Array<[number, number]> = []
  for (let i = 0; i < pts.length; i++) {
    const dists = pts
      .map((p, j) => ({ j, d: (p.x - pts[i].x) ** 2 + (p.y - pts[i].y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
    const k = Math.min(2, dists.length)
    for (let m = 0; m < k; m++) {
      const j = dists[m].j
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!edges.has(key)) {
        edges.add(key)
        out.push([i, j])
      }
    }
  }
  return out
}

export default function MapLayout({
  docs,
  onPick,
}: {
  docs: DocMeta[]
  onPick: (i: number) => void
}) {
  const reduce = useReducedMotion()
  const points = useMemo(() => computePoints(docs.length), [docs.length])
  const edges = useMemo(() => computeEdges(points), [points])

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-4 py-24">
      {/* connecting lines behind the nodes */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {edges.map(([a, b], idx) => (
          <motion.line
            key={`${a}-${b}`}
            x1={points[a].x}
            y1={points[a].y}
            x2={points[b].x}
            y2={points[b].y}
            stroke="currentColor"
            strokeWidth={0.12}
            className="text-mg-red-light/30"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 + idx * 0.03, ease: 'easeOut' }}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* nodes */}
      {docs.map((doc, i) => (
        <Node
          key={doc.id}
          doc={doc}
          index={i}
          point={points[i]}
          reduce={!!reduce}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  )
}

function Node({
  doc,
  index,
  point,
  reduce,
  onClick,
}: {
  doc: DocMeta
  index: number
  point: Pt
  reduce: boolean
  onClick: () => void
}) {
  const { float } = useSalesSettings()
  const thumb = useThumb(doc)
  const cat = CATEGORY_MAP[doc.category]
  const Icon = cat.icon
  const showImage = !!thumb && doc.source !== 'seed'

  const drifting = float && !reduce
  const duration = 4 + (index % 5) * 0.6
  const delay = (index % 7) * 0.28
  const amplitude = 5 + (index % 4)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springSoft, delay: 0.15 + index * 0.04 }}
      whileHover={{ scale: 1.12, zIndex: 30, transition: springSoft }}
      whileTap={{ scale: 0.95 }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
      aria-label={`Ouvrir ${doc.title}`}
    >
      <motion.div
        animate={drifting ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={
          drifting
            ? { duration, repeat: Infinity, ease: 'easeInOut', delay }
            : { duration: 0.3 }
        }
        className="flex flex-col items-center gap-2"
      >
        <span className="relative block aspect-square w-20 overflow-hidden rounded-full border-2 border-white/15 shadow-bubble ring-2 ring-mg-red/0 transition-[box-shadow,border-color,--tw-ring-color] duration-300 group-hover:border-mg-red/70 group-hover:shadow-glow group-hover:ring-mg-red/50 sm:w-24 lg:w-28">
          {showImage ? (
            <img
              src={thumb}
              alt={doc.title}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
            >
              <Icon className="h-1/3 w-1/3 text-white/90" />
            </span>
          )}
          <span className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/45" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
              <Play className="h-4 w-4 translate-x-[1px] text-white" fill="currentColor" />
            </span>
          </span>
        </span>

        {/* caption chip — appears on hover */}
        <span className="pointer-events-none max-w-[10rem] translate-y-1 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-center text-[11px] font-semibold text-white/90 opacity-0 backdrop-blur transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {doc.model ? <span className="text-mg-red-light">{doc.model} · </span> : null}
          <span className="line-clamp-1">{doc.title}</span>
        </span>
      </motion.div>
    </motion.button>
  )
}
