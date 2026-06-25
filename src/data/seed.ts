import type { CategoryId, DocKind, DocMeta } from '../types'
import { makePoster } from '../storage/posters'

/**
 * Demo content so both the Marketing dashboard and the Sales browser look
 * alive on first launch. Each item is a generated, offline poster (no files,
 * no network). Imane replaces these with real uploads.
 */

interface SeedSpec {
  title: string
  category: CategoryId
  kind: DocKind
  model?: string
  description?: string
}

const SPECS: SeedSpec[] = [
  // Notes de prix
  { title: 'Grille tarifaire 2026 — Réseau Maroc', category: 'note-de-prix', kind: 'pdf', description: 'Tarifs publics TTC, toutes finitions.' },
  { title: 'Tarifs MG ZS — Juin 2026', category: 'note-de-prix', kind: 'pdf', model: 'MG ZS' },
  { title: 'Offre financement LOA — MG4 EV', category: 'note-de-prix', kind: 'pdf', model: 'MG4 EV' },

  // Fiches techniques
  { title: 'Fiche technique complète', category: 'fiche-technique', kind: 'pdf', model: 'MG HS', description: 'Motorisation, dimensions, équipements.' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG4 EV' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG5' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG3' },

  // Vidéos
  { title: 'Film de lancement', category: 'videos', kind: 'video', model: 'MG Marvel R' },
  { title: 'Essai dynamique', category: 'videos', kind: 'video', model: 'MG4 EV' },
  { title: 'Spot TV — Saison 2026', category: 'videos', kind: 'video' },

  // Photos extérieur
  { title: 'Pack photos extérieur — Studio', category: 'photos-exterieur', kind: 'image', model: 'MG ZS' },
  { title: 'Coloris & jantes', category: 'photos-exterieur', kind: 'image', model: 'MG HS' },
  { title: 'Profil & face avant', category: 'photos-exterieur', kind: 'image', model: 'MG4 EV' },

  // Photos intérieur
  { title: 'Habitacle & écrans', category: 'photos-interieur', kind: 'image', model: 'MG HS' },
  { title: 'Sellerie & finitions', category: 'photos-interieur', kind: 'image', model: 'MG ZS' },

  // Comparatifs
  { title: 'MG ZS vs concurrence SUV urbain', category: 'comparatifs', kind: 'pdf', model: 'MG ZS' },
  { title: 'MG4 EV vs électriques compactes', category: 'comparatifs', kind: 'pdf', model: 'MG4 EV' },

  // Challenges
  { title: 'Challenge réseau — Trophée des ventes Q3', category: 'challenges', kind: 'image', description: 'Objectifs et primes vendeurs.' },
  { title: 'Concours showroom du mois', category: 'challenges', kind: 'pdf' },

  // Offres spéciales
  { title: 'Offre spéciale — Reprise majorée', category: 'offres-speciales', kind: 'image', description: 'Jusqu’à 10 000 DH de reprise.' },
  { title: 'Série limitée MG ZS Black Edition', category: 'offres-speciales', kind: 'image', model: 'MG ZS' },
]

export function buildSeedDocs(baseTime: number): DocMeta[] {
  return SPECS.map((s, i) => {
    const id = `seed-${i}`
    const t = baseTime - i * 60_000
    return {
      id,
      title: s.title,
      description: s.description,
      category: s.category,
      kind: s.kind,
      model: s.model,
      source: 'seed' as const,
      posterUrl: makePoster({ category: s.category, title: s.title, model: s.model, kind: s.kind, seed: i + 1 }),
      createdAt: t,
      updatedAt: t,
    }
  })
}
