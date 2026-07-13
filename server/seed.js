// First-run seeding: creates the superadmin (Imane) and a set of demo
// documents so the app isn't empty on a fresh install. Demo docs are real
// files served from disk (generated SVG posters), exercising the same
// upload/serve path as user content.
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { db, persist, UPLOADS_DIR } from './db.js'
import { hashPassword } from './auth.js'

export const SEED_ADMIN = { username: 'imane', displayName: 'Imane', password: 'ImaneMG' }

const CATS = {
  'note-de-prix': { label: 'Note de prix', from: '#E11D24', to: '#B5141A' },
  'fiche-technique': { label: 'Fiche technique', from: '#3b82f6', to: '#1e40af' },
  videos: { label: 'Vidéo', from: '#a855f7', to: '#6d28d9' },
  'photos-exterieur': { label: 'Extérieur', from: '#f59e0b', to: '#b45309' },
  'photos-interieur': { label: 'Intérieur', from: '#10b981', to: '#047857' },
  comparatifs: { label: 'Comparatif', from: '#06b6d4', to: '#0e7490' },
  challenges: { label: 'Challenge', from: '#eab308', to: '#a16207' },
  'offres-speciales': { label: 'Offre spéciale', from: '#ec4899', to: '#be185d' },
}

const DEMO = [
  { title: 'Grille tarifaire 2026 — Réseau Maroc', category: 'note-de-prix' },
  { title: 'Tarifs & financement', category: 'note-de-prix', model: 'MG ZS Hybrid+' },
  { title: 'Offre LOA — mensualités', category: 'note-de-prix', model: 'MG3 Hybrid+' },
  { title: 'Fiche technique', category: 'fiche-technique', model: 'MG3' },
  { title: 'Fiche technique', category: 'fiche-technique', model: 'MG5' },
  { title: 'Fiche technique — Hybrid+ 1287 km d’autonomie', category: 'fiche-technique', model: 'MG HS Hybrid+' },
  { title: 'Habitacle & écrans', category: 'photos-interieur', model: 'MG HS Hybrid+' },
  { title: 'Coloris & jantes', category: 'photos-exterieur', model: 'MG HS' },
  { title: 'Roadster — profil & design', category: 'photos-exterieur', model: 'MG Cyberster' },
  { title: 'Comparatif segment C', category: 'comparatifs' },
  { title: 'Concours showroom du mois', category: 'challenges' },
  { title: 'Offre spéciale — Reprise majorée', category: 'offres-speciales', model: 'MG3 Hybrid+' },
]

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
}

function poster({ title, sub, from, to }) {
  // A clean gradient poster with the MG mark and titles. Kept simple so it also
  // reads well when cropped into a thumbnail.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="750" fill="url(#g)"/>
  <text x="1120" y="180" text-anchor="end" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="150" fill="rgba(255,255,255,0.10)">MG</text>
  <text x="80" y="120" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="30" letter-spacing="6" fill="rgba(255,255,255,0.85)">${esc(sub).toUpperCase()}</text>
  <text x="80" y="430" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="66" fill="#ffffff">${esc(title)}</text>
  <rect x="80" y="470" width="120" height="8" rx="4" fill="rgba(255,255,255,0.7)"/>
  <text x="80" y="690" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="26" fill="rgba(255,255,255,0.85)">MG Maroc · Sales Cloud</text>
</svg>`
}

function seedDocs() {
  const now = Date.now()
  DEMO.forEach((d, i) => {
    const cat = CATS[d.category]
    const id = randomUUID()
    const svg = poster({ title: d.title, sub: d.model || cat.label, from: cat.from, to: cat.to })
    writeFileSync(join(UPLOADS_DIR, id), svg)
    db().docs.push({
      id,
      title: d.title,
      category: d.category,
      model: d.model,
      kind: 'image',
      fileName: `${d.title}.svg`,
      mimeType: 'image/svg+xml',
      size: Buffer.byteLength(svg),
      source: 'seed',
      posterUrl: `/api/docs/${id}/raw`,
      createdAt: now - i * 1000,
      updatedAt: now - i * 1000,
    })
  })
}

/** Idempotent: ensures an admin exists and (if empty) seeds demo docs. */
export function ensureSeed() {
  const d = db()
  let changed = false
  if (d.users.length === 0) {
    const now = Date.now()
    d.users.push({
      id: randomUUID(),
      username: SEED_ADMIN.username,
      displayName: SEED_ADMIN.displayName,
      role: 'superadmin',
      passwordHash: hashPassword(SEED_ADMIN.password),
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    })
    changed = true
  }
  if (d.docs.length === 0) {
    seedDocs()
    changed = true
  }
  if (changed) persist()
}
