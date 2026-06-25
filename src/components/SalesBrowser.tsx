import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Search, Play, X, Sparkles, CheckCheck } from 'lucide-react'
import type { DocMeta } from '../types'
import { useStore } from '../context/StoreContext'
import { Wordmark } from './Brand'
import { useThumb } from '../hooks'
import CategoryRail, { type CategoryFilter } from './CategoryRail'
import DocCard from './DocCard'
import Lightbox from './Lightbox'

export default function SalesBrowser({
  onExit,
  onLaunch,
}: {
  onExit: () => void
  onLaunch: () => void
}) {
  const { docs, selectedIds, selectedDocs, isSelected, toggleSelect, selectMany, clearSelection } =
    useStore()
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<DocMeta | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    docs.forEach((d) => (c[d.category] = (c[d.category] || 0) + 1))
    return c
  }, [docs])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((d) => {
      if (filter !== 'all' && d.category !== filter) return false
      if (q && !`${d.title} ${d.model ?? ''} ${d.description ?? ''}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [docs, filter, query])

  const allVisibleSelected = visible.length > 0 && visible.every((d) => isSelected(d.id))

  return (
    <div className="min-h-screen bg-mg-black pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-mg-line bg-mg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Wordmark subtitle="Espace Vendeur" />
          </div>
          <button
            onClick={onLaunch}
            disabled={selectedDocs.length === 0}
            className="btn-primary"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Sales Mode
            {selectedDocs.length > 0 && (
              <span className="ml-1 rounded-full bg-white/25 px-1.5 text-xs">{selectedDocs.length}</span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Préparez votre présentation
            </h1>
            <p className="mt-1 text-sm text-mg-mute">
              Sélectionnez les supports à présenter, puis lancez le Sales Mode plein écran.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectMany(visible.map((d) => d.id), !allVisibleSelected)}
              className="btn-ghost"
            >
              <CheckCheck className="h-4 w-4" />
              {allVisibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mg-mute" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="input w-full pl-9 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <CategoryRail counts={counts} active={filter} onChange={setFilter} />
        </div>

        {visible.length === 0 ? (
          <div className="py-24 text-center text-mg-mute">Aucun document ne correspond.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((doc, i) => (
              <DocCard
                key={doc.id}
                doc={doc}
                index={i}
                selectable
                selected={isSelected(doc.id)}
                onToggleSelect={(d) => toggleSelect(d.id)}
                onOpen={setPreview}
              />
            ))}
          </div>
        )}
      </main>

      {/* Selection tray */}
      <SelectionTray
        docs={selectedDocs}
        onClear={clearSelection}
        onRemove={(id) => toggleSelect(id)}
        onLaunch={onLaunch}
        visible={selectedIds.size > 0}
      />

      {/* Preview (long-press / tap on thumbnail area opens; here via dedicated button) */}
      <Lightbox doc={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

function SelectionTray({
  docs,
  onClear,
  onRemove,
  onLaunch,
  visible,
}: {
  docs: DocMeta[]
  onClear: () => void
  onRemove: (id: string) => void
  onLaunch: () => void
  visible: boolean
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4"
        >
          <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-white/10 bg-mg-ink/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="hidden shrink-0 items-center gap-1 pl-1 sm:flex">
              <Sparkles className="h-4 w-4 text-mg-red" />
              <span className="text-sm font-semibold">{docs.length} sélectionné{docs.length > 1 ? 's' : ''}</span>
            </div>

            {/* mini thumbnails */}
            <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {docs.map((d) => (
                <TrayThumb key={d.id} doc={d} onRemove={() => onRemove(d.id)} />
              ))}
            </div>

            <button onClick={onClear} className="btn-ghost shrink-0 px-3">
              Vider
            </button>
            <button onClick={onLaunch} className="btn-primary shrink-0">
              <Play className="h-4 w-4" fill="currentColor" />
              <span className="hidden sm:inline">Lancer</span> Sales Mode
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TrayThumb({ doc, onRemove }: { doc: DocMeta; onRemove: () => void }) {
  const thumb = useThumb(doc)
  return (
    <div className="group relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-mg-panel ring-1 ring-white/10">
      {thumb ? (
        <img src={thumb} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-white/[0.05]" />
      )}
      <button
        onClick={onRemove}
        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  )
}
