// Server-side authentication: scrypt password hashing + a stateless, signed
// session cookie (HMAC over the user id). No password ever leaves the server
// in plaintext, and no crypto runs in the browser — which also means it works
// over plain http on a LAN (browser Web Crypto is disabled on non-secure
// origins, but here the server does all the hashing).
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR, db } from './db.js'

const SECRET_FILE = join(DATA_DIR, 'secret')
const COOKIE = 'mg_session'
let SECRET = ''

/** Load (or create + persist) the HMAC secret so sessions survive restarts. */
export function initSecret() {
  if (existsSync(SECRET_FILE)) {
    SECRET = readFileSync(SECRET_FILE, 'utf8').trim()
  }
  if (!SECRET) {
    SECRET = randomBytes(32).toString('hex')
    writeFileSync(SECRET_FILE, SECRET)
  }
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const a = scryptSync(String(password), salt, 32)
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

function sign(userId) {
  const mac = createHmac('sha256', SECRET).update(userId).digest('hex')
  return `${userId}.${mac}`
}

function unsign(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const idx = token.lastIndexOf('.')
  const userId = token.slice(0, idx)
  const mac = token.slice(idx + 1)
  const expected = createHmac('sha256', SECRET).update(userId).digest('hex')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return userId
}

export function setSession(res, userId) {
  res.cookie(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE)
}

/** Strip secrets before sending a user to the client. */
export function safeUser(u) {
  if (!u) return null
  const { passwordHash: _p, salt: _s, ...rest } = u
  return rest
}

export function attachUser(req, _res, next) {
  const uid = unsign(req.cookies?.[COOKIE])
  const u = uid ? db().users.find((x) => x.id === uid) : null
  req.user = safeUser(u)
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié.' })
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié.' })
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ error: 'Accès réservé au superadmin.' })
  next()
}
