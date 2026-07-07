// Tiny JSON-file datastore — zero native deps, perfect for a single-process
// intranet server. Metadata lives in data/db.json; uploaded bytes live under
// data/uploads/. Swap this module for SQLite/Postgres later without touching
// the routes (they only talk to db()/persist()).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = process.env.MG_DATA_DIR || join(HERE, 'data')
export const UPLOADS_DIR = join(DATA_DIR, 'uploads')
const DB_FILE = join(DATA_DIR, 'db.json')

const EMPTY = { users: [], docs: [] }
let data = { ...EMPTY }

function ensureDirs() {
  mkdirSync(UPLOADS_DIR, { recursive: true })
}

/** Load the DB from disk (called once at startup). */
export function load() {
  ensureDirs()
  if (existsSync(DB_FILE)) {
    try {
      data = JSON.parse(readFileSync(DB_FILE, 'utf8'))
    } catch {
      data = { ...EMPTY }
    }
  } else {
    data = { ...EMPTY }
  }
  if (!Array.isArray(data.users)) data.users = []
  if (!Array.isArray(data.docs)) data.docs = []
  return data
}

/** The in-memory DB. Mutate then call persist(). */
export function db() {
  return data
}

/** Atomically write the DB to disk (temp file + rename). */
export function persist() {
  ensureDirs()
  const tmp = `${DB_FILE}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, DB_FILE)
}
