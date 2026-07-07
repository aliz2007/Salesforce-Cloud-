import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  RotateCcw,
  ImageDown,
  FileImage,
  FolderPlus,
  Loader2,
  Check,
  X,
  TrendingDown,
  Zap,
  Fuel,
} from 'lucide-react'
import type { CategoryId } from '../types'
import { CATEGORIES, MG_MODELS } from '../data/categories'
import { useStore } from '../context/StoreContext'
import AccountChip from './auth/AccountChip'
import Portal from './Portal'
import { fadeUp, springSoft, staggerContainer } from '../motion'
import {
  DEFAULT_TCO,
  POWERTRAINS,
  computeTco,
  buildTcoPosterSvg,
  svgToPngBlob,
  fmtDh,
  type Powertrain,
  type TcoInputs,
  type VehicleInput,
  type VehicleResult,
} from '../data/tco'

const COLORS: Record<Powertrain, string> = {
  electrique: '#E11D24',
  essence: '#57534D',
  diesel: '#8A857E',
}
const ICONS: Record<Powertrain, typeof Zap> = { electrique: Zap, essence: Fuel, diesel: Fuel }

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function TcoSimulator({ onExit }: { onExit: () => void }) {
  const [inputs, setInputs] = useState<TcoInputs>(DEFAULT_TCO)
  const result = useMemo(() => computeTco(inputs), [inputs])
  const svg = useMemo(() => buildTcoPosterSvg(inputs, result), [inputs, result])
  const previewUrl = useMemo(
    () => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
    [svg],
  )
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<'png' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const setGlobal = (patch: Partial<Pick<TcoInputs, 'modele' | 'kmAn' | 'annees'>>) =>
    setInputs((p) => ({ ...p, ...patch }))
  const setVeh = (pt: Powertrain, key: keyof VehicleInput, val: number) =>
    setInputs((p) => ({ ...p, [pt]: { ...p[pt], [key]: val } }))

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2600)
  }

  const exportPng = async () => {
    setBusy('png')
    try {
      const blob = await svgToPngBlob(svg, 1)
      download(blob, `Comparatif-TCO-${inputs.modele.replace(/\s+/g, '-')}.png`)
    } catch {
      flash('Échec de l’export PNG.')
    } finally {
      setBusy(null)
    }
  }
  const exportSvg = () =>
    download(new Blob([svg], { type: 'image/svg+xml' }), `Comparatif-TCO-${inputs.modele.replace(/\s+/g, '-')}.svg`)

  return (
    <div className="min-h-screen bg-mg-base pb-24">
      <header className="sticky top-0 z-30 border-b border-mg-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-wash text-mg-ink transition-colors hover:bg-mg-line"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-mg-red">
                Outil d’aide à la vente
              </div>
              <div className="text-sm font-extrabold text-mg-ink">Simulateur TCO</div>
            </div>
          </div>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7">
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="mb-6">
            <div className="overline">Coût Total de Possession</div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-mg-ink sm:text-3xl">
              Électrique vs Essence vs Diesel
            </h1>
            <p className="mt-1 text-sm text-mg-ink-soft">
              Comparez le coût réel sur la durée de possession et montrez l’économie de l’électrique.
            </p>
          </motion.div>

          {/* Scénario global */}
          <motion.div
            variants={fadeUp}
            className="mb-5 grid gap-4 rounded-2xl border border-mg-line bg-mg-panel p-5 shadow-card sm:grid-cols-3"
          >
            <Field label="Modèle">
              <input
                list="mg-models"
                value={inputs.modele}
                onChange={(e) => setGlobal({ modele: e.target.value })}
                className="input"
              />
              <datalist id="mg-models">
                {MG_MODELS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <NumField label="Kilomètres / an" value={inputs.kmAn} onChange={(v) => setGlobal({ kmAn: v })} />
            <NumField
              label="Durée de possession (ans)"
              value={inputs.annees}
              onChange={(v) => setGlobal({ annees: Math.max(1, Math.round(v)) })}
            />
          </motion.div>

          {/* Inputs par motorisation */}
          <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-3">
            {POWERTRAINS.map((pt) => (
              <VehicleCard
                key={pt.id}
                pt={pt.id}
                label={pt.label}
                energyUnit={pt.energyUnit}
                consoUnit={pt.consoUnit}
                v={inputs[pt.id]}
                res={result[pt.id]}
                onChange={(k, val) => setVeh(pt.id, k, val)}
              />
            ))}
          </motion.div>

          {/* Résultats */}
          <motion.div variants={fadeUp} className="mt-8">
            <ResultsTable inputs={inputs} result={result} />
          </motion.div>

          {/* Économie */}
          <motion.div variants={fadeUp} className="mt-6">
            <SavingsBanner result={result} annees={inputs.annees} />
          </motion.div>

          {/* Export */}
          <motion.div
            variants={fadeUp}
            className="mt-8 grid gap-6 rounded-2xl border border-mg-line bg-mg-panel p-5 shadow-card md:grid-cols-[1fr_auto]"
          >
            <div>
              <h3 className="text-base font-bold text-mg-ink">Exporter ce comparatif</h3>
              <p className="mt-1 text-sm text-mg-ink-soft">
                Générez une belle fiche à présenter, ou ajoutez-la directement à la bibliothèque
                pour que les vendeurs la retrouvent en Sales Mode.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={exportPng} disabled={busy === 'png'} className="btn-primary">
                  {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
                  Exporter en image (PNG)
                </button>
                <button onClick={exportSvg} className="btn-ghost">
                  <FileImage className="h-4 w-4" /> SVG
                </button>
                <button onClick={() => setAddOpen(true)} className="btn-dark">
                  <FolderPlus className="h-4 w-4" /> Ajouter aux documents
                </button>
                <button
                  onClick={() => setInputs(DEFAULT_TCO)}
                  className="btn bg-white text-mg-ink-soft ring-1 ring-mg-line hover:bg-mg-wash"
                >
                  <RotateCcw className="h-4 w-4" /> Réinitialiser
                </button>
              </div>
            </div>
            {/* aperçu de la fiche exportée */}
            <div className="w-full md:w-52">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-mg-mute">
                Aperçu
              </div>
              <img
                src={previewUrl}
                alt="Aperçu de la fiche TCO"
                className="w-full rounded-lg border border-mg-line shadow-sm"
              />
            </div>
          </motion.div>
        </motion.div>
      </main>

      <AnimatePresence>
        {addOpen && (
          <AddToDocs
            inputs={inputs}
            makePng={() => svgToPngBlob(svg, 1)}
            onClose={() => setAddOpen(false)}
            onDone={(m) => {
              setAddOpen(false)
              flash(m)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-mg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── inputs ─────────────────────────── */

function VehicleCard({
  pt,
  label,
  energyUnit,
  consoUnit,
  v,
  res,
  onChange,
}: {
  pt: Powertrain
  label: string
  energyUnit: string
  consoUnit: string
  v: VehicleInput
  res: VehicleResult
  onChange: (k: keyof VehicleInput, val: number) => void
}) {
  const Icon = ICONS[pt]
  return (
    <div className="rounded-2xl border border-mg-line bg-mg-panel p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ background: COLORS[pt] }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-bold text-mg-ink">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <NumField compact label="Prix d’achat" value={v.prixAchat} onChange={(x) => onChange('prixAchat', x)} />
        <NumField compact label="Frais admin." value={v.fraisAdmin} onChange={(x) => onChange('fraisAdmin', x)} />
        <NumField compact label={`Énergie (${energyUnit})`} value={v.coutEnergie} step="0.01" onChange={(x) => onChange('coutEnergie', x)} />
        <NumField compact label={`Conso. (${consoUnit})`} value={v.conso} step="0.1" onChange={(x) => onChange('conso', x)} />
        <NumField compact label="Entretien / an" value={v.entretien} onChange={(x) => onChange('entretien', x)} />
        <NumField compact label="Assurance / an" value={v.assurance} onChange={(x) => onChange('assurance', x)} />
        <NumField compact label="Vignette / an" value={v.vignette} onChange={(x) => onChange('vignette', x)} />
        <NumField compact label="Borne recharge" value={v.borne} onChange={(x) => onChange('borne', x)} />
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-mg-line pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-mg-mute">TCO / mois</span>
        <span className="text-lg font-extrabold" style={{ color: COLORS[pt] }}>
          {fmtDh(res.tcoMois)}
        </span>
      </div>
    </div>
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

function NumField({
  label,
  value,
  onChange,
  step,
  compact,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: string
  compact?: boolean
}) {
  return (
    <label className="block">
      <span
        className={`mb-1 block font-semibold uppercase tracking-wider text-mg-mute ${
          compact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? '1'}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`input ${compact ? 'px-2.5 py-1.5 text-sm' : ''}`}
      />
    </label>
  )
}

/* ─────────────────────────── results ─────────────────────────── */

const ROWS: { label: string; get: (r: VehicleResult) => string; strong?: boolean }[] = [
  { label: 'Prix d’achat + frais', get: (r) => fmtDh(r.totalAchat) },
  { label: 'Coût / 100 km', get: (r) => fmtDh(r.cout100) },
  { label: 'Énergie / an', get: (r) => fmtDh(r.energieAn) },
  { label: 'Entretien · assurance · vignette / an', get: (r) => fmtDh(r.autresAn) },
  { label: 'TCO / mois', get: (r) => fmtDh(r.tcoMois) },
]

function ResultsTable({ inputs, result }: { inputs: TcoInputs; result: ReturnType<typeof computeTco> }) {
  const cols: Powertrain[] = ['electrique', 'essence', 'diesel']
  const maxPeriode = Math.max(result.electrique.tcoPeriode, result.essence.tcoPeriode, result.diesel.tcoPeriode) || 1

  return (
    <div className="overflow-hidden rounded-2xl border border-mg-line bg-mg-panel shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-mg-line">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-mg-mute">
                Poste
              </th>
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 text-right">
                  <span
                    className="inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ background: COLORS[c] }}
                  >
                    {POWERTRAINS.find((p) => p.id === c)!.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 ? 'bg-mg-wash/40' : ''}>
                <td className="px-4 py-2.5 text-mg-ink-soft">{row.label}</td>
                {cols.map((c) => (
                  <td key={c} className="px-4 py-2.5 text-right font-semibold tabular-nums text-mg-ink">
                    {row.get(result[c])}
                  </td>
                ))}
              </tr>
            ))}
            {/* headline */}
            <tr className="border-t-2 border-mg-line">
              <td className="px-4 py-3 font-bold text-mg-ink">
                TCO sur {inputs.annees} ans
              </td>
              {cols.map((c) => (
                <td key={c} className="px-4 py-3 text-right">
                  <div
                    className="text-base font-extrabold tabular-nums"
                    style={{ color: c === 'electrique' ? '#E11D24' : '#1C1917' }}
                  >
                    {fmtDh(result[c].tcoPeriode)}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mg-wash">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(result[c].tcoPeriode / maxPeriode) * 100}%`, background: COLORS[c] }}
                    />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SavingsBanner({ result, annees }: { result: ReturnType<typeof computeTco>; annees: number }) {
  const eco = Math.max(result.economieEssence, result.economieDiesel)
  const vs = result.economieEssence >= result.economieDiesel ? 'essence' : 'diesel'
  if (eco <= 0) {
    return (
      <div className="rounded-2xl border border-mg-line bg-mg-wash p-5 text-center text-mg-ink-soft">
        Sur ce scénario, l’électrique n’est pas moins cher — ajustez les hypothèses.
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-mg-grad p-6 text-center text-white shadow-glow sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <TrendingDown className="h-6 w-6" />
        </span>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
            Économie de l’électrique sur {annees} ans
          </div>
          <div className="text-sm text-white/85">vs {vs}</div>
        </div>
      </div>
      <div className="text-4xl font-black tabular-nums sm:text-5xl">{fmtDh(eco)}</div>
    </div>
  )
}

/* ─────────────────────── add to documents ─────────────────────── */

function AddToDocs({
  inputs,
  makePng,
  onClose,
  onDone,
}: {
  inputs: TcoInputs
  makePng: () => Promise<Blob>
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const { add } = useStore()
  const [title, setTitle] = useState(`Comparatif TCO — ${inputs.modele}`)
  const [category, setCategory] = useState<CategoryId>('comparatifs')
  const [model, setModel] = useState(inputs.modele)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const blob = await makePng()
      const file = new File([blob], `${title.replace(/\s+/g, '-')}.png`, { type: 'image/png' })
      await add({ title, category, model: model || undefined, file, kindHint: 'image' })
      onDone('Comparatif ajouté à la bibliothèque.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l’ajout.')
      setBusy(false)
    }
  }

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-mg-ink/40 p-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 22, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 22, opacity: 0, scale: 0.98 }}
        transition={springSoft}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-mg-line bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-mg-ink">Ajouter aux documents</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-mg-wash text-mg-ink hover:bg-mg-line"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Field label="Titre">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <div className="mt-4">
          <Field label="Catégorie">
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Modèle (optionnel)">
            <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-mg-red">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Ajouter
          </button>
        </div>
      </motion.div>
    </motion.div>
    </Portal>
  )
}
