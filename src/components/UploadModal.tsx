import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, UploadCloud, Link2, File as FileIcon, Loader2, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import type { CategoryId } from '../types'
import { CATEGORIES, MG_MODELS } from '../data/categories'
import { useStore } from '../context/StoreContext'
import { humanSize, inferKind } from '../storage/media'

interface Picked {
  file: File
  title: string
}

export default function UploadModal({
  open,
  defaultCategory,
  onClose,
}: {
  open: boolean
  defaultCategory?: CategoryId
  onClose: () => void
}) {
  const { add } = useStore()
  const [mode, setMode] = useState<'files' | 'link'>('files')
  const [picked, setPicked] = useState<Picked[]>([])
  const [category, setCategory] = useState<CategoryId | ''>(defaultCategory ?? '')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPicked([])
    setModel('')
    setDescription('')
    setUrl('')
    setLinkTitle('')
    setProgress(0)
    setMode('files')
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).map((file) => ({
      file,
      title: file.name.replace(/\.[^.]+$/, ''),
    }))
    setPicked((prev) => [...prev, ...arr])
  }, [])

  const canSubmit =
    !!category && !busy && (mode === 'files' ? picked.length > 0 : url.trim().length > 5)

  const submit = async () => {
    if (!category) return
    setBusy(true)
    try {
      if (mode === 'files') {
        for (let i = 0; i < picked.length; i++) {
          const p = picked[i]
          await add({
            title: p.title || p.file.name,
            category,
            model: model || undefined,
            description: description || undefined,
            file: p.file,
          })
          setProgress(Math.round(((i + 1) / picked.length) * 100))
        }
      } else {
        await add({
          title: linkTitle || url,
          category,
          model: model || undefined,
          description: description || undefined,
          remoteUrl: url.trim(),
        })
      }
      reset()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-mg-ink sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-mg-line px-6 py-4">
              <h3 className="text-lg font-bold">Ajouter des documents</h3>
              <button
                onClick={() => !busy && onClose()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* Mode tabs */}
              <div className="mb-5 inline-flex rounded-xl border border-mg-line bg-mg-panel p-1">
                <Tab active={mode === 'files'} onClick={() => setMode('files')} icon={<UploadCloud className="h-4 w-4" />}>
                  Fichiers
                </Tab>
                <Tab active={mode === 'link'} onClick={() => setMode('link')} icon={<Link2 className="h-4 w-4" />}>
                  Lien (YouTube, Drive…)
                </Tab>
              </div>

              {mode === 'files' ? (
                <>
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      addFiles(e.dataTransfer.files)
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={clsx(
                      'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                      dragOver ? 'border-mg-red bg-mg-red/5' : 'border-white/15 hover:border-white/30',
                    )}
                  >
                    <UploadCloud className={clsx('h-9 w-9', dragOver ? 'text-mg-red' : 'text-mg-mute')} />
                    <p className="mt-3 text-sm font-medium">
                      Glissez vos fichiers ici ou <span className="text-mg-red">parcourez</span>
                    </p>
                    <p className="mt-1 text-xs text-mg-mute">PDF, images, vidéos — plusieurs fichiers possibles</p>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                  </div>

                  {/* Picked list */}
                  {picked.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {picked.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-mg-line bg-mg-panel p-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-mg-mute">
                            <FileIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              value={p.title}
                              onChange={(e) =>
                                setPicked((prev) =>
                                  prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                                )
                              }
                              className="w-full bg-transparent text-sm font-medium outline-none"
                            />
                            <div className="text-[11px] text-mg-mute">
                              {inferKind(p.file)} · {humanSize(p.file.size)}
                            </div>
                          </div>
                          <button
                            onClick={() => setPicked((prev) => prev.filter((_, j) => j !== i))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-mg-mute hover:bg-white/[0.06] hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <Field label="URL du document / de la vidéo">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=…  ou  lien Drive partagé"
                      className="input"
                    />
                  </Field>
                  <Field label="Titre">
                    <input
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Ex. Essai dynamique MG4 EV"
                      className="input"
                    />
                  </Field>
                </div>
              )}

              {/* Shared metadata */}
              <div className="mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mg-mute">
                  Catégorie <span className="text-mg-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon
                    const on = category === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={clsx(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                          on ? 'border-transparent text-white' : 'border-mg-line text-white/60 hover:text-white',
                        )}
                        style={on ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})` } : undefined}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[11px] font-medium leading-tight">{c.short}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Modèle (optionnel)">
                  <select value={model} onChange={(e) => setModel(e.target.value)} className="input">
                    <option value="">— Aucun / Transversal —</option>
                    {MG_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Description (optionnel)">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Note interne, contexte…"
                    className="input"
                  />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-mg-line px-6 py-4">
              {busy && mode === 'files' && (
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full bg-mg-grad"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-mg-mute">
                  {mode === 'files'
                    ? `${picked.length} fichier${picked.length > 1 ? 's' : ''} prêt${picked.length > 1 ? 's' : ''}`
                    : 'Le lien sera intégré tel quel'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => !busy && onClose()} className="btn-ghost">
                    Annuler
                  </button>
                  <button onClick={submit} disabled={!canSubmit} className="btn-primary">
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Import…
                      </>
                    ) : (
                      <>Ajouter</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
        active ? 'bg-white/[0.10] text-white' : 'text-white/55 hover:text-white',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">{label}</span>
      {children}
    </label>
  )
}
