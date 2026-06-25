import { useEffect, useState } from 'react'
import type { DocMeta } from './types'
import { useStore } from './context/StoreContext'

/** Resolve a document's thumbnail URL (poster, stored thumb, or full image). */
export function useThumb(meta: DocMeta): string | undefined {
  const { resolveThumb } = useStore()
  const [url, setUrl] = useState<string | undefined>(meta.posterUrl)
  useEffect(() => {
    let active = true
    resolveThumb(meta).then((u) => {
      if (active && u) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [meta, resolveThumb])
  return url
}

/** Resolve a document's renderable/streamable URL (object URL for blobs). */
export function useDocUrl(meta: DocMeta | null | undefined): string | undefined {
  const { resolveUrl } = useStore()
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    let active = true
    if (!meta) {
      setUrl(undefined)
      return
    }
    resolveUrl(meta).then((u) => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [meta, resolveUrl])
  return url
}

/** Track a media query (e.g. mobile breakpoint). */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}
