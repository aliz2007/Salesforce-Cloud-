import { motion } from 'framer-motion'
import { ExternalLink, Download } from 'lucide-react'
import type { DocMeta } from '../../types'
import { CATEGORY_MAP } from '../../data/categories'
import { humanSize } from '../../storage/media'
import type { FileTypeInfo } from '../../data/fileTypes'
import { popIn } from '../../motion'

const OFFICE_GROUPS = new Set(['document', 'spreadsheet', 'presentation'])

/**
 * The universal, graceful fallback. Any file the browser can't render inline
 * (Office docs, archives, CAD, fonts, executables, unknown binaries…) lands
 * here as a polished, on-brand open/download card — never a dead end.
 */
export default function FileCard({
  doc,
  url,
  info,
}: {
  doc: DocMeta
  url?: string
  info: FileTypeInfo
}) {
  const cat = CATEGORY_MAP[doc.category]
  const Icon = info.icon
  const isLink = info.group === 'link'
  const showOfficeNote = OFFICE_GROUPS.has(info.group) && info.viewer === 'office'

  const meta = [
    cat?.label,
    doc.size ? humanSize(doc.size) : null,
    info.ext ? `.${info.ext.toUpperCase()}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="show"
      className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl"
    >
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-glow"
        style={{ background: `linear-gradient(135deg, ${info.accent}, ${info.accent})` }}
      >
        <Icon className="h-9 w-9 text-white" />
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {info.label}
      </p>
      <p className="mt-2 text-lg font-semibold leading-snug text-white">{doc.title}</p>
      {doc.model && <p className="mt-0.5 text-sm text-mg-red-light">{doc.model}</p>}

      {meta && <p className="mt-3 text-xs text-white/45">{meta}</p>}

      {(url || doc.remoteUrl) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={url || doc.remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {isLink ? 'Ouvrir le lien' : 'Ouvrir'}
          </a>
          {url && !isLink && (
            <a
              href={url}
              download={doc.fileName || doc.title}
              className="btn bg-white/10 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          )}
        </div>
      )}

      {showOfficeNote && (
        <p className="mt-4 text-[11px] leading-relaxed text-white/40">
          L’aperçu intégré des documents Office s’affiche une fois le fichier hébergé
          (Google Drive). En local, ouvrez ou téléchargez le fichier.
        </p>
      )}
    </motion.div>
  )
}
