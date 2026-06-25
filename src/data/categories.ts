import {
  Tag,
  FileText,
  Video,
  Car,
  Sofa,
  GitCompareArrows,
  Trophy,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId } from '../types'

export interface CategoryDef {
  id: CategoryId
  label: string
  short: string
  icon: LucideIcon
  /** tailwind gradient stops for accents */
  from: string
  to: string
  hint: string
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'note-de-prix',
    label: 'Notes de prix',
    short: 'Prix',
    icon: Tag,
    from: '#E2001A',
    to: '#B30015',
    hint: 'Grilles tarifaires, financement, valeurs de reprise',
  },
  {
    id: 'fiche-technique',
    label: 'Fiches techniques',
    short: 'Technique',
    icon: FileText,
    from: '#3b82f6',
    to: '#1e40af',
    hint: 'Motorisations, dimensions, équipements, finitions',
  },
  {
    id: 'videos',
    label: 'Vidéos',
    short: 'Vidéos',
    icon: Video,
    from: '#a855f7',
    to: '#6d28d9',
    hint: 'Spots, essais, présentations produit',
  },
  {
    id: 'photos-exterieur',
    label: 'Photos extérieur',
    short: 'Extérieur',
    icon: Car,
    from: '#f59e0b',
    to: '#b45309',
    hint: 'Design extérieur, coloris, jantes, profils',
  },
  {
    id: 'photos-interieur',
    label: 'Photos intérieur',
    short: 'Intérieur',
    icon: Sofa,
    from: '#10b981',
    to: '#047857',
    hint: 'Habitacle, sellerie, écrans, espace de chargement',
  },
  {
    id: 'comparatifs',
    label: 'Comparatifs',
    short: 'Comparatifs',
    icon: GitCompareArrows,
    from: '#06b6d4',
    to: '#0e7490',
    hint: 'MG vs concurrence, tableaux comparatifs',
  },
  {
    id: 'challenges',
    label: 'Challenges',
    short: 'Challenges',
    icon: Trophy,
    from: '#eab308',
    to: '#a16207',
    hint: 'Objectifs réseau, concours vendeurs, primes',
  },
  {
    id: 'offres-speciales',
    label: 'Offres spéciales MG',
    short: 'Offres',
    icon: Sparkles,
    from: '#ec4899',
    to: '#be185d',
    hint: 'Promotions du moment, séries limitées, packs',
  },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>

/** MG Maroc model line-up used for tagging/filtering documents. */
export const MG_MODELS = [
  'MG3',
  'MG5',
  'MG ZS',
  'MG HS',
  'MG4 EV',
  'MG Marvel R',
  'MG RX8',
  'MG One',
] as const
