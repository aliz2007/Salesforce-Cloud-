import type { DocMeta, NewDocInput } from '../types'

/**
 * The single seam between the app and "where documents live".
 *
 * v1 ships `IndexedDbStore` (runs instantly, no account, no keys).
 * A future `GoogleDriveStore` implements the SAME interface, so swapping the
 * backend is a one-line change in `storage/index.ts` — the UI never changes.
 */
export interface DocumentStore {
  readonly kind: string

  /** Whether this backend can accept uploads (Drive read-only mode = false). */
  readonly canWrite: boolean

  /** Load every document's metadata. */
  list(): Promise<DocMeta[]>

  /** Create a document from an uploaded File or a remote URL. */
  add(input: NewDocInput): Promise<DocMeta>

  /** Patch editable metadata (title, description, category, model). */
  update(id: string, patch: Partial<DocMeta>): Promise<DocMeta>

  /** Delete a document and its bytes. */
  remove(id: string): Promise<void>

  /** A URL the browser can render/stream (object URL for local blobs). */
  resolveUrl(meta: DocMeta): Promise<string>

  /** A thumbnail URL, or undefined to let the UI generate a poster. */
  resolveThumb(meta: DocMeta): Promise<string | undefined>

  /** Wipe everything (used by "réinitialiser la démo"). */
  clearAll(): Promise<void>
}
