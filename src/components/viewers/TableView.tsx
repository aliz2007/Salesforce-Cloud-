import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import type { DocMeta } from '../../types'
import { fade } from '../../motion'

const MAX_ROWS = 500

/**
 * Parse delimited text (CSV / TSV) into rows of cells. Handles quoted fields,
 * escaped quotes (`""`), embedded delimiters/newlines and CRLF line endings.
 */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  // Normalise lone CRs so the state machine only sees \n.
  const src = text.replace(/\r\n?/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  // Flush the trailing field/row (unless the file ended on a clean newline).
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

/** Inline spreadsheet preview for CSV/TSV files on a white card. */
export default function TableView({
  url,
  kind,
  doc,
}: {
  url: string
  kind: 'csv' | 'tsv'
  doc: DocMeta
}) {
  const [rows, setRows] = useState<string[][] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setRows(null)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const text = await res.text()
        if (!active) return
        setRows(parseDelimited(text, kind === 'tsv' ? '\t' : ','))
      } catch {
        if (active) setError(true)
      }
    })()
    return () => {
      active = false
    }
  }, [url, kind])

  if (error) {
    return (
      <Wrap>
        <div className="flex items-center gap-2 p-6 text-sm text-mg-ink-soft">
          <AlertCircle className="h-4 w-4 text-mg-red" />
          Impossible de lire ce fichier ({doc.fileName || 'tableau'}).
        </div>
      </Wrap>
    )
  }

  if (!rows) {
    return (
      <Wrap>
        <div className="flex h-full items-center justify-center p-10">
          <Loader2 className="h-7 w-7 animate-spin text-mg-mute" />
        </div>
      </Wrap>
    )
  }

  if (rows.length === 0) {
    return (
      <Wrap>
        <div className="p-6 text-sm text-mg-ink-soft">Fichier vide.</div>
      </Wrap>
    )
  }

  const header = rows[0]
  const bodyAll = rows.slice(1)
  const truncated = bodyAll.length > MAX_ROWS
  const body = truncated ? bodyAll.slice(0, MAX_ROWS) : bodyAll
  const cols = header.length

  return (
    <Wrap>
      <div className="flex h-full flex-col">
        <div className="no-scrollbar flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr>
                {header.map((cell, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap border-b border-mg-line bg-mg-wash px-3.5 py-2.5 font-semibold text-mg-ink"
                  >
                    {cell || ' '}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-mg-wash/40' : 'bg-white'}>
                  {Array.from({ length: cols }).map((_, ci) => (
                    <td
                      key={ci}
                      className="whitespace-nowrap border-b border-mg-line/60 px-3.5 py-2 text-mg-ink-soft"
                    >
                      {r[ci] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-mg-line px-3.5 py-2 text-[11px] text-mg-mute">
          <span>
            {header.length} colonnes · {bodyAll.length} lignes
          </span>
          {truncated && <span>Aperçu limité aux {MAX_ROWS} premières lignes.</span>}
        </div>
      </div>
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="show"
      className="mx-auto h-full w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl"
    >
      {children}
    </motion.div>
  )
}
