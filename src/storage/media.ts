import type { DocKind } from '../types'

/** Infer a coarse document kind from a File or mime/extension. */
export function inferKind(input: { type?: string; name?: string }): DocKind {
  const type = (input.type || '').toLowerCase()
  const name = (input.name || '').toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif|avif)$/.test(name)) return 'image'
  if (/\.(mp4|webm|mov|m4v)$/.test(name)) return 'video'
  return 'other'
}

/**
 * Downscale an image file to a thumbnail blob (max edge ~640px).
 * Returns null if it can't be decoded.
 */
export async function makeImageThumb(file: Blob, maxEdge = 640): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.82),
    )
  } catch {
    return null
  }
}

/**
 * Grab a poster frame from a video file (~1s in) as a thumbnail blob.
 * Best-effort: returns null if the codec/browser won't cooperate.
 */
export async function makeVideoThumb(file: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = url

    const cleanup = () => URL.revokeObjectURL(url)
    const fail = () => {
      cleanup()
      resolve(null)
    }

    video.onloadedmetadata = () => {
      const t = Math.min(1, (video.duration || 2) / 2)
      video.currentTime = isFinite(t) ? t : 0
    }
    video.onseeked = () => {
      try {
        const maxEdge = 640
        const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
        const w = Math.max(1, Math.round(video.videoWidth * scale))
        const h = Math.max(1, Math.round(video.videoHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return fail()
        ctx.drawImage(video, 0, 0, w, h)
        canvas.toBlob(
          (b) => {
            cleanup()
            resolve(b)
          },
          'image/webp',
          0.82,
        )
      } catch {
        fail()
      }
    }
    video.onerror = fail
    // Safety timeout
    setTimeout(fail, 6000)
  })
}

export function humanSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return ''
  const units = ['o', 'Ko', 'Mo', 'Go']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}
