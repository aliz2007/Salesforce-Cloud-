import { openDB, type IDBPDatabase } from 'idb'
import type { DocMeta, NewDocInput } from '../types'
import type { DocumentStore } from './DocumentStore'
import { inferKind, makeImageThumb, makeVideoThumb } from './media'

const DB_NAME = 'mg-sales-cloud'
const DB_VERSION = 1
const META = 'meta'
const BLOBS = 'blobs' // { id, file: Blob, thumb?: Blob }

interface BlobRecord {
  id: string
  file: Blob
  thumb?: Blob
}

/**
 * Local-first store. Metadata + file bytes live in IndexedDB, so even large
 * videos and photo sets persist across reloads without any server.
 *
 * Object URLs are cached per id and revoked on remove/clear to avoid leaks.
 */
export class IndexedDbStore implements DocumentStore {
  readonly kind = 'indexeddb'
  readonly canWrite = true

  private dbp: Promise<IDBPDatabase>
  private urlCache = new Map<string, string>()
  private thumbCache = new Map<string, string>()

  constructor() {
    this.dbp = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(BLOBS)) {
          db.createObjectStore(BLOBS, { keyPath: 'id' })
        }
      },
    })
  }

  async list(): Promise<DocMeta[]> {
    const db = await this.dbp
    const all = (await db.getAll(META)) as DocMeta[]
    return all.sort((a, b) => b.createdAt - a.createdAt)
  }

  async add(input: NewDocInput): Promise<DocMeta> {
    const db = await this.dbp
    const now = Date.now()
    const id = crypto.randomUUID()

    if (input.file) {
      const file = input.file
      const kind = input.kindHint ?? inferKind(file)
      let thumb: Blob | null = null
      if (kind === 'image') thumb = await makeImageThumb(file)
      else if (kind === 'video') thumb = await makeVideoThumb(file)

      const meta: DocMeta = {
        id,
        title: input.title || stripExt(file.name),
        description: input.description,
        category: input.category,
        model: input.model,
        kind,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        source: 'indexeddb',
        createdAt: now,
        updatedAt: now,
      }
      const blobRec: BlobRecord = { id, file, thumb: thumb ?? undefined }

      const tx = db.transaction([META, BLOBS], 'readwrite')
      await Promise.all([
        tx.objectStore(META).put(meta),
        tx.objectStore(BLOBS).put(blobRec),
        tx.done,
      ])
      return meta
    }

    // Remote link (e.g. a Drive share URL or YouTube)
    const kind = input.kindHint ?? guessKindFromUrl(input.remoteUrl || '')
    const meta: DocMeta = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      model: input.model,
      kind,
      source: 'remote',
      remoteUrl: input.remoteUrl,
      createdAt: now,
      updatedAt: now,
    }
    await db.put(META, meta)
    return meta
  }

  async update(id: string, patch: Partial<DocMeta>): Promise<DocMeta> {
    const db = await this.dbp
    const current = (await db.get(META, id)) as DocMeta | undefined
    if (!current) throw new Error(`Document introuvable: ${id}`)
    const next: DocMeta = { ...current, ...patch, id, updatedAt: Date.now() }
    await db.put(META, next)
    return next
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbp
    const tx = db.transaction([META, BLOBS], 'readwrite')
    await Promise.all([
      tx.objectStore(META).delete(id),
      tx.objectStore(BLOBS).delete(id),
      tx.done,
    ])
    this.revoke(this.urlCache, id)
    this.revoke(this.thumbCache, id)
  }

  async resolveUrl(meta: DocMeta): Promise<string> {
    if (meta.source === 'remote' && meta.remoteUrl) return meta.remoteUrl
    if (meta.source === 'seed') return meta.posterUrl || ''
    const cached = this.urlCache.get(meta.id)
    if (cached) return cached
    const db = await this.dbp
    const rec = (await db.get(BLOBS, meta.id)) as BlobRecord | undefined
    if (!rec) return ''
    const url = URL.createObjectURL(rec.file)
    this.urlCache.set(meta.id, url)
    return url
  }

  async resolveThumb(meta: DocMeta): Promise<string | undefined> {
    if (meta.posterUrl) return meta.posterUrl
    const cached = this.thumbCache.get(meta.id)
    if (cached) return cached
    const db = await this.dbp
    const rec = (await db.get(BLOBS, meta.id)) as BlobRecord | undefined
    if (rec?.thumb) {
      const url = URL.createObjectURL(rec.thumb)
      this.thumbCache.set(meta.id, url)
      return url
    }
    // For images without a stored thumb, fall back to the full file.
    if (meta.kind === 'image' && rec?.file) {
      const url = URL.createObjectURL(rec.file)
      this.thumbCache.set(meta.id, url)
      return url
    }
    return undefined
  }

  async clearAll(): Promise<void> {
    const db = await this.dbp
    const tx = db.transaction([META, BLOBS], 'readwrite')
    await Promise.all([tx.objectStore(META).clear(), tx.objectStore(BLOBS).clear(), tx.done])
    this.urlCache.forEach((u) => URL.revokeObjectURL(u))
    this.thumbCache.forEach((u) => URL.revokeObjectURL(u))
    this.urlCache.clear()
    this.thumbCache.clear()
  }

  /** Insert metadata-only records (used for demo seeding). */
  async seed(docs: DocMeta[]): Promise<void> {
    const db = await this.dbp
    const tx = db.transaction(META, 'readwrite')
    const os = tx.objectStore(META)
    await Promise.all(docs.map((d) => os.put(d)))
    await tx.done
  }

  private revoke(cache: Map<string, string>, id: string) {
    const u = cache.get(id)
    if (u) {
      URL.revokeObjectURL(u)
      cache.delete(id)
    }
  }
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function guessKindFromUrl(url: string): DocMeta['kind'] {
  const u = url.toLowerCase()
  if (/youtube|youtu\.be|vimeo|\.mp4|\.webm/.test(u)) return 'video'
  if (/\.(png|jpe?g|webp|gif|avif)/.test(u)) return 'image'
  if (/\.pdf/.test(u)) return 'pdf'
  return 'link'
}
