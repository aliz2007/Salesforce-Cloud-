import type { Article, Level } from '../types'

interface RawPage {
  title: string
  extract?: string
  fullurl?: string
  canonicalurl?: string
  thumbnail?: { source: string }
  pageid: number
}

/** Preferred extract length (characters) per level. */
const BANDS: Record<Level, [number, number]> = {
  beginner: [180, 750],
  intermediate: [500, 1700],
  advanced: [1200, 100000],
}

const MIN_USABLE = 140

function fits(len: number, level: Level): boolean {
  const [lo, hi] = BANDS[level]
  return len >= lo && len <= hi
}

/**
 * Pull a batch of random main-namespace articles from the target-language
 * Wikipedia and return the one that best fits the requested level.
 * Uses the public Action API with `origin=*` (anonymous CORS).
 */
export async function fetchRandomArticle(lang: string, level: Level): Promise<Article> {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: '12',
    prop: 'extracts|pageimages|info',
    explaintext: '1',
    exintro: '1',
    inprop: 'url',
    piprop: 'thumbnail',
    pithumbsize: '480',
  })

  const res = await fetch(`${endpoint}?${params.toString()}`)
  if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`)
  const data = await res.json()
  const pages: RawPage[] = Object.values(data?.query?.pages ?? {})

  const candidates = pages
    .map((p) => ({
      page: p,
      extract: (p.extract ?? '').trim(),
    }))
    .filter((c) => c.extract.length >= MIN_USABLE && !/may refer to:?$/i.test(c.extract))

  if (candidates.length === 0) {
    throw new Error('No suitable article found — try again.')
  }

  // Prefer one that fits the level band; otherwise the closest by length.
  const inBand = candidates.find((c) => fits(c.extract.length, level))
  const [lo, hi] = BANDS[level]
  const target = (lo + Math.min(hi, 2500)) / 2
  const chosen =
    inBand ??
    candidates.sort(
      (a, b) => Math.abs(a.extract.length - target) - Math.abs(b.extract.length - target),
    )[0]

  const p = chosen.page
  return {
    title: p.title,
    extract: trimToParagraphs(chosen.extract, level),
    url: p.canonicalurl ?? p.fullurl ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    thumbnail: p.thumbnail?.source,
    lang,
  }
}

/** Keep beginner extracts short so they're not overwhelming. */
function trimToParagraphs(text: string, level: Level): string {
  const cap = level === 'beginner' ? 700 : level === 'intermediate' ? 1600 : 3200
  if (text.length <= cap) return text
  // Cut at the last sentence boundary before the cap.
  const slice = text.slice(0, cap)
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('。'), slice.lastIndexOf('! '), slice.lastIndexOf('? '))
  return (lastStop > cap * 0.5 ? slice.slice(0, lastStop + 1) : slice).trim() + ' …'
}
