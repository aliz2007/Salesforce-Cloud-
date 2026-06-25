import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, FileText, Play, Loader2 } from 'lucide-react'
import type { DocMeta } from '../types'
import { useDocUrl } from '../hooks'
import { CATEGORY_MAP } from '../data/categories'

/** Convert common video share URLs to embeddable URLs. */
function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/**
 * Renders any document by kind. Used full-bleed in Sales Mode and inside the
 * preview lightbox. `dark` controls the surrounding treatment.
 */
export default function DocViewer({ doc }: { doc: DocMeta }) {
  const url = useDocUrl(doc)
  const [imgError, setImgError] = useState(false)

  // Seed/demo content: we only have a poster — show it as the artwork.
  if (doc.source === 'seed') {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <img
          src={doc.posterUrl}
          alt={doc.title}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
          Aperçu de démonstration
        </span>
      </div>
    )
  }

  if (!url) return <Centered>{<Loader2 className="h-8 w-8 animate-spin text-mg-mute" />}</Centered>

  if (doc.kind === 'image') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={url}
          alt={doc.title}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          onError={() => setImgError(true)}
        />
        {imgError && <FallbackPoster doc={doc} />}
      </div>
    )
  }

  if (doc.kind === 'video') {
    const embed = doc.remoteUrl ? toEmbed(doc.remoteUrl) : null
    if (embed) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="aspect-video w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl">
            <iframe
              src={embed}
              title={doc.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )
    }
    return (
      <div className="flex h-full w-full items-center justify-center">
        <video
          src={url}
          controls
          playsInline
          className="max-h-full max-w-full rounded-xl shadow-2xl"
        />
      </div>
    )
  }

  if (doc.kind === 'pdf') {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        title={doc.title}
        className="h-full w-full rounded-xl bg-white shadow-2xl"
      />
    )
  }

  if (doc.kind === 'link') {
    return (
      <Centered>
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ExternalLink className="mx-auto h-10 w-10 text-mg-red" />
          <p className="mt-4 break-all text-sm text-white/70">{doc.remoteUrl}</p>
          <a
            href={doc.remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-5"
          >
            Ouvrir le lien <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Centered>
    )
  }

  return (
    <Centered>
      <div className="text-center text-mg-mute">
        <FileText className="mx-auto h-10 w-10" />
        <a href={url} download={doc.fileName} className="btn-ghost mt-4">
          Télécharger {doc.fileName}
        </a>
      </div>
    </Centered>
  )
}

function FallbackPoster({ doc }: { doc: DocMeta }) {
  const cat = CATEGORY_MAP[doc.category]
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl"
      style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
    >
      <Play className="h-12 w-12 text-white/80" />
      <p className="mt-3 px-6 text-center text-lg font-semibold text-white">{doc.title}</p>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full items-center justify-center"
    >
      {children}
    </motion.div>
  )
}
