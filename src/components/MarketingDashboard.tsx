import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Plus, Search, RotateCcw, FolderOpen } from 'lucide-react'
import type { CategoryId, DocMeta } from '../types'
import { useStore } from '../context/StoreContext'
import { Wordmark } from './Brand'
import CategoryRail, { type CategoryFilter } from './CategoryRail'
import DocCard from './DocCard'
import UploadModal from './UploadModal'
import Lightbox from './Lightbox'
import EditModal from './EditModal'
import ConfirmDialog from './ConfirmDialog'
import { EASE, springSoft } from '../motion'

export default function MarketingDashboard({ onExit }: { onExit: () => void }) {
  const { docs, remove, reset } = useStore()
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [uploadFor, setUploadFor] = useState<CategoryId | undefined>(undefined)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<DocMeta | null>(null)
  const [editing, setEditing] = useState<DocMeta | null>(null)
  const [confirm, setConfirm] = useState<DocMeta | null>(null)
  const [resetting, setResetting] = useState(false)

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

  const openUpload = (cat?: CategoryId) => {
    setUploadFor(cat)
    setUploadOpen(true)
  }

  return (
    <div className="min-h-screen bg-mg-base">
      {/* Top bar */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="sticky top-0 z-30 border-b border-mg-line bg-white/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.08, x: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={springSoft}
              onClick={onExit}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-wash text-mg-ink transition-colors hover:bg-mg-line"
              title="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
            <Wordmark subtitle="Espace Marketing" />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setResetting(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springSoft}
              className="btn-ghost hidden sm:inline-flex"
              title="Recharger la démo"
            >
              <RotateCcw className="h-4 w-4" /> Réinitialiser
            </motion.button>
            <motion.button
              onClick={() => openUpload()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springSoft}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="overline">Source unique du réseau</div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-mg-ink sm:text-3xl">
              Bibliothèque documentaire
            </h1>
            <p className="mt-1 text-sm text-mg-ink-soft">
              {docs.length} document{docs.length > 1 ? 's' : ''} · MG Maroc
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mg-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="input w-full pl-9 sm:w-72"
            />
          </div>
        </motion.div>

        {/* Category rail */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.14 }}
          className="mb-6"
        >
          <CategoryRail counts={counts} active={filter} onChange={setFilter} />
        </motion.div>

        {/* Grid */}
        {visible.length === 0 ? (
          <EmptyState onAdd={() => openUpload(filter !== 'all' ? filter : undefined)} hasDocs={docs.length > 0} />
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visible.map((doc, i) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  index={i}
                  onOpen={setPreview}
                  onEdit={setEditing}
                  onDelete={setConfirm}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <UploadModal open={uploadOpen} defaultCategory={uploadFor} onClose={() => setUploadOpen(false)} />
      <Lightbox doc={preview} onClose={() => setPreview(null)} />
      <EditModal doc={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!confirm}
        title="Supprimer ce document ?"
        message={confirm ? `« ${confirm.title} » sera définitivement retiré de la bibliothèque.` : ''}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) await remove(confirm.id)
          setConfirm(null)
        }}
      />
      <ConfirmDialog
        open={resetting}
        title="Réinitialiser la démo ?"
        message="Tous les documents actuels seront remplacés par le jeu de démonstration."
        confirmLabel="Réinitialiser"
        danger
        onCancel={() => setResetting(false)}
        onConfirm={async () => {
          await reset()
          setResetting(false)
        }}
      />
    </div>
  )
}

function EmptyState({ onAdd, hasDocs }: { onAdd: () => void; hasDocs: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-mg-line bg-mg-wash/50 py-20 text-center"
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card"
      >
        <FolderOpen className="h-7 w-7 text-mg-mute" />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold text-mg-ink">
        {hasDocs ? 'Aucun document dans cette catégorie' : 'Votre bibliothèque est vide'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-mg-ink-soft">
        Déposez vos premiers supports : notes de prix, fiches techniques, photos, vidéos…
      </p>
      <motion.button
        onClick={onAdd}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={springSoft}
        className="btn-primary mt-5"
      >
        <Plus className="h-4 w-4" /> Ajouter des documents
      </motion.button>
    </motion.div>
  )
}
