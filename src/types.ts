export interface Language {
  /** Wikipedia / BCP-47 base code, e.g. "es" */
  code: string
  /** BCP-47 tag for speech recognition, e.g. "es-ES" */
  speechTag: string
  /** English name */
  name: string
  /** Endonym (name in the language itself) */
  endonym: string
  flag: string
}

export type Level = 'beginner' | 'intermediate' | 'advanced'

/** A random article pulled from Wikipedia in the target language. */
export interface Article {
  title: string
  /** Plain-text extract (a few paragraphs). */
  extract: string
  /** Canonical URL on Wikipedia. */
  url: string
  /** Optional lead image. */
  thumbnail?: string
  lang: string
}

export type InputMode = 'speak' | 'type'

export interface FeedbackItem {
  /** The learner's exact words being commented on. */
  excerpt: string
  /** What's wrong. */
  issue: string
  /** A corrected version. */
  correction: string
}

export interface Feedback {
  /** 0–100 overall mastery score for this attempt. */
  score: number
  /** How well the learner understood the article (0–100). */
  comprehension: number
  /** One-line verdict, in English. */
  summary: string
  grammar: FeedbackItem[]
  syntax: FeedbackItem[]
  vocabulary: FeedbackItem[]
  /** Pronunciation notes — only meaningful when the learner spoke. */
  pronunciation: string[]
  /** A couple of things the learner did well. */
  strengths: string[]
  /** Warm, encouraging multi-sentence review, in English. */
  review: string
}

export interface SessionRecord {
  id: string
  date: number
  lang: string
  level: Level
  articleTitle: string
  score: number
  comprehension: number
  mode: InputMode
}

export interface Progress {
  records: SessionRecord[]
}
