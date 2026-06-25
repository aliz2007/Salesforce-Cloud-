import { IndexedDbStore } from './IndexedDbStore'
import { buildSeedDocs } from '../data/seed'
import type { DocumentStore } from './DocumentStore'

/**
 * ── Backend selection ──────────────────────────────────────────────────────
 * This is the ONLY place that decides where documents live. To move to Google
 * Drive later, implement `GoogleDriveStore` (same `DocumentStore` interface)
 * and return it here. Nothing else in the app changes.
 */
export const store: DocumentStore = new IndexedDbStore()

const SEED_FLAG = 'mg-cloud-seeded-v1'

/** Seed demo content once (first ever launch on this browser). */
export async function ensureSeeded(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG)) return
  const existing = await store.list()
  if (existing.length === 0 && store instanceof IndexedDbStore) {
    await store.seed(buildSeedDocs(Date.now()))
  }
  localStorage.setItem(SEED_FLAG, '1')
}

/** Wipe everything and re-load the demo set. */
export async function resetToDemo(): Promise<void> {
  await store.clearAll()
  if (store instanceof IndexedDbStore) {
    await store.seed(buildSeedDocs(Date.now()))
  }
  localStorage.setItem(SEED_FLAG, '1')
}

export type { DocumentStore }
