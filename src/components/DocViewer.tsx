import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Music,
  Film,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
} from 'lucide-react'
import type { DocMeta } from '../types'
import { useDocUrl } from '../hooks'
import { CATEGORY_MAP } from '../data/categories'
import { humanSize } from '../storage/media'

/* ───────────────────────── type resolution ───────────────────────── */

type ViewerType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'office' | 'archive' | 'link' | 'unknown'

const EXT: Record<Exclude<ViewerType, 'link' | 'unknown'>, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'svg', 'bmp', 'ico', 'apng', 'jfif'],
  video: ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv', 'avi', 'wmv'],
  audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba'],
  pdf: ['pdf'],
  text: [
    'txt', 'text', 'md', 'markdown', 'csv', 'tsv', 'json', 'json5', 'js', 'mjs', 'cjs', 'jsx',
    'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'yml', 'yaml', 'toml',
    'ini', 'conf', 'cfg', 'log', 'sh', 'bash', 'zsh', 'py', 'rb', 'go', 'rs', 'java', 'kt',
    'c', 'h', 'cpp', 'hpp', 'cc', 'cs', 'php', 'sql', 'env', 'vue', 'svelte',
  ],
  office: [
    'doc', 'docx', 'dot', 'dotx', 'xls', 'xlsx', 'xlsm', 'xlsb', 'ppt', 'pptx', 'pps', 'ppsx',
    'odt', 'ods', 'odp', 'rtf', 'pages', 'numbers', 'key',
  ],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
}

const MS_OFFICE = new Set([
  'doc', 'docx', 'dot', 'dotx', 'xls', 'xlsx', 'xlsm', 'xlsb', 'ppt', 'pptx', 'pps', 'ppsx',
])

function extOf(name?: string): string {
  if (!name) return ''
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

function resolveViewer(doc: DocMeta): { type: ViewerType; ext: string } {
  if (doc.kind === 'link') return { type: 'link', ext: '' }
  const ext = extOf(doc.fileName) || extOf(doc.remoteUrl)
  const mime = (doc.mimeType || '').toLowerCase()

  if (mime.startsWith('image/') || EXT.image.includes(ext)) return { type: 'image', ext }
  if (mime.startsWith('video/') || EXT.video.includes(ext)) return { type: 'video', ext }
  if (mime.startsWith('audio/') || EXT.audio.includes(ext)) return { type: 'audio', ext }
  if (mime === 'application/pdf' || ext === 'pdf') return { type: 'pdf', ext }
  if (EXT.office.includes(ext) || /word|excel|powerpoint|spreadsheet|presentation|officedocument/.test(mime))
    return { type: 'office', ext }
  if (EXT.archive.includes(ext) || /zip|compressed|tar/.test(mime)) return { type: 'archive', ext }
  if (
    mime.startsWith('text/') ||
    /json|xml|javascript|x-sh|yaml/.test(mime) ||
    EXT.text.includes(ext)
  )
    return { type: 'text', ext }

  // Fall back to the coarse kind recorded at import time, else unknown.
  if (doc.kind === 'image' || doc.kind === 'video' || doc.kind === 'pdf')
    return { type: doc.kind, ext }
  return { type: 'unknown', ext }
}

/** Convert common video share URLs to embeddable URLs. */
function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/* ───────────────────────────── viewer ───────────────────────────── */

/**
 * Renders virtually any document by detected type. Used full-bleed in Sales
 * Mode and inside the preview lightbox (both sit on a dark backdrop). Anything
 * the browser can't render inline degrades to a polished open/download card so
 * a presentation never hits a dead end.
 */
export default function DocViewer({ doc }: { doc: DocMeta }) {
  const url = useDocUrl(doc)
  const [mediaError, setMediaError] = useState(false)
  const { type, ext } = resolveViewer(doc)

  // Seed/demo content: we only have a generated poster — show it as artwork.
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

  if (type === 'link') {
    const embed = doc.remoteUrl ? toEmbed(doc.remoteUrl) : null
    if (embed) return <FrameView src={embed} title={doc.title} />
    return (
      <Centered>
        <FileCard doc={doc} url={doc.remoteUrl} type="link" ext="" />
      </Centered>
    )
  }

  if (!url) return <Centered>{<Loader2 className="h-8 w-8 animate-spin text-white/50" />}</Centered>

  const isBlob = url.startsWith('blob:') || url.startsWith('data:')

  if (type === 'image' && !mediaError) {
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
  }

  if (type === 'video' && !mediaError) {
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

  if (type === 'audio' && !mediaError) {
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
  }

  if (type === 'pdf' && !mediaError) {
    const src = isBlob
      ? `${url}#toolbar=0&navpanes=0`
      : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    return <FrameView src={src} title={doc.title} white />
  }

  if (type === 'text' && !mediaError) {
    return <TextView url={url} doc={doc} onFail={() => setMediaError(true)} />
  }

  // Office documents: embed an online viewer when the file is publicly hosted;
  // local blobs can't be streamed to those services, so they get the card.
  if (type === 'office' && !mediaError && doc.remoteUrl && !isBlob) {
    const src = MS_OFFICE.has(ext)
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.remoteUrl)}`
      : `https://docs.google.com/viewer?url=${encodeURIComponent(doc.remoteUrl)}&embedded=true`
    return <FrameView src={src} title={doc.title} white />
  }

  // Everything else (Office local, archives, unknown binaries, media the codec
  // won't decode) → a clean, on-brand open/download card. Never a dead end.
  return (
    <Centered>
      <FileCard doc={doc} url={url} type={type} ext={ext} />
    </Centered>
  )
}

/* ───────────────────────────── pieces ───────────────────────────── */

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

function TextView({
  url,
  doc,
  onFail,
}: {
  url: string
  doc: DocMeta
  onFail: () => void
}) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if ((doc.size ?? 0) > 3_000_000) throw new Error('too large')
        const res = await fetch(url)
        const body = await res.text()
        if (active) {
          setText(body)
          setLoading(false)
        }
      } catch {
        if (active) {
          setLoading(false)
          onFail()
        }
      }
    })()
    return () => {
      active = false
    }
  }, [url, doc.size, onFail])

  if (loading) return <Centered>{<Loader2 className="h-8 w-8 animate-spin text-white/50" />}</Centered>
  if (text == null) return null

  return (
    <div className="mx-auto h-full w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-[13px] leading-relaxed text-mg-ink">
        {text}
      </pre>
    </div>
  )
}

const ICONS: Partial<Record<ViewerType, typeof FileIcon>> = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  pdf: FileText,
  text: FileText,
  archive: FileArchive,
  link: ExternalLink,
}

function officeIcon(ext: string) {
  if (/^(xls|ods|numbers|csv)/.test(ext) || ext.startsWith('xls')) return FileSpreadsheet
  if (/^(ppt|odp|key|pps)/.test(ext)) return Presentation
  return FileText
}

function FileCard({
  doc,
  url,
  type,
  ext,
}: {
  doc: DocMeta
  url?: string
  type: ViewerType
  ext: string
}) {
  const cat = CATEGORY_MAP[doc.category]
  const Icon = type === 'office' ? officeIcon(ext) : ICONS[type] ?? FileIcon
  const label =
    type === 'link'
      ? 'Lien externe'
      : ext
        ? `Fichier .${ext.toUpperCase()}`
        : 'Document'

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-glow"
        style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
      >
        <Icon className="h-9 w-9 text-white" />
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold leading-snug text-white">{doc.title}</p>
      {doc.model && <p className="mt-0.5 text-sm text-mg-red-light">{doc.model}</p>}

      <p className="mt-3 text-xs text-white/45">
        {[cat.label, doc.size ? humanSize(doc.size) : null].filter(Boolean).join(' · ')}
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="btn-primary">
            <ExternalLink className="h-4 w-4" />
            {type === 'link' ? 'Ouvrir le lien' : 'Ouvrir'}
          </a>
        )}
        {url && type !== 'link' && (
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

      {type === 'office' && (
        <p className="mt-4 text-[11px] leading-relaxed text-white/40">
          L'aperçu intégré des documents Office sera disponible une fois les fichiers hébergés
          (Google Drive). En local, ouvrez ou téléchargez le fichier.
        </p>
      )}
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
