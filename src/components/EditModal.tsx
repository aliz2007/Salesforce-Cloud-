import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { CategoryId, DocMeta } from '../types'
import { CATEGORIES, MG_MODELS } from '../data/categories'
import { useStore } from '../context/StoreContext'
import Portal from './Portal'

export default function EditModal({ doc, onClose }: { doc: DocMeta | null; onClose: () => void }) {
  const { update } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>('note-de-prix')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (doc) {
      setTitle(doc.title)
      setCategory(doc.category)
      setModel(doc.model ?? '')
      setDescription(doc.description ?? '')
    }
  }, [doc])

  const save = async () => {
    if (!doc) return
    setBusy(true)
    try {
      await update(doc.id, {
        title: title.trim() || doc.title,
        category,
        model: model || undefined,
        description: description || undefined,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
          className="fixed inset-0 z-[55] flex items-end justify-center bg-mg-ink/40 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl border border-mg-line bg-white p-6 shadow-2xl sm:rounded-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-mg-ink">Modifier le document</h3>
              <button
                onClick={() => !busy && onClose()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-wash text-mg-ink transition-colors hover:bg-mg-line"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">Titre</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </label>

            <div className="mt-4">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mg-mute">Catégorie</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = category === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={clsx(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        on ? 'border-transparent text-white' : 'border-mg-line text-mg-ink-soft hover:text-mg-ink',
                      )}
                      style={on ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})` } : undefined}
                    >
                      {c.short}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">Modèle</span>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="input">
                  <option value="">— Aucun —</option>
                  {MG_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">Description</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => !busy && onClose()} className="btn-ghost">
                Annuler
              </button>
              <button onClick={save} disabled={busy} className="btn-primary">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  )
}
