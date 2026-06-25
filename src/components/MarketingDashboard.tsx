import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
    <div className="min-h-screen bg-mg-black">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-mg-line bg-mg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12]"
              title="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Wordmark subtitle="Espace Marketing" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setResetting(true)}
              className="btn-ghost hidden sm:inline-flex"
              title="Recharger la démo"
            >
              <RotateCcw className="h-4 w-4" /> Réinitialiser
            </button>
            <button onClick={() => openUpload()} className="btn-primary">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        {/* Heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Bibliothèque documentaire
            </h1>
            <p className="mt-1 text-sm text-mg-mute">
              {docs.length} document{docs.length > 1 ? 's' : ''} · source unique du réseau MG Maroc
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
        </div>

        {/* Category rail */}
        <div className="mb-6">
          <CategoryRail counts={counts} active={filter} onChange={setFilter} />
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <EmptyState onAdd={() => openUpload(filter !== 'all' ? filter : undefined)} hasDocs={docs.length > 0} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
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
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
        <FolderOpen className="h-7 w-7 text-mg-mute" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {hasDocs ? 'Aucun document dans cette catégorie' : 'Votre bibliothèque est vide'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-mg-mute">
        Déposez vos premiers supports : notes de prix, fiches techniques, photos, vidéos…
      </p>
      <button onClick={onAdd} className="btn-primary mt-5">
        <Plus className="h-4 w-4" /> Ajouter des documents
      </button>
    </div>
  )
}
