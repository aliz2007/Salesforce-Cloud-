import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Music } from 'lucide-react'
import type { DocMeta } from '../types'
import { useDocUrl } from '../hooks'
import { resolveFileType } from '../data/fileTypes'
import FileCard from './viewers/FileCard'
import TableView from './viewers/TableView'
import CodeView from './viewers/CodeView'
import MarkdownView from './viewers/MarkdownView'
import HtmlView from './viewers/HtmlView'
import ContactView from './viewers/ContactView'
import CalendarView from './viewers/CalendarView'
import EmailView from './viewers/EmailView'

/** MS Office formats that the Office Online viewer can embed. */
const MS_OFFICE_EXT = new Set([
  'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm',
  'xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'xltm', 'xla', 'xlam',
  'ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'pps', 'ppsx', 'ppsm', 'ppa', 'ppam',
])

/** Convert common video share URLs (YouTube / Vimeo) to embeddable URLs. */
function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/**
 * Universal document viewer. Resolves a renderable URL, classifies the file via
 * {@link resolveFileType}, and dispatches to the right inline renderer. Every
 * unrenderable or errored case degrades to a polished {@link FileCard} — it
 * never throws and never goes blank.
 *
 * Rendered full-bleed on a dark backdrop by both Sales Mode and the Lightbox.
 */
export default function DocViewer({ doc }: { doc: DocMeta }) {
  const url = useDocUrl(doc)
  const [mediaError, setMediaError] = useState(false)
  const info = resolveFileType(doc)

  // Reset any media error when the document changes.
  useEffect(() => {
    setMediaError(false)
  }, [doc.id])

  // Seed/demo content: only a generated poster exists — show it as artwork.
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

  // External links: embed YouTube/Vimeo, otherwise a card.
  if (doc.kind === 'link') {
    const embed = doc.remoteUrl ? toEmbed(doc.remoteUrl) : null
    if (embed) return <FrameView src={embed} title={doc.title} aspect />
    return (
      <Centered>
        <FileCard doc={doc} url={doc.remoteUrl} info={info} />
      </Centered>
    )
  }

  // Still resolving the blob/object URL.
  if (!url) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </Centered>
    )
  }

  const isBlob = url.startsWith('blob:') || url.startsWith('data:')
  const fallback = (
    <Centered>
      <FileCard doc={doc} url={url} info={info} />
    </Centered>
  )

  // Any decoded media failure forces the graceful card.
  if (mediaError) return fallback

  switch (info.viewer) {
    case 'image':
      return (
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={url}
            alt={doc.title}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onError={() => setMediaError(true)}
          />
        </div>
      )

    case 'video': {
      const embed = doc.remoteUrl ? toEmbed(doc.remoteUrl) : null
      if (embed) return <FrameView src={embed} title={doc.title} aspect />
      return (
        <div className="flex h-full w-full items-center justify-center">
          <video
            src={url}
            controls
            autoPlay
            playsInline
            onError={() => setMediaError(true)}
            className="max-h-full max-w-full rounded-xl shadow-2xl"
          />
        </div>
      )
    }

    case 'audio':
      return (
        <Centered>
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-mg-grad shadow-glow">
              <Music className="h-9 w-9 text-white" />
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{doc.title}</p>
            {doc.model && <p className="text-sm text-mg-red-light">{doc.model}</p>}
            <audio
              src={url}
              controls
              autoPlay
              onError={() => setMediaError(true)}
              className="mt-6 w-full"
            />
          </div>
        </Centered>
      )

    case 'pdf': {
      const src = isBlob
        ? `${url}#toolbar=0&navpanes=0`
        : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      return <FrameView src={src} title={doc.title} white />
    }

    case 'text':
    case 'code':
      return <CodeView url={url} doc={doc} />

    case 'json':
      return <CodeView url={url} doc={doc} json />

    case 'csv':
      return <TableView url={url} kind={info.ext === 'tsv' ? 'tsv' : 'csv'} doc={doc} />

    case 'markdown':
      return <MarkdownView url={url} doc={doc} />

    case 'html':
      return <HtmlView url={url} doc={doc} />

    case 'vcard':
      return <ContactView url={url} doc={doc} />

    case 'ical':
      return <CalendarView url={url} doc={doc} />

    case 'email':
      return <EmailView url={url} doc={doc} />

    case 'office': {
      // Online viewers need a publicly reachable URL; local blobs can't stream.
      if (doc.remoteUrl && !isBlob) {
        const src = MS_OFFICE_EXT.has(info.ext)
          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.remoteUrl)}`
          : `https://docs.google.com/viewer?url=${encodeURIComponent(doc.remoteUrl)}&embedded=true`
        return <FrameView src={src} title={doc.title} white />
      }
      return fallback
    }

    case 'archive':
    case 'card':
    default:
      return fallback
  }
}

/* ───────────────────────────── helpers ───────────────────────────── */

function FrameView({
  src,
  title,
  white,
  aspect,
}: {
  src: string
  title: string
  white?: boolean
  aspect?: boolean
}) {
  if (aspect) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="aspect-video w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl">
          <iframe
            src={src}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }
  return (
    <iframe
      src={src}
      title={title}
      className={`h-full w-full rounded-xl shadow-2xl ${white ? 'bg-white' : ''}`}
      allowFullScreen
    />
  )
}

function Centered({ children }: { children: ReactNode }) {
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
