import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Eye, Code2 } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fade } from '../../motion'

type Mode = 'preview' | 'source'

/**
 * HTML preview. Renders the markup in a script-free sandboxed iframe (via
 * srcDoc) and offers a toggle to inspect the raw source. Scripts are disabled
 * so untrusted documents can't run code in our origin.
 */
export default function HtmlView({ url, doc }: { url: string; doc: DocMeta }) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [mode, setMode] = useState<Mode>('preview')

  useEffect(() => {
    let active = true
    setHtml(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const body = await res.text()
        if (active) setHtml(body)
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
      className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-mg-line bg-mg-wash px-4 py-2.5">
        <span className="truncate text-xs font-medium text-mg-ink-soft">{doc.title}</span>
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-mg-line">
          <button
            type="button"
            onClick={() => setMode('preview')}
            aria-pressed={mode === 'preview'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === 'preview' ? 'bg-mg-grad text-white' : 'bg-white text-mg-ink-soft hover:bg-mg-wash'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Aperçu
          </button>
          <button
            type="button"
            onClick={() => setMode('source')}
            aria-pressed={mode === 'source'}
            className={`flex items-center gap-1.5 border-l border-mg-line px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === 'source' ? 'bg-mg-grad text-white' : 'bg-white text-mg-ink-soft hover:bg-mg-wash'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Source
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        {error ? (
          <div className="flex items-center gap-2 p-8 text-sm text-mg-ink-soft">
            <AlertCircle className="h-4 w-4 text-mg-red" />
            Impossible de charger ce document HTML.
          </div>
        ) : html == null ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-mg-mute" />
          </div>
        ) : mode === 'preview' ? (
          <iframe
            title={doc.title}
            srcDoc={html}
            sandbox="allow-popups allow-forms"
            className="h-full w-full bg-white"
          />
        ) : (
          <pre className="no-scrollbar h-full overflow-auto bg-[#0d1117] p-5 font-mono text-[12.5px] leading-relaxed text-[#c9d1d9]">
            <code>{html}</code>
          </pre>
        )}
      </div>
    </motion.div>
  )
}
