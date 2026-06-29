import type { Progress, SessionRecord } from '../types'

const KEY_API = 'lingua.apiKey'
const KEY_PROGRESS = 'lingua.progress'
const KEY_PREFS = 'lingua.prefs'

export interface Prefs {
  lang: string
  level: 'beginner' | 'intermediate' | 'advanced'
  mode: 'speak' | 'type'
}

export function getApiKey(): string {
  // Allow a build-time key (VITE_ANTHROPIC_API_KEY) but prefer the user's own.
  return localStorage.getItem(KEY_API) ?? (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ?? ''
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem(KEY_API, key.trim())
  else localStorage.removeItem(KEY_API)
}

export function loadPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(KEY_PREFS)
    return raw ? (JSON.parse(raw) as Prefs) : null
  } catch {
    return null
  }
}

export function savePrefs(prefs: Prefs) {
  localStorage.setItem(KEY_PREFS, JSON.stringify(prefs))
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY_PROGRESS)
    if (!raw) return { records: [] }
    const parsed = JSON.parse(raw) as Progress
    return { records: Array.isArray(parsed.records) ? parsed.records : [] }
  } catch {
    return { records: [] }
  }
}

export function addRecord(record: SessionRecord): Progress {
  const progress = loadProgress()
  progress.records.unshift(record)
  // Keep history bounded.
  progress.records = progress.records.slice(0, 200)
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(progress))
  return progress
}

export function clearProgress() {
  localStorage.removeItem(KEY_PROGRESS)
}
