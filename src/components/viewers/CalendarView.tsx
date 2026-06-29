import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, MapPin, User, Clock } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fadeUp, staggerContainer } from '../../motion'

interface VEvent {
  summary: string
  start?: Date
  end?: Date
  allDay: boolean
  location?: string
  description?: string
  organizer?: string
}

const MONTHS_ABBR = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC']

/** Unfold folded lines (continuations begin with space/tab). */
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

function decode(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

/** Parse iCalendar date forms: 20260629, 20260629T143000, …Z (UTC). */
function parseICalDate(value: string, valueIsDate: boolean): Date | undefined {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/)
  if (!m) return undefined
  const [, y, mo, d, hh, mm, ss, z] = m
  const year = Number(y)
  const month = Number(mo) - 1
  const day = Number(d)
  if (valueIsDate || hh === undefined) return new Date(year, month, day)
  if (z) {
    return new Date(Date.UTC(year, month, day, Number(hh), Number(mm), Number(ss)))
  }
  return new Date(year, month, day, Number(hh), Number(mm), Number(ss))
}

function parseEvents(text: string): VEvent[] {
  const lines = unfold(text)
  const events: VEvent[] = []
  let cur: VEvent | null = null

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper.startsWith('BEGIN:VEVENT')) {
      cur = { summary: 'Événement', allDay: false }
      continue
    }
    if (upper.startsWith('END:VEVENT')) {
      if (cur) events.push(cur)
      cur = null
      continue
    }
    if (!cur) continue

    const colon = line.indexOf(':')
    if (colon === -1) continue
    const left = line.slice(0, colon)
    const value = line.slice(colon + 1).trim()
    const [name, ...params] = left.split(';')
    const prop = name.toUpperCase()
    const isDateValue = params.some((p) => /^VALUE=DATE$/i.test(p))

    switch (prop) {
      case 'SUMMARY':
        cur.summary = decode(value) || cur.summary
        break
      case 'DTSTART':
        cur.start = parseICalDate(value, isDateValue)
        if (isDateValue) cur.allDay = true
        break
      case 'DTEND':
        cur.end = parseICalDate(value, isDateValue)
        break
      case 'LOCATION':
        cur.location = decode(value)
        break
      case 'DESCRIPTION':
        cur.description = decode(value)
        break
      case 'ORGANIZER': {
        const cn = left.match(/CN=([^;:]+)/i)
        cur.organizer = cn ? cn[1] : value.replace(/^mailto:/i, '')
        break
      }
      default:
        break
    }
  }
  return events
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function formatRange(ev: VEvent): string {
  if (!ev.start) return ''
  if (ev.allDay) {
    if (ev.end) {
      // All-day DTEND is exclusive; step back a day for display.
      const last = new Date(ev.end.getTime() - 86_400_000)
      if (last.toDateString() !== ev.start.toDateString()) {
        return `${dateFmt.format(ev.start)} → ${dateFmt.format(last)}`
      }
    }
    return `${dateFmt.format(ev.start)} · Toute la journée`
  }
  const day = dateFmt.format(ev.start)
  const startT = timeFmt.format(ev.start)
  if (ev.end) {
    const sameDay = ev.end.toDateString() === ev.start.toDateString()
    return sameDay
      ? `${day} · ${startT} – ${timeFmt.format(ev.end)}`
      : `${day} ${startT} → ${dateFmt.format(ev.end)} ${timeFmt.format(ev.end)}`
  }
  return `${day} · ${startT}`
}

/** iCalendar (.ics) event preview — one card per VEVENT. */
export default function CalendarView({ url, doc }: { url: string; doc: DocMeta }) {
  const [events, setEvents] = useState<VEvent[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setEvents(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const text = await res.text()
        if (!active) return
        const parsed = parseEvents(text)
        if (parsed.length === 0) throw new Error('no event')
        setEvents(parsed)
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

  if (!events) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </Centered>
    )
  }

  return (
    <div className="no-scrollbar mx-auto h-full w-full max-w-2xl overflow-auto py-6">
      <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" className="space-y-4">
        {events.map((ev, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white p-4 shadow-2xl"
          >
            <DateBlock date={ev.start} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-snug text-mg-ink">{ev.summary}</p>
              {ev.start && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-mg-ink-soft">
                  <Clock className="h-3.5 w-3.5 text-mg-mute" />
                  {formatRange(ev)}
                </p>
              )}
              {ev.location && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-mg-ink-soft">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mg-mute" />
                  {ev.location}
                </p>
              )}
              {ev.organizer && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-mg-ink-soft">
                  <User className="h-3.5 w-3.5 text-mg-mute" />
                  {ev.organizer}
                </p>
              )}
              {ev.description && (
                <p className="mt-2 whitespace-pre-wrap border-t border-mg-line pt-2 text-xs leading-relaxed text-mg-ink-soft">
                  {ev.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function DateBlock({ date }: { date?: Date }) {
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-mg-grad text-white shadow-glow">
      {date ? (
        <>
          <span className="text-2xl font-extrabold leading-none">{date.getDate()}</span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">
            {MONTHS_ABBR[date.getMonth()]}
          </span>
        </>
      ) : (
        <span className="text-[10px] font-bold uppercase">—</span>
      )}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>
}
