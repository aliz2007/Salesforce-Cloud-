import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fade } from '../../motion'

/**
 * Tiny, dependency-free Markdown renderer.
 *
 * Supports the subset the sales team actually uses: ATX headings, bold,
 * italic, inline code, fenced code blocks, bullet and ordered lists,
 * blockquotes, links, horizontal rules and paragraphs. All text is escaped
 * through React's own rendering — no dangerouslySetInnerHTML.
 */

/** Render inline spans (bold / italic / code / links) for one text run. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // Order matters: code first (so its contents aren't re-parsed), then links,
  // then bold, then italic.
  const pattern =
    /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g
  let last = 0
  let m: RegExpExecArray | null
  let n = 0
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${n++}`
    if (tok.startsWith('`')) {
      out.push(
        <code
          key={key}
          className="rounded bg-mg-wash px-1.5 py-0.5 font-mono text-[0.85em] text-mg-red-dark"
        >
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('[')) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
      if (lm) {
        out.push(
          <a
            key={key}
            href={lm[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-mg-red underline decoration-mg-red/40 underline-offset-2 hover:decoration-mg-red"
          >
            {lm[1]}
          </a>,
        )
      } else {
        out.push(tok)
      }
    } else if (tok.startsWith('**')) {
      out.push(
        <strong key={key} className="font-semibold text-mg-ink">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(
        <em key={key} className="italic">
          {tok.slice(1, -1)}
        </em>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const HEADING_CLASS = [
  'mt-6 text-3xl font-extrabold tracking-tight text-mg-ink',
  'mt-6 text-2xl font-bold tracking-tight text-mg-ink',
  'mt-5 text-xl font-bold text-mg-ink',
  'mt-4 text-lg font-semibold text-mg-ink',
  'mt-4 text-base font-semibold text-mg-ink',
  'mt-4 text-sm font-semibold uppercase tracking-wide text-mg-ink-soft',
]

/** Block-level parse → React elements. */
function renderMarkdown(src: string): ReactNode[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block.
    const fence = line.match(/^```(.*)$/)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // closing fence
      blocks.push(
        <pre
          key={key++}
          className="my-4 overflow-auto rounded-lg border border-mg-line bg-[#0d1117] p-4 font-mono text-[12.5px] leading-relaxed text-[#c9d1d9]"
        >
          <code>{buf.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // Horizontal rule.
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-6 border-mg-line" />)
      i++
      continue
    }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const Tag = (`h${level}`) as 'h1'
      blocks.push(
        <Tag key={key++} className={HEADING_CLASS[level - 1]}>
          {renderInline(h[2], `h${key}`)}
        </Tag>,
      )
      i++
      continue
    }

    // Blockquote (consecutive > lines).
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-4 border-l-4 border-mg-red/60 bg-mg-red-wash/50 py-2 pl-4 pr-3 text-mg-ink-soft"
        >
          {renderInline(buf.join(' '), `q${key}`)}
        </blockquote>,
      )
      continue
    }

    // Lists (unordered or ordered).
    const isUl = /^\s*[-*+]\s+/.test(line)
    const isOl = /^\s*\d+\.\s+/.test(line)
    if (isUl || isOl) {
      const items: ReactNode[] = []
      const re = isUl ? /^\s*[-*+]\s+/ : /^\s*\d+\.\s+/
      while (
        i < lines.length &&
        (isUl ? /^\s*[-*+]\s+/ : /^\s*\d+\.\s+/).test(lines[i])
      ) {
        items.push(
          <li key={items.length} className="ml-1 leading-relaxed">
            {renderInline(lines[i].replace(re, ''), `li${key}-${items.length}`)}
          </li>,
        )
        i++
      }
      blocks.push(
        isOl ? (
          <ol key={key++} className="my-3 list-decimal space-y-1 pl-6 text-mg-ink-soft marker:text-mg-mute">
            {items}
          </ol>
        ) : (
          <ul key={key++} className="my-3 list-disc space-y-1 pl-6 text-mg-ink-soft marker:text-mg-red">
            {items}
          </ul>
        ),
      )
      continue
    }

    // Blank line.
    if (/^\s*$/.test(line)) {
      i++
      continue
    }

    // Paragraph: gather until blank line / next block starter.
    const buf: string[] = []
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-3 leading-relaxed text-mg-ink-soft">
        {renderInline(buf.join('\n'), `p${key}`)}
      </p>,
    )
  }

  return blocks
}

/** Inline Markdown preview on a white prose card. */
export default function MarkdownView({ url, doc }: { url: string; doc: DocMeta }) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setText(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const body = await res.text()
        if (active) setText(body)
      } catch {
        if (active) setError(true)
      }
    })()
    return () => {
      active = false
    }
  }, [url])

  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="show"
      className="no-scrollbar mx-auto h-full w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl"
    >
      {error ? (
        <div className="flex items-center gap-2 p-8 text-sm text-mg-ink-soft">
          <AlertCircle className="h-4 w-4 text-mg-red" />
          Impossible de charger « {doc.title} ».
        </div>
      ) : text == null ? (
        <div className="flex h-full items-center justify-center p-10">
          <Loader2 className="h-7 w-7 animate-spin text-mg-mute" />
        </div>
      ) : (
        <div className="px-8 py-7 text-[15px] text-mg-ink">{renderMarkdown(text)}</div>
      )}
    </motion.div>
  )
}
