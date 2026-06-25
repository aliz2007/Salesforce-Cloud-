import type { CategoryId, DocKind } from '../types'
import { CATEGORY_MAP } from '../data/categories'

/**
 * Generates a premium, fully-offline SVG poster (as a data URL) for a document.
 * Used for seed/demo content and as a graceful fallback when a real file has
 * no thumbnail (e.g. PDFs). No network, no external assets.
 */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const KIND_LABEL: Record<DocKind, string> = {
  pdf: 'PDF',
  image: 'PHOTO',
  video: 'VIDÉO',
  link: 'LIEN',
  other: 'DOCUMENT',
}

export function makePoster(opts: {
  category: CategoryId
  title: string
  model?: string
  kind: DocKind
  seed?: number
}): string {
  const cat = CATEGORY_MAP[opts.category]
  const { from, to } = cat
  const seed = opts.seed ?? hash(opts.title)
  const angle = 90 + (seed % 60)
  const playGlyph =
    opts.kind === 'video'
      ? `<g transform="translate(400,225)">
           <circle r="46" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
           <path d="M-14,-22 L26,0 L-14,22 Z" fill="#fff"/>
         </g>`
      : ''

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.35" r="0.9">
      <stop offset="0" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0.45)"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.10)"/>
    </pattern>
  </defs>
  <rect width="800" height="450" fill="${to}"/>
  <rect width="800" height="450" fill="url(#g)"/>
  <rect width="800" height="450" fill="url(#dots)"/>
  <rect width="800" height="450" fill="url(#v)"/>
  <g opacity="0.16">
    <path d="M620 40 L760 120 L760 280 L620 360 L480 280 L480 120 Z" fill="none" stroke="#fff" stroke-width="3"/>
    <text x="620" y="220" font-family="Inter, Arial" font-size="86" font-weight="800" fill="#fff" text-anchor="middle">MG</text>
  </g>
  <text x="48" y="80" font-family="Inter, Arial" font-size="15" letter-spacing="3" font-weight="700" fill="rgba(255,255,255,0.85)">${esc(
    cat.label.toUpperCase(),
  )}</text>
  <rect x="48" y="96" width="64" height="4" rx="2" fill="rgba(255,255,255,0.85)"/>
  ${
    opts.model
      ? `<text x="48" y="300" font-family="Inter, Arial" font-size="52" font-weight="800" fill="#fff">${esc(
          opts.model,
        )}</text>`
      : ''
  }
  <text x="48" y="${opts.model ? 340 : 300}" font-family="Inter, Arial" font-size="${
    opts.model ? 22 : 38
  }" font-weight="${opts.model ? 500 : 800}" fill="rgba(255,255,255,0.92)">${esc(
    truncate(opts.title, 38),
  )}</text>
  <g transform="translate(48,386)">
    <rect width="${KIND_LABEL[opts.kind].length * 11 + 24}" height="28" rx="14" fill="rgba(0,0,0,0.28)"/>
    <text x="14" y="19" font-family="Inter, Arial" font-size="13" font-weight="700" letter-spacing="1.5" fill="#fff">${
      KIND_LABEL[opts.kind]
    }</text>
  </g>
  ${playGlyph}
</svg>`.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
