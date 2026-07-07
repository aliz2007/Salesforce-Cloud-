import type { DocMeta, NewDocInput } from '../types'
import type { DocumentStore } from './DocumentStore'
import { inferKind, makeImageThumb, makeVideoThumb } from './media'

/**
 * Talks to the intranet backend (server/). Implements the exact same
 * `DocumentStore` interface as the old IndexedDbStore, so every screen works
 * unchanged — documents now live on the shared server instead of per-browser.
 *
 * Thumbnails are generated in the browser at upload time (reusing media.ts)
 * and posted alongside the file, so the server never needs image tooling.
 */
export class ApiStore implements DocumentStore {
  readonly kind = 'api'
  readonly canWrite = true

  async list(): Promise<DocMeta[]> {
    const { docs } = await jget('/api/docs')
    return docs as DocMeta[]
  }

  async add(input: NewDocInput): Promise<DocMeta> {
    const fd = new FormData()
    fd.append('title', input.title ?? '')
    fd.append('category', input.category)
    if (input.description) fd.append('description', input.description)
    if (input.model) fd.append('model', input.model)

    if (input.file) {
      const kind = input.kindHint ?? inferKind(input.file)
      fd.append('kind', kind)
      fd.append('file', input.file, input.file.name)
      let thumb: Blob | null = null
      if (kind === 'image') thumb = await makeImageThumb(input.file)
      else if (kind === 'video') thumb = await makeVideoThumb(input.file)
      if (thumb) fd.append('thumb', thumb, 'thumb.webp')
    } else if (input.remoteUrl) {
      fd.append('remoteUrl', input.remoteUrl)
      fd.append('kind', input.kindHint ?? guessKindFromUrl(input.remoteUrl))
    } else {
      throw new Error('Fournissez un fichier ou un lien.')
    }

    const { doc } = await jfetch('/api/docs', { method: 'POST', body: fd })
    return doc as DocMeta
  }

  async update(id: string, patch: Partial<DocMeta>): Promise<DocMeta> {
    const { doc } = await jfetch(`/api/docs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    return doc as DocMeta
  }

  async remove(id: string): Promise<void> {
    await jfetch(`/api/docs/${id}`, { method: 'DELETE' })
  }

  async resolveUrl(meta: DocMeta): Promise<string> {
    if (meta.remoteUrl && meta.source !== 'seed') return meta.remoteUrl
    if (meta.source === 'seed' && meta.posterUrl) return meta.posterUrl
    return `/api/docs/${meta.id}/raw`
  }

  async resolveThumb(meta: DocMeta): Promise<string | undefined> {
    if (meta.posterUrl) return meta.posterUrl
    if (meta.hasThumb) return `/api/docs/${meta.id}/thumb`
    if (meta.kind === 'image') return `/api/docs/${meta.id}/raw`
    return undefined
  }

  async clearAll(): Promise<void> {
    // Admin-only on the server; used by "Réinitialiser la démo".
    await jfetch('/api/docs/reset', { method: 'POST' })
  }
}

/* ── fetch helpers (always send the session cookie, surface server errors) ── */

async function jfetch(url: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(url, { credentials: 'include', ...opts })
  if (!res.ok) {
    let msg = `Erreur serveur (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* non-JSON error */
    }
    throw new Error(msg)
  }
  return res.status === 204 ? {} : res.json()
}

function jget(url: string) {
  return jfetch(url, { method: 'GET' })
}

function guessKindFromUrl(url: string): DocMeta['kind'] {
  const u = url.toLowerCase()
  if (/youtube|youtu\.be|vimeo|\.mp4|\.webm/.test(u)) return 'video'
  if (/\.(png|jpe?g|webp|gif|avif|svg)/.test(u)) return 'image'
  if (/\.pdf/.test(u)) return 'pdf'
  return 'link'
}
