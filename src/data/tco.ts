/**
 * TCO — Coût Total de Possession.
 *
 * Reproduces Imane's Excel model (sheet "TCO"): compares an electric, a petrol
 * and a diesel MG SUV over a holding period. Purchase + energy + maintenance +
 * insurance + vignette → TCO over the period, and the electric "savings gap".
 */

export type Powertrain = 'electrique' | 'essence' | 'diesel'

export const POWERTRAINS: { id: Powertrain; label: string; energyUnit: string; consoUnit: string }[] = [
  { id: 'electrique', label: 'Électrique', energyUnit: 'dh/kWh', consoUnit: 'kWh/100 km' },
  { id: 'essence', label: 'Essence', energyUnit: 'dh/L', consoUnit: 'L/100 km' },
  { id: 'diesel', label: 'Diesel', energyUnit: 'dh/L', consoUnit: 'L/100 km' },
]

/** Per-vehicle inputs (energy price + consumption units depend on powertrain). */
export interface VehicleInput {
  prixAchat: number
  fraisAdmin: number
  borne: number
  coutEnergie: number
  conso: number
  entretien: number
  assurance: number
  vignette: number
}

export interface TcoInputs {
  modele: string
  kmAn: number
  annees: number
  electrique: VehicleInput
  essence: VehicleInput
  diesel: VehicleInput
}

/** Defaults straight from the spreadsheet (MG SUV scenario). */
export const DEFAULT_TCO: TcoInputs = {
  modele: 'MG ZS EV',
  kmAn: 20000,
  annees: 4,
  electrique: { prixAchat: 300000, fraisAdmin: 8500, borne: 0, coutEnergie: 1.17, conso: 17, entretien: 1000, assurance: 5000, vignette: 0 },
  essence: { prixAchat: 250000, fraisAdmin: 7000, borne: 0, coutEnergie: 15, conso: 6.8, entretien: 1900, assurance: 5000, vignette: 350 },
  diesel: { prixAchat: 250000, fraisAdmin: 6000, borne: 0, coutEnergie: 13, conso: 5.9, entretien: 2500, assurance: 5000, vignette: 750 },
}

export interface VehicleResult {
  totalAchat: number // prix + frais + borne
  cout100: number // coût énergie / 100 km
  energieAn: number // coût énergie / an
  autresAn: number // entretien + assurance + vignette / an
  tcoAn: number // achat + énergie/an + autres/an
  tcoMois: number
  utilisationDuree: number // (énergie/an + autres/an) × années
  tcoPeriode: number // achat + utilisation sur la durée  ← chiffre phare
}

export interface TcoResult {
  electrique: VehicleResult
  essence: VehicleResult
  diesel: VehicleResult
  /** electric − thermal (négatif = l'électrique coûte moins). */
  gapEssence: number
  gapDiesel: number
  /** Économies de l'électrique (>0 quand l'électrique est moins cher). */
  economieEssence: number
  economieDiesel: number
}

export function computeVehicle(v: VehicleInput, kmAn: number, annees: number): VehicleResult {
  const totalAchat = v.prixAchat + v.fraisAdmin + v.borne
  const cout100 = v.coutEnergie * v.conso
  const energieAn = (cout100 * kmAn) / 100
  const autresAn = v.entretien + v.assurance + v.vignette
  const tcoAn = totalAchat + energieAn + autresAn
  const utilisationDuree = (energieAn + autresAn) * annees
  const tcoPeriode = totalAchat + utilisationDuree
  return { totalAchat, cout100, energieAn, autresAn, tcoAn, tcoMois: tcoAn / 12, utilisationDuree, tcoPeriode }
}

export function computeTco(i: TcoInputs): TcoResult {
  const electrique = computeVehicle(i.electrique, i.kmAn, i.annees)
  const essence = computeVehicle(i.essence, i.kmAn, i.annees)
  const diesel = computeVehicle(i.diesel, i.kmAn, i.annees)
  const gapEssence = electrique.tcoPeriode - essence.tcoPeriode
  const gapDiesel = electrique.tcoPeriode - diesel.tcoPeriode
  return {
    electrique,
    essence,
    diesel,
    gapEssence,
    gapDiesel,
    economieEssence: Math.max(0, -gapEssence),
    economieDiesel: Math.max(0, -gapDiesel),
  }
}

/* ─────────────────────────── formatting ─────────────────────────── */

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const fmtDh = (n: number) => `${nf.format(Math.round(n))} dh`
export const fmt = (n: number) => nf.format(Math.round(n))
export const fmt2 = (n: number) => nf2.format(n)

/* ─────────────────── export: branded SVG poster ─────────────────── */

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Build a clean, presentation-ready comparison poster (A4 portrait) as an SVG
 * string. Rasterised to PNG for export or upload.
 */
export function buildTcoPosterSvg(i: TcoInputs, r: TcoResult): string {
  const W = 1240
  const H = 1754
  const cols = [
    { key: 'electrique' as const, label: 'Électrique', res: r.electrique, accent: '#E11D24', head: '#E11D24' },
    { key: 'essence' as const, label: 'Essence', res: r.essence, accent: '#57534D', head: '#57534D' },
    { key: 'diesel' as const, label: 'Diesel', res: r.diesel, accent: '#8A857E', head: '#8A857E' },
  ]

  const rows: { label: string; get: (v: VehicleResult, k: Powertrain) => string }[] = [
    { label: "Prix d'achat + frais", get: (v) => fmtDh(v.totalAchat) },
    { label: 'Coût énergie / an', get: (v) => fmtDh(v.energieAn) },
    { label: 'Entretien · assurance · vignette / an', get: (v) => fmtDh(v.autresAn) },
    { label: 'TCO / mois', get: (v) => fmtDh(v.tcoMois) },
    { label: `Utilisation sur ${i.annees} ans`, get: (v) => fmtDh(v.utilisationDuree) },
  ]

  // table geometry
  const x0 = 80
  const labelW = 470
  const colW = 200
  const gap = 10
  const tableTop = 470
  const rowH = 74
  const colX = (idx: number) => x0 + labelW + gap + idx * (colW + gap)

  const rowsSvg = rows
    .map((row, ri) => {
      const y = tableTop + 60 + ri * rowH
      const zebra = ri % 2 === 0 ? '#FAF9F7' : '#FFFFFF'
      const cells = cols
        .map((c, ci) => {
          const cx = colX(ci) + colW / 2
          return `<text x="${cx}" y="${y + 47}" text-anchor="middle" font-family="Inter,Arial" font-size="26" font-weight="700" fill="#1C1917">${esc(row.get(c.res, c.key))}</text>`
        })
        .join('')
      return `<rect x="${x0}" y="${y}" width="${W - 2 * x0}" height="${rowH}" fill="${zebra}"/>
      <text x="${x0 + 20}" y="${y + 47}" font-family="Inter,Arial" font-size="24" fill="#57534D">${esc(row.label)}</text>${cells}`
    })
    .join('')

  // headline TCO row
  const headY = tableTop + 60 + rows.length * rowH + 6
  const headlineCells = cols
    .map((c, ci) => {
      const cx = colX(ci) + colW / 2
      return `<rect x="${colX(ci)}" y="${headY}" width="${colW}" height="86" rx="12" fill="${ci === 0 ? '#FFF1F1' : '#F6F5F3'}"/>
      <text x="${cx}" y="${headY + 36}" text-anchor="middle" font-family="Inter,Arial" font-size="17" font-weight="700" fill="#8A857E" letter-spacing="1">TCO ${i.annees} ANS</text>
      <text x="${cx}" y="${headY + 66}" text-anchor="middle" font-family="Inter,Arial" font-size="27" font-weight="800" fill="${ci === 0 ? '#E11D24' : '#1C1917'}">${esc(fmtDh(c.res.tcoPeriode))}</text>`
    })
    .join('')

  // bar chart (TCO over the period)
  const chartTop = headY + 150
  const chartH = 300
  const maxV = Math.max(...cols.map((c) => c.res.tcoPeriode)) || 1
  const barW = 150
  const barGap = 120
  const barsX = W / 2 - (cols.length * barW + (cols.length - 1) * barGap) / 2
  const bars = cols
    .map((c, ci) => {
      const bh = (c.res.tcoPeriode / maxV) * chartH
      const bx = barsX + ci * (barW + barGap)
      const by = chartTop + chartH - bh
      return `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="10" fill="${c.accent}"/>
      <text x="${bx + barW / 2}" y="${by - 18}" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="800" fill="#1C1917">${esc(fmt(c.res.tcoPeriode))}</text>
      <text x="${bx + barW / 2}" y="${chartTop + chartH + 38}" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="700" fill="#57534D">${esc(c.label)}</text>`
    })
    .join('')

  // savings highlight
  const eco = Math.max(r.economieEssence, r.economieDiesel)
  const bestVs = r.economieEssence >= r.economieDiesel ? 'Essence' : 'Diesel'
  const sY = chartTop + chartH + 110
  const savings =
    eco > 0
      ? `<rect x="${x0}" y="${sY}" width="${W - 2 * x0}" height="150" rx="20" fill="#E11D24"/>
       <text x="${W / 2}" y="${sY + 56}" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="700" fill="rgba(255,255,255,.85)" letter-spacing="1">ÉCONOMIE DE L'ÉLECTRIQUE SUR ${i.annees} ANS</text>
       <text x="${W / 2}" y="${sY + 116}" text-anchor="middle" font-family="Inter,Arial" font-size="58" font-weight="900" fill="#FFFFFF">${esc(fmtDh(eco))}</text>
       <text x="${W / 2}" y="${sY + 145}" text-anchor="middle" font-family="Inter,Arial" font-size="19" fill="rgba(255,255,255,.8)">vs ${bestVs} · ${esc(i.modele)} · ${esc(fmt(i.kmAn))} km/an</text>`
      : `<rect x="${x0}" y="${sY}" width="${W - 2 * x0}" height="150" rx="20" fill="#F6F5F3"/>
       <text x="${W / 2}" y="${sY + 85}" text-anchor="middle" font-family="Inter,Arial" font-size="30" font-weight="800" fill="#1C1917">Écart TCO — voir le détail ci-dessus</text>`

  // header
  const colHeads = cols
    .map((c, ci) => {
      const cx = colX(ci) + colW / 2
      return `<rect x="${colX(ci)}" y="${tableTop}" width="${colW}" height="52" rx="10" fill="${c.head}"/>
      <text x="${cx}" y="${tableTop + 34}" text-anchor="middle" font-family="Inter,Arial" font-size="23" font-weight="800" fill="#FFFFFF">${esc(c.label)}</text>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <rect x="0" y="0" width="${W}" height="180" fill="#0E0E10"/>
  <text x="${W}" y="132" text-anchor="end" font-family="Inter,Arial" font-weight="900" font-size="150" fill="rgba(255,255,255,0.06)">MG</text>
  <text x="${x0}" y="86" font-family="Inter,Arial" font-size="26" font-weight="800" letter-spacing="5" fill="#FF5C5F">MG MAROC · COMPARATIF</text>
  <text x="${x0}" y="140" font-family="Inter,Arial" font-size="46" font-weight="900" fill="#FFFFFF">Coût Total de Possession</text>
  <text x="${x0}" y="250" font-family="Inter,Arial" font-size="30" font-weight="800" fill="#1C1917">${esc(i.modele)}</text>
  <text x="${x0}" y="290" font-family="Inter,Arial" font-size="23" fill="#57534D">${esc(fmt(i.kmAn))} km/an · durée de possession ${i.annees} ans</text>
  <text x="${x0}" y="${tableTop - 24}" font-family="Inter,Arial" font-size="20" font-weight="700" letter-spacing="1" fill="#8A857E">DÉTAIL ANNUEL &amp; SUR LA DURÉE</text>
  ${colHeads}
  ${rowsSvg}
  ${headlineCells}
  ${bars}
  ${savings}
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="Inter,Arial" font-size="18" fill="#8A857E">MG Maroc · Sales Cloud · Estimation indicative — à reconfirmer</text>
</svg>`
}

/** Rasterise an SVG string to a PNG Blob via an offscreen canvas. */
export async function svgToPngBlob(svg: string, scale = 1): Promise<Blob> {
  const sized = svg.match(/width="(\d+)" height="(\d+)"/)
  const w = sized ? Number(sized[1]) : 1240
  const h = sized ? Number(sized[2]) : 1754
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  const img = new Image()
  img.decoding = 'sync'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG render failed'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d indisponible')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
