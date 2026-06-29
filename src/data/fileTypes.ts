/**
 * Exhaustive file-type registry for the universal preview.
 *
 * Every extension the sales team could conceivably drop in maps to a
 * {@link FileTypeInfo}: a French label, a coarse {@link FileGroup}, the
 * {@link ViewerKind} that knows how to render it, a real lucide icon and an
 * accent colour for its icon tile. Unknown extensions synthesise a graceful
 * fallback so the viewer never hits a raw error or a dead end.
 */
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileJson,
  Mail,
  Contact,
  Calendar,
  Database,
  Network,
  Binary,
  Terminal,
  Cog,
  BookOpen,
  Type,
  Box,
  PenTool,
  Image as ImageIcon,
  Film,
  Music,
  File as FileIcon,
  type LucideIcon,
} from 'lucide-react'
import type { DocMeta } from '../types'

/** Coarse semantic family a file belongs to. */
export type FileGroup =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'vector'
  | 'raster-pro'
  | 'video'
  | 'audio'
  | 'archive'
  | 'email'
  | 'contact'
  | 'calendar'
  | 'database'
  | 'web'
  | 'code'
  | 'data'
  | 'markup'
  | 'ebook'
  | 'font'
  | 'cad'
  | 'design'
  | 'executable'
  | 'system'
  | 'link'
  | 'other'

/** How a file should actually be rendered by the DocViewer. */
export type ViewerKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'code'
  | 'markdown'
  | 'html'
  | 'csv'
  | 'json'
  | 'vcard'
  | 'ical'
  | 'email'
  | 'office'
  | 'archive'
  | 'card'

export interface FileTypeInfo {
  /** Lowercase extension without the dot, '' for links / unknown. */
  ext: string
  /** French, human-friendly label (e.g. "Classeur Excel"). */
  label: string
  group: FileGroup
  viewer: ViewerKind
  icon: LucideIcon
  /** Hex colour used for the icon tile gradient. */
  accent: string
}

/* ─────────────────────────── accent palette ─────────────────────────── */

const ACCENT = {
  document: '#2563eb',
  spreadsheet: '#15803d',
  presentation: '#ea580c',
  pdf: '#dc2626',
  archive: '#b45309',
  email: '#7c3aed',
  contact: '#0d9488',
  calendar: '#4f46e5',
  database: '#475569',
  code: '#0ea5e9',
  design: '#db2777',
  cad: '#0891b2',
  system: '#52525b',
  font: '#9333ea',
  web: '#0ea5e9',
  data: '#0ea5e9',
  markup: '#0ea5e9',
  ebook: '#b45309',
  brand: '#E11D24',
  neutral: '#57534D',
} as const

/* ──────────────────────────── the registry ──────────────────────────── */

/**
 * Compact factory so the big table below stays readable. Defaults the icon and
 * accent off the group when omitted.
 */
function t(
  label: string,
  group: FileGroup,
  viewer: ViewerKind,
  icon: LucideIcon,
  accent: string,
): Omit<FileTypeInfo, 'ext'> {
  return { label, group, viewer, icon, accent }
}

type Entry = Omit<FileTypeInfo, 'ext'>

const wordDoc = (label: string): Entry => t(label, 'document', 'office', FileText, ACCENT.document)
const excel = (label: string): Entry =>
  t(label, 'spreadsheet', 'office', FileSpreadsheet, ACCENT.spreadsheet)
const ppt = (label: string): Entry =>
  t(label, 'presentation', 'office', Presentation, ACCENT.presentation)
const code = (label: string, group: FileGroup = 'code'): Entry =>
  t(label, group, 'code', FileCode, ACCENT[group as keyof typeof ACCENT] ?? ACCENT.code)
const codeText = (label: string, group: FileGroup = 'code'): Entry =>
  t(label, group, 'code', FileText, ACCENT[group as keyof typeof ACCENT] ?? ACCENT.code)
const imgView = (label: string, group: FileGroup = 'image'): Entry =>
  t(label, group, 'image', FileImage, ACCENT.brand)
const rasterPro = (label: string): Entry =>
  t(label, 'raster-pro', 'card', FileImage, ACCENT.brand)
const designCard = (label: string): Entry =>
  t(label, 'design', 'card', PenTool, ACCENT.design)
const videoView = (label: string): Entry => t(label, 'video', 'video', FileVideo, ACCENT.brand)
const audioView = (label: string): Entry => t(label, 'audio', 'audio', FileAudio, ACCENT.brand)
const archive = (label: string): Entry => t(label, 'archive', 'archive', FileArchive, ACCENT.archive)
const dbCard = (label: string): Entry => t(label, 'database', 'card', Database, ACCENT.database)
const ebook = (label: string): Entry => t(label, 'ebook', 'card', BookOpen, ACCENT.ebook)
const font = (label: string): Entry => t(label, 'font', 'card', Type, ACCENT.font)
const cad = (label: string): Entry => t(label, 'cad', 'card', Box, ACCENT.cad)
const exe = (label: string): Entry => t(label, 'executable', 'card', Cog, ACCENT.system)
const sysFile = (label: string): Entry => t(label, 'system', 'card', Binary, ACCENT.system)

export const FILE_TYPES: Record<string, FileTypeInfo> = build({
  /* ── Word / documents ── */
  doc: wordDoc('Document Word'),
  docx: wordDoc('Document Word'),
  docm: wordDoc('Document Word (macros)'),
  dot: wordDoc('Modèle Word'),
  dotx: wordDoc('Modèle Word'),
  dotm: wordDoc('Modèle Word (macros)'),
  odt: wordDoc('Document OpenDocument'),
  pages: wordDoc('Document Pages'),
  rtf: t('Document RTF', 'document', 'code', FileText, ACCENT.document),
  txt: t('Document texte', 'document', 'code', FileText, ACCENT.neutral),

  /* ── Excel / spreadsheets ── */
  xls: excel('Classeur Excel'),
  xlsx: excel('Classeur Excel'),
  xlsm: excel('Classeur Excel (macros)'),
  xlsb: excel('Classeur Excel binaire'),
  xlt: excel('Modèle Excel'),
  xltx: excel('Modèle Excel'),
  xltm: excel('Modèle Excel (macros)'),
  xla: excel('Complément Excel'),
  xlam: excel('Complément Excel'),
  ods: excel('Feuille de calcul OpenDocument'),
  numbers: excel('Feuille de calcul Numbers'),
  csv: t('Fichier CSV', 'data', 'csv', FileSpreadsheet, ACCENT.spreadsheet),
  tsv: t('Fichier TSV', 'data', 'csv', FileSpreadsheet, ACCENT.spreadsheet),

  /* ── PowerPoint / presentations ── */
  ppt: ppt('Présentation PowerPoint'),
  pptx: ppt('Présentation PowerPoint'),
  pptm: ppt('Présentation PowerPoint (macros)'),
  pot: ppt('Modèle PowerPoint'),
  potx: ppt('Modèle PowerPoint'),
  potm: ppt('Modèle PowerPoint (macros)'),
  pps: ppt('Diaporama PowerPoint'),
  ppsx: ppt('Diaporama PowerPoint'),
  ppsm: ppt('Diaporama PowerPoint (macros)'),
  ppa: ppt('Complément PowerPoint'),
  ppam: ppt('Complément PowerPoint'),
  odp: ppt('Présentation OpenDocument'),
  key: ppt('Présentation Keynote'),

  /* ── Microsoft Office spécialisé ── */
  pub: t('Publication Publisher', 'document', 'office', FileText, ACCENT.document),
  vsd: t('Diagramme Visio', 'document', 'office', Network, ACCENT.document),
  vsdx: t('Diagramme Visio', 'document', 'office', Network, ACCENT.document),
  vsdm: t('Diagramme Visio (macros)', 'document', 'office', Network, ACCENT.document),
  vstx: t('Modèle Visio', 'document', 'office', Network, ACCENT.document),
  vss: t('Gabarit Visio', 'document', 'office', Network, ACCENT.document),
  vssx: t('Gabarit Visio', 'document', 'office', Network, ACCENT.document),
  mpp: t('Projet MS Project', 'document', 'office', FileText, ACCENT.document),
  mpt: t('Modèle MS Project', 'document', 'office', FileText, ACCENT.document),
  one: t('Bloc-notes OneNote', 'document', 'office', FileText, ACCENT.document),
  onetoc2: t('Sommaire OneNote', 'document', 'office', FileText, ACCENT.document),
  xps: t('Document XPS', 'document', 'office', FileText, ACCENT.document),

  /* ── Bases de données ── */
  mdb: dbCard('Base de données Access'),
  accdb: dbCard('Base de données Access'),
  accde: dbCard('Base de données Access (exécution)'),
  accdr: dbCard('Base de données Access (runtime)'),
  accdt: dbCard('Modèle de base Access'),

  /* ── PDF ── */
  pdf: t('Document PDF', 'pdf', 'pdf', FileText, ACCENT.pdf),

  /* ── E-mail / messagerie ── */
  msg: t('E-mail Outlook', 'email', 'card', Mail, ACCENT.email),
  eml: t('E-mail', 'email', 'email', Mail, ACCENT.email),
  oft: t('Modèle d’e-mail Outlook', 'email', 'card', Mail, ACCENT.email),
  pst: t('Dossier Outlook', 'email', 'card', Mail, ACCENT.email),
  ost: t('Dossier Outlook hors connexion', 'email', 'card', Mail, ACCENT.email),

  /* ── Contact / agenda ── */
  vcf: t('Carte de visite', 'contact', 'vcard', Contact, ACCENT.contact),
  ics: t('Événement iCalendar', 'calendar', 'ical', Calendar, ACCENT.calendar),

  /* ── Images web ── */
  jpg: imgView('Image JPEG'),
  jpeg: imgView('Image JPEG'),
  jfif: imgView('Image JPEG'),
  png: imgView('Image PNG'),
  apng: imgView('Image PNG animée'),
  gif: imgView('Image GIF'),
  bmp: imgView('Image Bitmap'),
  webp: imgView('Image WebP'),
  avif: imgView('Image AVIF'),
  ico: imgView('Icône'),
  heic: imgView('Image HEIC'),
  svg: imgView('Image vectorielle SVG', 'vector'),

  /* ── Images pro (non rendues par le navigateur) ── */
  tif: rasterPro('Image TIFF'),
  tiff: rasterPro('Image TIFF'),
  eps: t('Illustration EPS', 'vector', 'card', PenTool, ACCENT.design),
  ai: designCard('Illustration Illustrator'),
  psd: designCard('Document Photoshop'),
  indd: designCard('Document InDesign'),

  /* ── Vidéo ── */
  mp4: videoView('Vidéo MP4'),
  webm: videoView('Vidéo WebM'),
  ogv: videoView('Vidéo OGG'),
  m4v: videoView('Vidéo MP4'),
  mov: videoView('Vidéo QuickTime'),
  mkv: videoView('Vidéo Matroska'),
  avi: videoView('Vidéo AVI'),
  wmv: videoView('Vidéo Windows Media'),
  flv: videoView('Vidéo Flash'),

  /* ── Audio ── */
  mp3: audioView('Audio MP3'),
  wav: audioView('Audio WAV'),
  wma: audioView('Audio Windows Media'),
  aac: audioView('Audio AAC'),
  m4a: audioView('Audio M4A'),
  oga: audioView('Audio OGG'),
  ogg: audioView('Audio OGG'),
  opus: audioView('Audio Opus'),
  flac: audioView('Audio FLAC'),
  weba: audioView('Audio WebM'),

  /* ── Archives ── */
  zip: archive('Archive ZIP'),
  rar: archive('Archive RAR'),
  '7z': archive('Archive 7-Zip'),
  tar: archive('Archive TAR'),
  gz: archive('Archive GZip'),
  bz2: archive('Archive BZip2'),
  xz: archive('Archive XZ'),

  /* ── Web / markup ── */
  html: t('Page HTML', 'web', 'html', FileCode, ACCENT.web),
  htm: t('Page HTML', 'web', 'html', FileCode, ACCENT.web),
  xml: code('Fichier XML', 'markup'),
  css: code('Feuille de style CSS', 'web'),
  scss: code('Feuille de style SCSS', 'web'),
  sass: code('Feuille de style Sass', 'web'),
  less: code('Feuille de style Less', 'web'),
  vue: code('Composant Vue', 'web'),
  svelte: code('Composant Svelte', 'web'),

  /* ── Données ── */
  json: t('Fichier JSON', 'data', 'json', FileJson, ACCENT.data),
  json5: t('Fichier JSON5', 'data', 'json', FileJson, ACCENT.data),
  yaml: codeText('Fichier YAML', 'data'),
  yml: codeText('Fichier YAML', 'data'),
  toml: codeText('Fichier TOML', 'data'),
  sql: code('Script SQL', 'data'),

  /* ── Markdown ── */
  md: t('Document Markdown', 'document', 'markdown', FileText, ACCENT.document),
  markdown: t('Document Markdown', 'document', 'markdown', FileText, ACCENT.document),

  /* ── Code ── */
  js: code('Script JavaScript'),
  mjs: code('Module JavaScript'),
  cjs: code('Module JavaScript'),
  jsx: code('Composant JSX'),
  ts: code('Script TypeScript'),
  tsx: code('Composant TSX'),
  py: code('Script Python'),
  rb: code('Script Ruby'),
  go: code('Source Go'),
  rs: code('Source Rust'),
  java: code('Source Java'),
  kt: code('Source Kotlin'),
  c: code('Source C'),
  h: code('En-tête C'),
  cpp: code('Source C++'),
  hpp: code('En-tête C++'),
  cc: code('Source C++'),
  cs: code('Source C#'),
  php: code('Script PHP'),
  sh: t('Script Shell', 'code', 'code', Terminal, ACCENT.code),
  bat: t('Script de commandes', 'code', 'code', Terminal, ACCENT.code),
  ps1: t('Script PowerShell', 'code', 'code', Terminal, ACCENT.code),

  /* ── Texte / système ── */
  log: codeText('Journal', 'data'),
  bak: t('Sauvegarde', 'system', 'code', FileText, ACCENT.neutral),
  tmp: t('Fichier temporaire', 'system', 'code', FileText, ACCENT.neutral),
  cfg: codeText('Fichier de configuration', 'data'),
  ini: codeText('Fichier de configuration', 'data'),
  conf: codeText('Fichier de configuration', 'data'),
  env: codeText('Variables d’environnement', 'data'),

  /* ── Exécutables / système ── */
  exe: exe('Exécutable Windows'),
  msi: exe('Installateur Windows'),
  dll: sysFile('Bibliothèque DLL'),
  sys: sysFile('Fichier système'),

  /* ── e-books ── */
  epub: ebook('Livre EPUB'),
  mobi: ebook('Livre Mobipocket'),
  azw3: ebook('Livre Kindle'),
  djvu: ebook('Document DjVu'),

  /* ── Polices ── */
  ttf: font('Police TrueType'),
  otf: font('Police OpenType'),
  woff: font('Police de caractères Web'),
  woff2: font('Police de caractères Web'),

  /* ── CAO / 3D ── */
  dwg: cad('Dessin AutoCAD'),
  dxf: cad('Dessin DXF'),
  step: cad('Modèle 3D STEP'),
  stp: cad('Modèle 3D STEP'),
  iges: cad('Modèle 3D IGES'),
  igs: cad('Modèle 3D IGES'),
  stl: cad('Modèle 3D STL'),
  obj: cad('Modèle 3D OBJ'),
  '3ds': cad('Modèle 3D 3DS'),
  blend: cad('Projet Blender'),
})

/** Stamp each entry with its key as `ext`. */
function build(map: Record<string, Entry>): Record<string, FileTypeInfo> {
  const out: Record<string, FileTypeInfo> = {}
  for (const ext of Object.keys(map)) out[ext] = { ext, ...map[ext] }
  return out
}

/* ──────────────────────── runtime resolution ──────────────────────── */

/** Lowercase file extension without the leading dot ('' if none). */
export function extOf(name?: string): string {
  if (!name) return ''
  const clean = name.split(/[?#]/)[0]
  const m = clean.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

const LINK_INFO: FileTypeInfo = {
  ext: '',
  label: 'Lien externe',
  group: 'link',
  viewer: 'card',
  icon: Network,
  accent: ACCENT.brand,
}

/** MIME → ext hints, used when the file name carries no usable extension. */
function fromMime(mime: string): string {
  const m = mime.toLowerCase()
  if (m === 'application/pdf') return 'pdf'
  if (m === 'text/csv') return 'csv'
  if (m === 'text/tab-separated-values') return 'tsv'
  if (m === 'application/json' || m === 'text/json') return 'json'
  if (m === 'text/markdown') return 'md'
  if (m === 'text/html') return 'html'
  if (m === 'text/calendar') return 'ics'
  if (m === 'text/vcard' || m === 'text/x-vcard') return 'vcf'
  if (m === 'message/rfc822') return 'eml'
  if (m === 'application/xml' || m === 'text/xml') return 'xml'
  if (m === 'image/svg+xml') return 'svg'
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/png') return 'png'
  if (m === 'image/gif') return 'gif'
  if (m === 'image/webp') return 'webp'
  if (m.startsWith('image/')) return 'png'
  if (m.startsWith('video/')) return 'mp4'
  if (m.startsWith('audio/')) return 'mp3'
  if (m === 'application/zip') return 'zip'
  if (m.startsWith('text/')) return 'txt'
  return ''
}

/**
 * Resolve the {@link FileTypeInfo} for a document. Tries the file name, then
 * the remote URL, then the MIME type; unknown extensions synthesise a sensible
 * neutral fallback so the viewer always has something to show.
 */
export function resolveFileType(doc: DocMeta): FileTypeInfo {
  if (doc.kind === 'link') return LINK_INFO

  let ext = extOf(doc.fileName) || extOf(doc.remoteUrl)
  if (!ext && doc.mimeType) ext = fromMime(doc.mimeType)

  const known = FILE_TYPES[ext]
  if (known) return known

  // Last resort: lean on the coarse kind recorded at import time.
  if (!ext) {
    if (doc.kind === 'image') return { ...FILE_TYPES.png, ext: '' }
    if (doc.kind === 'video') return { ...FILE_TYPES.mp4, ext: '' }
    if (doc.kind === 'pdf') return { ...FILE_TYPES.pdf, ext: '' }
  }

  // Unknown extension → neutral "Fichier .XYZ" card.
  return {
    ext,
    label: ext ? `Fichier .${ext.toUpperCase()}` : 'Fichier',
    group: 'other',
    viewer: 'card',
    icon: FileIcon,
    accent: ACCENT.neutral,
  }
}

/* Re-exported so the rare consumer that wants the brand icons need not reach
 * back into lucide directly. */
export { ImageIcon, Film, Music, FileIcon }
