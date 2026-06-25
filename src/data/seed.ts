import type { CategoryId, DocKind, DocMeta } from '../types'
import { makePoster } from '../storage/posters'

/**
 * Contenu de démo calé sur la gamme MG Maroc, pour que les espaces Marketing
 * et Vendeur soient vivants au premier lancement. Chaque item est un poster
 * généré hors-ligne (aucun fichier, aucun réseau). Imane remplace par ses
 * vrais supports.
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
  { title: 'Tarifs & financement', category: 'note-de-prix', kind: 'pdf', model: 'MG ZS Hybrid+' },
  { title: 'Offre LOA — mensualités', category: 'note-de-prix', kind: 'pdf', model: 'MG3 Hybrid+' },

  // Fiches techniques
  { title: 'Fiche technique — Hybrid+ 1287 km d’autonomie', category: 'fiche-technique', kind: 'pdf', model: 'MG HS Hybrid+', description: 'Motorisation, dimensions, équipements.' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG Cyberster' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG5' },
  { title: 'Fiche technique', category: 'fiche-technique', kind: 'pdf', model: 'MG3' },

  // Vidéos
  { title: 'Animés par la passion — Film de marque', category: 'videos', kind: 'video' },
  { title: 'Essai dynamique', category: 'videos', kind: 'video', model: 'MG Cyberster' },
  { title: 'Présentation Hybrid+', category: 'videos', kind: 'video', model: 'MG ZS Hybrid+' },

  // Photos extérieur
  { title: 'Pack photos extérieur — Studio', category: 'photos-exterieur', kind: 'image', model: 'MG ZS' },
  { title: 'Coloris & jantes', category: 'photos-exterieur', kind: 'image', model: 'MG HS' },
  { title: 'Roadster — profil & face avant', category: 'photos-exterieur', kind: 'image', model: 'MG Cyberster' },

  // Photos intérieur
  { title: 'Habitacle & écrans', category: 'photos-interieur', kind: 'image', model: 'MG HS Hybrid+' },
  { title: 'Sellerie & finitions', category: 'photos-interieur', kind: 'image', model: 'MG ZS' },

  // Comparatifs
  { title: 'MG ZS Hybrid+ vs SUV urbains', category: 'comparatifs', kind: 'pdf', model: 'MG ZS Hybrid+' },
  { title: 'Argumentaire Hybrid+ vs thermique', category: 'comparatifs', kind: 'pdf', model: 'MG HS Hybrid+' },

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
