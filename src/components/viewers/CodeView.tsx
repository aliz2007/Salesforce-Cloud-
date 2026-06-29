import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fade } from '../../motion'

const MAX_BYTES = 3_000_000

/**
 * Source / plain-text viewer with line numbers on a dark editor surface.
 * Pretty-prints JSON when {@link json} is set (falls back to raw on bad JSON).
 */
export default function CodeView({
  url,
  doc,
  json,
}: {
  url: string
  doc: DocMeta
  json?: boolean
}) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tooLarge, setTooLarge] = useState(false)

  useEffect(() => {
    let active = true
    setText(null)
    setError(null)
    setTooLarge(false)

    if ((doc.size ?? 0) > MAX_BYTES) {
      setTooLarge(true)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        let body = await res.text()
        if (json) {
          try {
            body = JSON.stringify(JSON.parse(body), null, 2)
          } catch {
            /* keep raw text — still useful to read */
          }
        }
        if (active) setText(body)
      } catch {
        if (active) setError('Impossible de charger le contenu du fichier.')
      }
    })()
    return () => {
      active = false
    }
  }, [url, doc.size, json])

  if (tooLarge) {
    return (
      <Surface>
        <div className="flex items-center gap-2 p-6 text-sm text-white/70">
          <AlertCircle className="h-4 w-4 text-mg-red-light" />
          Fichier trop volumineux pour l’aperçu intégré. Téléchargez-le pour le consulter.
        </div>
      </Surface>
    )
  }

  if (error) {
    return (
      <Surface>
        <div className="flex items-center gap-2 p-6 text-sm text-white/70">
          <AlertCircle className="h-4 w-4 text-mg-red-light" />
          {error}
        </div>
      </Surface>
    )
  }

  if (text == null) {
    return (
      <Surface>
        <div className="flex h-full items-center justify-center p-10">
          <Loader2 className="h-7 w-7 animate-spin text-white/40" />
        </div>
      </Surface>
    )
  }

  const lines = text.replace(/\n$/, '').split('\n')
  const gutter = String(lines.length).length

  return (
    <Surface>
      <div className="no-scrollbar h-full overflow-auto">
        <pre className="min-w-full p-0 font-mono text-[12.5px] leading-[1.6]">
          <code className="block">
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span
                  className="sticky left-0 select-none border-r border-white/5 bg-[#0d1117] px-3 text-right text-white/25"
                  style={{ minWidth: `${gutter + 2}ch` }}
                >
                  {i + 1}
                </span>
                <span className="whitespace-pre px-4 text-[#c9d1d9]">{line || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </Surface>
  )
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="show"
      className="no-scrollbar mx-auto h-full w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl"
    >
      {children}
    </motion.div>
  )
}
