import { motion } from 'framer-motion'
import { Check, Pencil, Trash2, Play, FileText, ImageIcon, Tag, Link2 } from 'lucide-react'
import clsx from 'clsx'
import type { DocMeta, DocKind } from '../types'
import { CATEGORY_MAP } from '../data/categories'
import { useThumb } from '../hooks'

const KIND_ICON: Record<DocKind, typeof Play> = {
  video: Play,
  image: ImageIcon,
  pdf: FileText,
  link: Link2,
  other: Tag,
}

export interface DocCardProps {
  doc: DocMeta
  index?: number
  onOpen?: (doc: DocMeta) => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (doc: DocMeta) => void
  onEdit?: (doc: DocMeta) => void
  onDelete?: (doc: DocMeta) => void
}

export default function DocCard({
  doc,
  index = 0,
  onOpen,
  selectable,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: DocCardProps) {
  const thumb = useThumb(doc)
  const cat = CATEGORY_MAP[doc.category]
  const KindIcon = KIND_ICON[doc.kind]

  const handleClick = () => {
    if (selectable) onToggleSelect?.(doc)
    else onOpen?.(doc)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className={clsx(
        'group relative cursor-pointer overflow-hidden rounded-2xl border bg-mg-panel transition-colors',
        selected ? 'border-mg-red shadow-glow' : 'border-mg-line hover:border-white/20',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-mg-ink">
        {thumb ? (
          <img
            src={thumb}
            alt={doc.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-white/[0.04]" />
        )}

        {/* gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* kind chip */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <KindIcon className="h-3.5 w-3.5" />
          {doc.kind === 'video' && 'Vidéo'}
          {doc.kind === 'image' && 'Photo'}
          {doc.kind === 'pdf' && 'PDF'}
          {doc.kind === 'link' && 'Lien'}
          {doc.kind === 'other' && 'Doc'}
        </div>

        {/* category dot */}
        <div
          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-black/40"
          style={{ background: cat.from }}
          title={cat.label}
        />

        {/* selection checkbox */}
        {selectable && (
          <div
            className={clsx(
              'absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
              selected
                ? 'border-mg-red bg-mg-red text-white'
                : 'border-white/70 bg-black/30 text-transparent backdrop-blur group-hover:border-white',
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        )}

        {/* play overlay for video */}
        {doc.kind === 'video' && !selectable && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mg-red/90 shadow-glow">
              <Play className="h-5 w-5 translate-x-[1px] text-white" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cat.from }}>
            {cat.short}
          </span>
          {doc.model && (
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/70">
              {doc.model}
            </span>
          )}
        </div>
        <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white">
          {doc.title}
        </h4>
      </div>

      {/* Management actions */}
      {(onEdit || onDelete) && (
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(doc)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80"
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(doc)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur transition-colors hover:bg-mg-red"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
