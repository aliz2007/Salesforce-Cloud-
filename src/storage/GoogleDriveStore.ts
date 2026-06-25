import type { DocMeta, NewDocInput } from '../types'
import type { CategoryId } from '../types'
import type { DocumentStore } from './DocumentStore'
import { CATEGORIES } from '../data/categories'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Google Drive backend — REFERENCE SCAFFOLD (not wired up yet)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The recommended, simplest model for MG Maroc:
 *
 *   1. Imane creates ONE shared Drive folder, e.g. "MG Maroc — Sales Cloud".
 *   2. Inside, one SUB-FOLDER per category (names matched loosely):
 *        Notes de prix / Fiches techniques / Vidéos / Photos extérieur /
 *        Photos intérieur / Comparatifs / Challenges / Offres spéciales
 *   3. She drops files into the matching sub-folder — that's the whole upload UX.
 *   4. The folder is shared "Anyone with the link → Viewer".
 *   5. This app LISTS + DISPLAYS them (read-only). No OAuth needed — a public
 *      Drive API key is enough.
 *
 * To enable, in `storage/index.ts`:
 *
 *   import { GoogleDriveStore } from './GoogleDriveStore'
 *   export const store = new GoogleDriveStore({
 *     apiKey: import.meta.env.VITE_GDRIVE_API_KEY,
 *     rootFolderId: import.meta.env.VITE_GDRIVE_ROOT_FOLDER_ID,
 *   })
 *
 * (Add those to a `.env` file — see `.env.example`.)
 *
 * Write operations (add/update/remove) stay in Drive's own UI in this mode,
 * which is exactly the "drop files like a cloud" experience requested. For
 * in-app uploads to Drive you'd add an OAuth flow and set `canWrite = true`.
 */

interface DriveConfig {
  apiKey: string
  rootFolderId: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  modifiedTime?: string
  size?: string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

export class GoogleDriveStore implements DocumentStore {
  readonly kind = 'googledrive'
  /** Read-only: documents are managed directly in Google Drive. */
  readonly canWrite = false

  constructor(private config: DriveConfig) {}

  async list(): Promise<DocMeta[]> {
    const categories = await this.children(this.config.rootFolderId, { foldersOnly: true })
    const out: DocMeta[] = []
    for (const folder of categories) {
      const catId = folderToCategory(folder.name)
      if (!catId) continue
      const files = await this.children(folder.id, { foldersOnly: false })
      for (const f of files) out.push(this.toMeta(f, catId))
    }
    return out.sort((a, b) => b.createdAt - a.createdAt)
  }

  async resolveUrl(meta: DocMeta): Promise<string> {
    if (!meta.remoteUrl) return ''
    // PDFs render best via Drive's preview iframe; media via direct view.
    if (meta.kind === 'pdf') return `https://drive.google.com/file/d/${meta.remoteUrl}/preview`
    return `https://drive.google.com/uc?export=view&id=${meta.remoteUrl}`
  }

  async resolveThumb(meta: DocMeta): Promise<string | undefined> {
    return meta.posterUrl
  }

  // ── Writes are managed in Drive directly (read-only backend) ──────────────
  async add(_input: NewDocInput): Promise<DocMeta> {
    throw new Error(
      'Ajout désactivé : déposez les fichiers directement dans le dossier Google Drive.',
    )
  }
  async update(_id: string, _patch: Partial<DocMeta>): Promise<DocMeta> {
    throw new Error('Modification gérée dans Google Drive.')
  }
  async remove(_id: string): Promise<void> {
    throw new Error('Suppression gérée dans Google Drive.')
  }
  async clearAll(): Promise<void> {
    /* no-op for a read-only Drive backend */
  }

  // ── Internals ─────────────────────────────────────────────────────────────
  private async children(
    parentId: string,
    { foldersOnly }: { foldersOnly: boolean },
  ): Promise<DriveFile[]> {
    const q = [
      `'${parentId}' in parents`,
      'trashed = false',
      foldersOnly ? `mimeType = '${FOLDER_MIME}'` : `mimeType != '${FOLDER_MIME}'`,
    ].join(' and ')
    const params = new URLSearchParams({
      q,
      key: this.config.apiKey,
      fields: 'files(id,name,mimeType,thumbnailLink,modifiedTime,size)',
      pageSize: '200',
    })
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`)
    if (!res.ok) throw new Error(`Drive API ${res.status}`)
    const data = (await res.json()) as { files?: DriveFile[] }
    return data.files ?? []
  }

  private toMeta(f: DriveFile, category: CategoryId): DocMeta {
    const t = f.modifiedTime ? Date.parse(f.modifiedTime) : 0
    return {
      id: `gd-${f.id}`,
      title: f.name.replace(/\.[^.]+$/, ''),
      category,
      kind: mimeToKind(f.mimeType),
      source: 'remote',
      remoteUrl: f.id, // store the Drive file id; resolveUrl builds the URL
      posterUrl: f.thumbnailLink,
      fileName: f.name,
      mimeType: f.mimeType,
      size: f.size ? Number(f.size) : undefined,
      createdAt: t,
      updatedAt: t,
    }
  }
}

function mimeToKind(mime: string): DocMeta['kind'] {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  return 'other'
}

/** Loosely map a Drive sub-folder name to one of our categories. */
function folderToCategory(name: string): CategoryId | null {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (n.includes('prix') || n.includes('tarif')) return 'note-de-prix'
  if (n.includes('technique') || n.includes('fiche')) return 'fiche-technique'
  if (n.includes('video')) return 'videos'
  if (n.includes('exterieur') || n.includes('exter')) return 'photos-exterieur'
  if (n.includes('interieur') || n.includes('inter')) return 'photos-interieur'
  if (n.includes('comparatif') || n.includes('compar')) return 'comparatifs'
  if (n.includes('challenge')) return 'challenges'
  if (n.includes('offre') || n.includes('special') || n.includes('promo')) return 'offres-speciales'
  // exact-label fallback
  const exact = CATEGORIES.find((c) => c.label.toLowerCase() === name.toLowerCase())
  return exact?.id ?? null
}
