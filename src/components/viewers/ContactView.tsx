import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  User,
} from 'lucide-react'
import type { DocMeta } from '../../types'
import { fadeUp, staggerContainer } from '../../motion'

interface Labelled {
  label?: string
  value: string
}

interface VCard {
  fn: string
  org?: string
  title?: string
  phones: Labelled[]
  emails: Labelled[]
  addresses: Labelled[]
  urls: string[]
  note?: string
}

/** Unfold lines: continuation lines start with a space or tab (RFC 6350). */
function unfold(text: string): string[] {
  const raw = text.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) {
      out[out.length - 1] += line.slice(1)
    } else {
      out.push(line)
    }
  }
  return out
}

/** Read the first TYPE= param off a vCard property's parameter list. */
function typeOf(params: string[]): string | undefined {
  for (const p of params) {
    const m = p.match(/^TYPE=(.+)$/i)
    if (m) return prettyType(m[1].split(',')[0])
    // Bare type tokens (vCard 2.1 style): TEL;CELL:...
    if (!p.includes('=')) return prettyType(p)
  }
  return undefined
}

function prettyType(raw: string): string {
  const k = raw.trim().toUpperCase()
  const map: Record<string, string> = {
    CELL: 'Mobile',
    MOBILE: 'Mobile',
    HOME: 'Domicile',
    WORK: 'Travail',
    FAX: 'Fax',
    VOICE: 'Téléphone',
    MAIN: 'Principal',
    PREF: 'Préféré',
  }
  return map[k] || raw.trim()
}

function decodeValue(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

function parseVCards(text: string): VCard[] {
  const lines = unfold(text)
  const cards: VCard[] = []
  let cur: VCard | null = null

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper.startsWith('BEGIN:VCARD')) {
      cur = { fn: '', phones: [], emails: [], addresses: [], urls: [] }
      continue
    }
    if (upper.startsWith('END:VCARD')) {
      if (cur) {
        if (!cur.fn) cur.fn = cur.org || cur.emails[0]?.value || 'Contact'
        cards.push(cur)
      }
      cur = null
      continue
    }
    if (!cur) continue

    const colon = line.indexOf(':')
    if (colon === -1) continue
    const left = line.slice(0, colon)
    const value = decodeValue(line.slice(colon + 1).trim())
    const [name, ...params] = left.split(';')
    const prop = name.toUpperCase()

    switch (prop) {
      case 'FN':
        cur.fn = value
        break
      case 'N':
        if (!cur.fn) {
          const [last = '', first = ''] = value.split(';')
          cur.fn = [first, last].filter(Boolean).join(' ').trim()
        }
        break
      case 'ORG':
        cur.org = value.split(';').filter(Boolean).join(' · ')
        break
      case 'TITLE':
        cur.title = value
        break
      case 'TEL':
        if (value) cur.phones.push({ label: typeOf(params), value })
        break
      case 'EMAIL':
        if (value) cur.emails.push({ label: typeOf(params), value })
        break
      case 'ADR': {
        // ADR is ;-delimited: pobox;ext;street;city;region;postal;country
        const parts = value.split(';').map((s) => s.trim()).filter(Boolean)
        if (parts.length) cur.addresses.push({ label: typeOf(params), value: parts.join(', ') })
        break
      }
      case 'URL':
        if (value) cur.urls.push(value)
        break
      case 'NOTE':
        cur.note = value
        break
      default:
        break
    }
  }
  return cards
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Polished contact card(s) parsed from a .vcf file. */
export default function ContactView({ url, doc }: { url: string; doc: DocMeta }) {
  const [cards, setCards] = useState<VCard[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setCards(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const text = await res.text()
        if (!active) return
        const parsed = parseVCards(text)
        if (parsed.length === 0) throw new Error('no vcard')
        setCards(parsed)
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

  if (!cards) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </Centered>
    )
  }

  return (
    <div className="no-scrollbar mx-auto h-full w-full max-w-lg overflow-auto py-6">
      <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" className="space-y-5">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-4 bg-mg-grad px-6 py-6 text-white">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur">
                {initials(c.fn)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold leading-tight">{c.fn}</p>
                {c.title && <p className="truncate text-sm text-white/85">{c.title}</p>}
                {c.org && (
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-white/75">
                    <Building2 className="h-3.5 w-3.5" />
                    {c.org}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1 px-5 py-4">
              {c.phones.map((p, j) => (
                <Row key={`tel-${j}`} icon={<Phone className="h-4 w-4" />} label={p.label}>
                  <a href={`tel:${p.value}`} className="text-mg-ink hover:text-mg-red">
                    {p.value}
                  </a>
                </Row>
              ))}
              {c.emails.map((e, j) => (
                <Row key={`mail-${j}`} icon={<Mail className="h-4 w-4" />} label={e.label}>
                  <a href={`mailto:${e.value}`} className="break-all text-mg-ink hover:text-mg-red">
                    {e.value}
                  </a>
                </Row>
              ))}
              {c.addresses.map((a, j) => (
                <Row key={`adr-${j}`} icon={<MapPin className="h-4 w-4" />} label={a.label}>
                  <span className="text-mg-ink-soft">{a.value}</span>
                </Row>
              ))}
              {c.urls.map((u, j) => (
                <Row key={`url-${j}`} icon={<Globe className="h-4 w-4" />}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-mg-red hover:underline"
                  >
                    {u}
                  </a>
                </Row>
              ))}
              {c.note && (
                <Row icon={<User className="h-4 w-4" />} label="Note">
                  <span className="whitespace-pre-wrap text-mg-ink-soft">{c.note}</span>
                </Row>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-mg-wash">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mg-red-wash text-mg-red">
        {icon}
      </span>
      <div className="min-w-0 text-sm">
        {label && <p className="text-[11px] font-semibold uppercase tracking-wide text-mg-mute">{label}</p>}
        <div className="leading-snug">{children}</div>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>
}
