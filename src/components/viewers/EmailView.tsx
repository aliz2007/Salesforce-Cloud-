import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Mail, User, Users, CalendarDays } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fadeUp } from '../../motion'

interface ParsedEmail {
  from?: string
  to?: string
  cc?: string
  subject?: string
  date?: string
  body: string
  /** true when the body came from a text/html part (we render it escaped). */
  htmlSource: boolean
}

/** A single MIME part: its headers plus raw (still-encoded) body text. */
interface Part {
  headers: Record<string, string>
  body: string
}

function splitHeadersBody(raw: string): { head: string; body: string } {
  const norm = raw.replace(/\r\n/g, '\n')
  const idx = norm.indexOf('\n\n')
  if (idx === -1) return { head: norm, body: '' }
  return { head: norm.slice(0, idx), body: norm.slice(idx + 2) }
}

/** Parse a header block, unfolding continuation lines, into a lowercase map. */
function parseHeaders(head: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = head.split('\n')
  let key = ''
  for (const line of lines) {
    if (/^\s/.test(line) && key) {
      out[key] += ' ' + line.trim()
    } else {
      const c = line.indexOf(':')
      if (c === -1) continue
      key = line.slice(0, c).trim().toLowerCase()
      out[key] = line.slice(c + 1).trim()
    }
  }
  return out
}

function paramOf(headerValue: string | undefined, name: string): string | undefined {
  if (!headerValue) return undefined
  const m = headerValue.match(new RegExp(`${name}\\s*=\\s*"?([^";]+)"?`, 'i'))
  return m ? m[1] : undefined
}

/** Decode quoted-printable text. */
function decodeQuotedPrintable(input: string): string {
  const joined = input.replace(/=\r?\n/g, '') // soft line breaks
  const bytes: number[] = []
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i]
    if (ch === '=' && /[0-9A-Fa-f]{2}/.test(joined.substr(i + 1, 2))) {
      bytes.push(parseInt(joined.substr(i + 1, 2), 16))
      i += 2
    } else {
      bytes.push(ch.charCodeAt(0))
    }
  }
  return utf8Decode(bytes)
}

/** Decode base64 (tolerating whitespace) to a UTF-8 string. */
function decodeBase64(input: string): string {
  try {
    const clean = input.replace(/[^A-Za-z0-9+/=]/g, '')
    const bin = atob(clean)
    const bytes: number[] = []
    for (let i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i))
    return utf8Decode(bytes)
  } catch {
    return input
  }
}

function utf8Decode(bytes: number[]): string {
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
  } catch {
    return String.fromCharCode(...bytes)
  }
}

function decodeBody(body: string, encoding?: string): string {
  const enc = (encoding || '').toLowerCase()
  if (enc === 'quoted-printable') return decodeQuotedPrintable(body)
  if (enc === 'base64') return decodeBase64(body)
  return body.replace(/\r\n/g, '\n')
}

/** Decode RFC 2047 encoded-words in header values (=?utf-8?B?…?=). */
function decodeHeaderWords(value: string): string {
  return value.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_all, _cs, enc, data) => {
    if (/B/i.test(enc)) return decodeBase64(data)
    const qp = data.replace(/_/g, ' ')
    return decodeQuotedPrintable(qp)
  })
}

/** Strip tags from an HTML body so it can be shown as readable plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Recursively select the best body part from a (possibly multipart) message. */
function pickBody(part: Part): { text: string; htmlSource: boolean } {
  const ctype = (part.headers['content-type'] || 'text/plain').toLowerCase()
  const encoding = part.headers['content-transfer-encoding']

  if (ctype.startsWith('multipart/')) {
    const boundary = paramOf(part.headers['content-type'], 'boundary')
    if (!boundary) return { text: decodeBody(part.body, encoding), htmlSource: false }
    const subs = splitMultipart(part.body, boundary)
    let htmlFallback: { text: string; htmlSource: boolean } | null = null
    for (const sub of subs) {
      const subType = (sub.headers['content-type'] || 'text/plain').toLowerCase()
      if (subType.startsWith('multipart/')) {
        const nested = pickBody(sub)
        if (nested.text && !nested.htmlSource) return nested
        if (nested.text && !htmlFallback) htmlFallback = nested
      } else if (subType.startsWith('text/plain')) {
        return pickBody(sub)
      } else if (subType.startsWith('text/html') && !htmlFallback) {
        htmlFallback = pickBody(sub)
      }
    }
    return htmlFallback || { text: '', htmlSource: false }
  }

  const decoded = decodeBody(part.body, encoding)
  if (ctype.startsWith('text/html')) return { text: htmlToText(decoded), htmlSource: true }
  return { text: decoded, htmlSource: false }
}

/** Split a multipart body on its boundary into sub-parts. */
function splitMultipart(body: string, boundary: string): Part[] {
  const norm = body.replace(/\r\n/g, '\n')
  const delim = '--' + boundary
  const chunks = norm.split(delim)
  const parts: Part[] = []
  for (const chunk of chunks) {
    const trimmed = chunk.replace(/^\n/, '')
    if (!trimmed || trimmed.startsWith('--')) continue // preamble or closing
    const { head, body: pb } = splitHeadersBody(trimmed)
    parts.push({ headers: parseHeaders(head), body: pb })
  }
  return parts
}

function parseEml(raw: string): ParsedEmail {
  const { head, body } = splitHeadersBody(raw)
  const headers = parseHeaders(head)
  const picked = pickBody({ headers, body })
  return {
    from: headers.from ? decodeHeaderWords(headers.from) : undefined,
    to: headers.to ? decodeHeaderWords(headers.to) : undefined,
    cc: headers.cc ? decodeHeaderWords(headers.cc) : undefined,
    subject: headers.subject ? decodeHeaderWords(headers.subject) : undefined,
    date: headers.date,
    body: picked.text.trim(),
    htmlSource: picked.htmlSource,
  }
}

function frenchDate(value?: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Clean reading view for a parsed .eml message. */
export default function EmailView({ url, doc }: { url: string; doc: DocMeta }) {
  const [email, setEmail] = useState<ParsedEmail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setEmail(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const text = await res.text()
        if (active) setEmail(parseEml(text))
      } catch {
        if (active) setError(true)
      }
    })()
    return () => {
      active = false
    }
  }, [url])

  if (error) {
    return (
      <Centered>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/70">
          <AlertCircle className="h-4 w-4 text-mg-red-light" />
          Impossible de lire « {doc.title} ».
        </div>
      </Centered>
    )
  }

  if (!email) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </Centered>
    )
  }

  const date = frenchDate(email.date)

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="no-scrollbar mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="border-b border-mg-line bg-mg-wash px-6 py-5">
        <div className="mb-3 flex items-center gap-2 text-mg-red">
          <Mail className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">E-mail</span>
        </div>
        <h2 className="text-xl font-bold leading-snug text-mg-ink">
          {email.subject || '(Sans objet)'}
        </h2>
        <div className="mt-3 space-y-1.5 text-sm">
          {email.from && (
            <Meta icon={<User className="h-3.5 w-3.5" />} label="De">
              {email.from}
            </Meta>
          )}
          {email.to && (
            <Meta icon={<Users className="h-3.5 w-3.5" />} label="À">
              {email.to}
            </Meta>
          )}
          {email.cc && (
            <Meta icon={<Users className="h-3.5 w-3.5" />} label="Cc">
              {email.cc}
            </Meta>
          )}
          {date && (
            <Meta icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date">
              {date}
            </Meta>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-auto px-6 py-5">
        {email.body ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-mg-ink-soft">
            {email.body}
          </pre>
        ) : (
          <p className="text-sm italic text-mg-mute">Aucun contenu textuel à afficher.</p>
        )}
      </div>
    </motion.div>
  )
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2">
      <span className="flex shrink-0 items-center gap-1.5 font-semibold text-mg-mute">
        {icon}
        {label}
      </span>
      <span className="min-w-0 break-words text-mg-ink-soft">{children}</span>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>
}
