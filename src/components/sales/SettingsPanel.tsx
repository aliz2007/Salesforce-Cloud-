import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Upload, Trash2, RotateCcw, ImagePlus, Loader2 } from 'lucide-react'
import {
  THEMES,
  useSalesSettings,
  type LayoutId,
} from '../../context/SalesSettings'
import { LAYOUTS, LAYOUT_ORDER } from './layouts'
import { makeImageThumb } from '../../storage/media'
import { springSoft, fade } from '../../motion'

/** Hard cap for a raw fallback background data URL (~4 MB). */
const RAW_FALLBACK_MAX = 4 * 1024 * 1024

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Right-side slide-in settings panel for the Sales-Mode board: pick a layout,
 * a background theme, upload a custom background, toggle floating, and reset.
 */
export default function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const {
    layout,
    themeId,
    customBg,
    float,
    setLayout,
    setThemeId,
    setCustomBg,
    setFloat,
    resetSettings,
  } = useSalesSettings()

  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleFile = async (file: File) => {
    setError(null)
    setBusy(true)
    try {
      const thumb = await makeImageThumb(file, 1600)
      let dataUrl: string
      if (thumb) {
        dataUrl = await blobToDataUrl(thumb)
      } else {
        // Couldn't decode/downscale — fall back to the raw file, but guard size.
        if (file.size > RAW_FALLBACK_MAX) {
          setError('Image trop lourde. Choisissez un fichier plus léger.')
          return
        }
        dataUrl = await blobToDataUrl(file)
      }
      setCustomBg(dataUrl)
    } catch {
      setError("Impossible de charger l'image.")
    } finally {
      setBusy(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60]"
          variants={fade}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* dismiss backdrop */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les réglages"
            className="absolute inset-0 h-full w-full cursor-default bg-black/55 backdrop-blur-sm"
          />

          {/* panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Réglages de présentation"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springSoft}
            className="glass-strong scroll-dark absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col overflow-y-auto text-white shadow-2xl"
          >
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/30 px-5 py-4 backdrop-blur-xl">
              <h2 className="text-base font-bold">Personnaliser</h2>
              <button
                type="button"
                onClick={onClose}
                className="ctl h-9 w-9"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-8 px-5 py-6">
              {/* (a) Disposition */}
              <section>
                <h3 className="overline mb-3 text-white/55">Disposition</h3>
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUT_ORDER.map((id) => (
                    <LayoutCard
                      key={id}
                      id={id}
                      active={layout === id}
                      onSelect={() => setLayout(id)}
                    />
                  ))}
                </div>
              </section>

              {/* (b) Thème */}
              <section>
                <h3 className="overline mb-3 text-white/55">Thème</h3>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((theme) => {
                    const active = themeId === theme.id && !customBg
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setThemeId(theme.id)}
                        className="group flex flex-col items-center gap-1.5 outline-none"
                        aria-label={`Thème ${theme.label}`}
                        aria-pressed={active}
                      >
                        <span
                          className={`relative block h-14 w-full overflow-hidden rounded-xl border transition-all duration-200 ${
                            active
                              ? 'border-mg-red ring-2 ring-mg-red/60'
                              : 'border-white/12 group-hover:border-white/30'
                          }`}
                          style={{ background: theme.swatch }}
                        >
                          {active && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mg-red text-white">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            active ? 'text-white' : 'text-white/65'
                          }`}
                        >
                          {theme.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* (c) Image personnalisée */}
              <section>
                <h3 className="overline mb-3 text-white/55">Image personnalisée</h3>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onInputChange}
                />

                {customBg ? (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-white/12">
                      <img
                        src={customBg}
                        alt="Aperçu de l'arrière-plan"
                        className="h-28 w-full object-cover"
                        draggable={false}
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-mg-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        Actif
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.14] disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Remplacer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBg(null)
                          setError(null)
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-mg-red-light transition-colors hover:bg-mg-red/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-7 text-center transition-colors hover:border-mg-red/50 hover:bg-white/[0.07] disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-white/70" />
                    )}
                    <span className="text-sm font-semibold">
                      {busy ? 'Traitement…' : 'Importer une image'}
                    </span>
                    <span className="text-xs text-white/50">
                      Couvre tout l'écran derrière vos fichiers
                    </span>
                  </button>
                )}

                {error && (
                  <p className="mt-2 text-xs font-medium text-mg-red-light">{error}</p>
                )}
              </section>

              {/* (d) Flottement toggle */}
              <section>
                <h3 className="overline mb-3 text-white/55">Animation</h3>
                <button
                  type="button"
                  role="switch"
                  aria-checked={float}
                  onClick={() => setFloat(!float)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.09]"
                >
                  <span>
                    <span className="block text-sm font-semibold">Flottement</span>
                    <span className="block text-xs text-white/50">
                      Léger mouvement des vignettes
                    </span>
                  </span>
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      float ? 'bg-mg-red' : 'bg-white/20'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={springSoft}
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      style={{ left: float ? 22 : 2 }}
                    />
                  </span>
                </button>
              </section>

              {/* (e) Reset */}
              <button
                type="button"
                onClick={() => {
                  resetSettings()
                  setError(null)
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LayoutCard({
  id,
  active,
  onSelect,
}: {
  id: LayoutId
  active: boolean
  onSelect: () => void
}) {
  const { meta } = LAYOUTS[id]
  const Icon = meta.icon
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      aria-pressed={active}
      aria-label={`Disposition ${meta.label}`}
      className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-all duration-200 ${
        active
          ? 'border-mg-red bg-mg-red/15 ring-2 ring-mg-red/60'
          : 'border-white/12 bg-white/[0.05] hover:bg-white/[0.1]'
      }`}
    >
      {active && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-mg-red text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
      <Icon className={`h-6 w-6 ${active ? 'text-mg-red-light' : 'text-white/80'}`} />
      <span className="text-sm font-semibold">{meta.label}</span>
    </motion.button>
  )
}
