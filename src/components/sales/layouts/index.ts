import type { ComponentType } from 'react'
import {
  CircleDot,
  LayoutGrid,
  Waypoints,
  GalleryHorizontalEnd,
  type LucideIcon,
} from 'lucide-react'
import type { DocMeta } from '../../../types'
import type { LayoutId } from '../../../context/SalesSettings'
import BubblesLayout from './BubblesLayout'
import GridLayout from './GridLayout'
import MapLayout from './MapLayout'
import CarouselLayout from './CarouselLayout'

export interface LayoutMeta {
  id: LayoutId
  /** French label shown in the settings panel. */
  label: string
  icon: LucideIcon
}

export type LayoutComponent = ComponentType<{
  docs: DocMeta[]
  onPick: (i: number) => void
}>

export const LAYOUTS: Record<
  LayoutId,
  { meta: LayoutMeta; Component: LayoutComponent }
> = {
  bubbles: {
    meta: { id: 'bubbles', label: 'Bulles', icon: CircleDot },
    Component: BubblesLayout,
  },
  grid: {
    meta: { id: 'grid', label: 'Grille', icon: LayoutGrid },
    Component: GridLayout,
  },
  map: {
    meta: { id: 'map', label: 'Constellation', icon: Waypoints },
    Component: MapLayout,
  },
  carousel: {
    meta: { id: 'carousel', label: 'Carrousel', icon: GalleryHorizontalEnd },
    Component: CarouselLayout,
  },
}

/** Ordered list for rendering the picker (matches the 2x2 grid). */
export const LAYOUT_ORDER: LayoutId[] = ['bubbles', 'grid', 'map', 'carousel']
