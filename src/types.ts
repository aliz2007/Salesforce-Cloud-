/**
 * Domain model for the MG Maroc Sales Cloud.
 *
 * Everything the UI manipulates is a `DocMeta`. The actual bytes (a PDF,
 * an image, a video) live behind the `DocumentStore` abstraction so we can
 * swap the local IndexedDB backend for Google Drive without touching the UI.
 */

export type CategoryId =
  | 'note-de-prix'
  | 'fiche-technique'
  | 'videos'
  | 'photos-exterieur'
  | 'photos-interieur'
  | 'comparatifs'
  | 'challenges'
  | 'offres-speciales'

export type DocKind = 'pdf' | 'image' | 'video' | 'link' | 'other'

export interface DocMeta {
  id: string
  title: string
  description?: string
  category: CategoryId
  kind: DocKind
  /** MG model this document relates to, e.g. "MG ZS", "MG4 EV". Optional. */
  model?: string
  fileName?: string
  mimeType?: string
  size?: number
  /**
   * Where the bytes live.
   *  - 'indexeddb'  -> blob stored locally, keyed by `id`
   *  - 'remote'     -> `remoteUrl` points to a hosted file (e.g. Drive)
   *  - 'seed'       -> generated poster only (demo content)
   */
  source: 'indexeddb' | 'remote' | 'seed'
  remoteUrl?: string
  /** Optional pre-computed thumbnail as a data/remote URL (seed + remote). */
  posterUrl?: string
  createdAt: number
  updatedAt: number
}

export interface NewDocInput {
  title: string
  description?: string
  category: CategoryId
  model?: string
  /** Provide a File for an upload... */
  file?: File
  /** ...or a remoteUrl for a link / hosted file. */
  remoteUrl?: string
  kindHint?: DocKind
}

export type Role = 'marketing' | 'vendeur'
