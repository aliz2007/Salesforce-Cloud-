// MG Maroc — Sales Cloud intranet server.
// One process serves the API + the built frontend. Run on a machine on the
// showroom LAN; everyone opens http://<that-machine-ip>:<PORT>.
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { existsSync, createReadStream, unlinkSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load, db, persist, UPLOADS_DIR } from './db.js'
import {
  initSecret,
  attachUser,
  requireAuth,
  requireAdmin,
  verifyPassword,
  hashPassword,
  setSession,
  clearSession,
  safeUser,
} from './auth.js'
import { ensureSeed } from './seed.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, '..', 'dist')
const PORT = Number(process.env.PORT) || 3000

load()
initSecret()
ensureSeed()

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(attachUser)

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 2 * 1024 * 1024 * 1024 } })

const admins = () => db().users.filter((u) => u.role === 'superadmin')
const rmFiles = (id) => {
  for (const p of [join(UPLOADS_DIR, id), join(UPLOADS_DIR, `${id}.thumb`)]) {
    try {
      if (existsSync(p)) unlinkSync(p)
    } catch {
      /* ignore */
    }
  }
}

/* ─────────────────────────────── Auth ─────────────────────────────── */

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const u = db().users.find((x) => x.username === username)
  if (!u || !verifyPassword(password, u.passwordHash))
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' })
  setSession(res, u.id)
  res.json({ user: safeUser(u) })
})

app.post('/api/auth/logout', (_req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => res.json({ user: req.user }))

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const next = String(req.body?.newPassword || '')
  if (next.length < 8)
    return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' })
  const u = db().users.find((x) => x.id === req.user.id)
  if (!u) return res.status(404).json({ error: 'Compte introuvable.' })
  u.passwordHash = hashPassword(next)
  u.mustChangePassword = false
  u.updatedAt = Date.now()
  persist()
  res.json({ user: safeUser(u) })
})

/* ─────────────────────────── Users (admin) ────────────────────────── */

app.get('/api/users', requireAdmin, (_req, res) =>
  res.json({ users: db().users.map(safeUser) }),
)

app.post('/api/users', requireAdmin, (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const displayName = String(req.body?.displayName || '').trim()
  const password = String(req.body?.password || '')
  const role = req.body?.role === 'superadmin' ? 'superadmin' : 'vendeur'
  if (!username) return res.status(400).json({ error: 'Identifiant requis.' })
  if (!/^[a-z0-9._-]{2,}$/.test(username))
    return res.status(400).json({ error: 'Identifiant invalide (lettres, chiffres, . _ - ).' })
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 min).' })
  if (db().users.some((u) => u.username === username))
    return res.status(409).json({ error: 'Cet identifiant existe déjà.' })
  const now = Date.now()
  const u = {
    id: randomUUID(),
    username,
    displayName: displayName || username,
    role,
    passwordHash: hashPassword(password),
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  }
  db().users.push(u)
  persist()
  res.json({ user: safeUser(u) })
})

app.patch('/api/users/:id', requireAdmin, (req, res) => {
  const u = db().users.find((x) => x.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'Compte introuvable.' })
  if (typeof req.body?.displayName === 'string')
    u.displayName = req.body.displayName.trim() || u.displayName
  const role = req.body?.role
  if (role === 'superadmin' || role === 'vendeur') {
    if (u.role === 'superadmin' && role === 'vendeur' && admins().length <= 1)
      return res.status(400).json({ error: 'Au moins un superadmin est requis.' })
    u.role = role
  }
  u.updatedAt = Date.now()
  persist()
  res.json({ user: safeUser(u) })
})

app.post('/api/users/:id/reset-password', requireAdmin, (req, res) => {
  const u = db().users.find((x) => x.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'Compte introuvable.' })
  const password = String(req.body?.password || '')
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 min).' })
  u.passwordHash = hashPassword(password)
  u.mustChangePassword = true
  u.updatedAt = Date.now()
  persist()
  res.json({ ok: true })
})

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const u = db().users.find((x) => x.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'Compte introuvable.' })
  if (u.id === req.user.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' })
  if (u.role === 'superadmin' && admins().length <= 1)
    return res.status(400).json({ error: 'Au moins un superadmin est requis.' })
  db().users = db().users.filter((x) => x.id !== u.id)
  persist()
  res.json({ ok: true })
})

/* ──────────────────────────────── Docs ────────────────────────────── */

app.get('/api/docs', requireAuth, (_req, res) => res.json({ docs: db().docs }))

app.post(
  '/api/docs',
  requireAdmin,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumb', maxCount: 1 },
  ]),
  (req, res) => {
    const b = req.body || {}
    const id = randomUUID()
    const now = Date.now()
    const file = req.files?.file?.[0]
    const thumb = req.files?.thumb?.[0]

    if (!b.category) {
      if (file) rmFiles(file.filename)
      return res.status(400).json({ error: 'Catégorie requise.' })
    }

    let meta
    if (file) {
      renameSync(file.path, join(UPLOADS_DIR, id))
      let hasThumb = false
      if (thumb) {
        renameSync(thumb.path, join(UPLOADS_DIR, `${id}.thumb`))
        hasThumb = true
      }
      meta = {
        id,
        title: b.title || file.originalname,
        description: b.description || undefined,
        category: b.category,
        model: b.model || undefined,
        kind: b.kind || 'other',
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        source: 'remote',
        hasThumb,
        createdAt: now,
        updatedAt: now,
      }
    } else if (b.remoteUrl) {
      meta = {
        id,
        title: b.title || b.remoteUrl,
        description: b.description || undefined,
        category: b.category,
        model: b.model || undefined,
        kind: b.kind || 'link',
        source: 'remote',
        remoteUrl: b.remoteUrl,
        createdAt: now,
        updatedAt: now,
      }
    } else {
      return res.status(400).json({ error: 'Aucun fichier ou lien fourni.' })
    }

    db().docs.unshift(meta)
    persist()
    res.json({ doc: meta })
  },
)

app.patch('/api/docs/:id', requireAdmin, (req, res) => {
  const d = db().docs.find((x) => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: 'Document introuvable.' })
  const { title, description, category, model } = req.body || {}
  if (typeof title === 'string') d.title = title
  if (typeof description === 'string') d.description = description || undefined
  if (typeof category === 'string') d.category = category
  if (typeof model === 'string') d.model = model || undefined
  d.updatedAt = Date.now()
  persist()
  res.json({ doc: d })
})

app.delete('/api/docs/:id', requireAdmin, (req, res) => {
  const d = db().docs.find((x) => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: 'Document introuvable.' })
  db().docs = db().docs.filter((x) => x.id !== d.id)
  persist()
  rmFiles(d.id)
  res.json({ ok: true })
})

app.post('/api/docs/reset', requireAdmin, (_req, res) => {
  for (const d of db().docs) rmFiles(d.id)
  db().docs = []
  persist()
  ensureSeed()
  res.json({ docs: db().docs })
})

app.get('/api/docs/:id/raw', requireAuth, (req, res) => {
  const d = db().docs.find((x) => x.id === req.params.id)
  if (!d) return res.status(404).end()
  // External links: bounce to the source (only when it's a real external URL).
  if (d.remoteUrl && d.source !== 'seed') return res.redirect(d.remoteUrl)
  const p = join(UPLOADS_DIR, d.id)
  if (!existsSync(p)) return res.status(404).end()
  res.setHeader('Content-Type', d.mimeType || 'application/octet-stream')
  const dl = req.query.download !== undefined ? 'attachment' : 'inline'
  res.setHeader(
    'Content-Disposition',
    `${dl}; filename*=UTF-8''${encodeURIComponent(d.fileName || d.title)}`,
  )
  createReadStream(p).pipe(res)
})

app.get('/api/docs/:id/thumb', requireAuth, (req, res) => {
  const d = db().docs.find((x) => x.id === req.params.id)
  if (!d) return res.status(404).end()
  const p = join(UPLOADS_DIR, `${d.id}.thumb`)
  if (!existsSync(p)) return res.status(404).end()
  res.setHeader('Content-Type', 'image/webp')
  createReadStream(p).pipe(res)
})

/* ───────────────────── Static frontend + SPA fallback ─────────────── */

app.use(express.static(DIST))
// Anything else that isn't an API call → serve the SPA shell.
app.use((req, res) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/'))
    return res.status(404).json({ error: 'Not found' })
  res.sendFile(join(DIST, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  MG Sales Cloud — serveur prêt`)
  console.log(`  Local :   http://localhost:${PORT}`)
  console.log(`  Réseau :  http://<IP-de-cette-machine>:${PORT}\n`)
})
