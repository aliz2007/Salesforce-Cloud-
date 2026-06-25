import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { DocMeta, NewDocInput } from '../types'
import { store, ensureSeeded, resetToDemo } from '../storage'

interface StoreContextValue {
  ready: boolean
  docs: DocMeta[]
  canWrite: boolean
  add: (input: NewDocInput) => Promise<DocMeta>
  update: (id: string, patch: Partial<DocMeta>) => Promise<void>
  remove: (id: string) => Promise<void>
  reset: () => Promise<void>
  resolveUrl: (meta: DocMeta) => Promise<string>
  resolveThumb: (meta: DocMeta) => Promise<string | undefined>

  // ── Sales selection (the set the vendeur will present) ──
  selectedIds: Set<string>
  selectedDocs: DocMeta[]
  isSelected: (id: string) => boolean
  toggleSelect: (id: string) => void
  selectMany: (ids: string[], on: boolean) => void
  clearSelection: () => void
}

const Ctx = createContext<StoreContextValue | null>(null)

const SELECTION_KEY = 'mg-cloud-selection-v1'

function loadSelection(): Set<string> {
  try {
    const raw = localStorage.getItem(SELECTION_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(loadSelection)
  const thumbCache = useRef(new Map<string, string | undefined>())

  const refresh = useCallback(async () => {
    const all = await store.list()
    setDocs(all)
    return all
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      await ensureSeeded()
      const all = await store.list()
      if (!active) return
      setDocs(all)
      // Drop any selected ids that no longer exist.
      setSelectedIds((prev) => {
        const valid = new Set([...prev].filter((id) => all.some((d) => d.id === id)))
        return valid
      })
      setReady(true)
    })()
    return () => {
      active = false
    }
  }, [])

  // Persist selection
  useEffect(() => {
    localStorage.setItem(SELECTION_KEY, JSON.stringify([...selectedIds]))
  }, [selectedIds])

  const add = useCallback(
    async (input: NewDocInput) => {
      const created = await store.add(input)
      await refresh()
      return created
    },
    [refresh],
  )

  const update = useCallback(
    async (id: string, patch: Partial<DocMeta>) => {
      await store.update(id, patch)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id)
      thumbCache.current.delete(id)
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await refresh()
    },
    [refresh],
  )

  const reset = useCallback(async () => {
    await resetToDemo()
    thumbCache.current.clear()
    setSelectedIds(new Set())
    await refresh()
  }, [refresh])

  const resolveUrl = useCallback((meta: DocMeta) => store.resolveUrl(meta), [])

  const resolveThumb = useCallback(async (meta: DocMeta) => {
    if (thumbCache.current.has(meta.id)) return thumbCache.current.get(meta.id)
    const url = await store.resolveThumb(meta)
    thumbCache.current.set(meta.id, url)
    return url
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectMany = useCallback((ids: string[], on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const selectedDocs = useMemo(
    () => docs.filter((d) => selectedIds.has(d.id)),
    [docs, selectedIds],
  )

  const value: StoreContextValue = {
    ready,
    docs,
    canWrite: store.canWrite,
    add,
    update,
    remove,
    reset,
    resolveUrl,
    resolveThumb,
    selectedIds,
    selectedDocs,
    isSelected,
    toggleSelect,
    selectMany,
    clearSelection,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
