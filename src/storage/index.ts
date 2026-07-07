import { ApiStore } from './ApiStore'
import type { DocumentStore } from './DocumentStore'

/**
 * ── Backend selection ──────────────────────────────────────────────────────
 * The app now runs against the intranet server (server/). Documents and
 * accounts live on that shared machine, so every device on the WiFi sees the
 * same library. To move to another backend later (SQLite, Google Drive, …),
 * implement the `DocumentStore` interface and swap the line below — nothing
 * else in the app changes.
 */
export const store: DocumentStore = new ApiStore()

/** Demo content is seeded server-side on first run — nothing to do here. */
export async function ensureSeeded(): Promise<void> {}

/** Wipe documents and re-seed the demo set (superadmin only, enforced server-side). */
export async function resetToDemo(): Promise<void> {
  await store.clearAll()
}

export type { DocumentStore }
