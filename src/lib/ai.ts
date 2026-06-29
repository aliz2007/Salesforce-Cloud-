import Anthropic from '@anthropic-ai/sdk'
import type { Article, Feedback, InputMode } from '../types'
import { languageByCode } from '../data/languages'

const MODEL = 'claude-opus-4-8'

const ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    excerpt: { type: 'string', description: "The learner's exact words being corrected (in the target language)." },
    issue: { type: 'string', description: 'A short explanation of the mistake, in English.' },
    correction: { type: 'string', description: 'The corrected version, in the target language.' },
  },
  required: ['excerpt', 'issue', 'correction'],
} as const

const FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'integer', description: 'Overall mastery for this attempt, 0–100.' },
    comprehension: { type: 'integer', description: 'How accurately the learner understood the article, 0–100.' },
    summary: { type: 'string', description: 'One-line verdict in English.' },
    grammar: { type: 'array', items: ITEM_SCHEMA },
    syntax: { type: 'array', items: ITEM_SCHEMA },
    vocabulary: { type: 'array', items: ITEM_SCHEMA },
    pronunciation: {
      type: 'array',
      items: { type: 'string' },
      description: 'Pronunciation notes. Empty if the learner typed instead of speaking.',
    },
    strengths: { type: 'array', items: { type: 'string' }, description: 'A few things the learner did well, in English.' },
    review: { type: 'string', description: 'A warm, encouraging 3–5 sentence review in English.' },
  },
  required: ['score', 'comprehension', 'summary', 'grammar', 'syntax', 'vocabulary', 'pronunciation', 'strengths', 'review'],
} as const

export interface ReviewInput {
  article: Article
  explanation: string
  mode: InputMode
  /** Average speech-recognition confidence (0–1), when spoken. */
  speechConfidence?: number
}

function buildSystemPrompt(languageName: string): string {
  return [
    `You are an expert, warm and encouraging ${languageName} tutor.`,
    `A learner has read an article in ${languageName} and is now explaining, in ${languageName}, what they understood.`,
    `Your job is to evaluate two things:`,
    `1. COMPREHENSION — did their explanation accurately capture what the article is actually about? Reward genuine understanding; gently flag misunderstandings or invented facts.`,
    `2. LANGUAGE QUALITY of their ${languageName} — grammar, syntax/word-order, and vocabulary/word-choice.`,
    ``,
    `Rules:`,
    `- Write all explanations, the summary, strengths and the review in ENGLISH so the learner can follow.`,
    `- "excerpt" and "correction" must be in ${languageName}.`,
    `- Only list real mistakes. If a category has none, return an empty array. Do not pad with trivial nitpicks.`,
    `- Be specific and actionable. Quote the learner's actual words in each excerpt.`,
    `- Pronunciation: you only receive a text transcription of speech, not audio, so you cannot hear them. When they spoke, infer LIKELY pronunciation difficulties from transcription slips, false cognates, or commonly mispronounced words, and clearly frame these as "likely" issues. When they typed, return an empty pronunciation array.`,
    `- Scores: comprehension reflects understanding of the article; overall score blends comprehension with language accuracy. Be fair but honest.`,
    `- Tone: supportive and motivating. End the review with a concrete next step.`,
  ].join('\n')
}

function buildUserPrompt(input: ReviewInput, languageName: string): string {
  const { article, explanation, mode, speechConfidence } = input
  const conf =
    mode === 'speak' && typeof speechConfidence === 'number'
      ? `\nSpeech-recognition average confidence: ${(speechConfidence * 100).toFixed(0)}% (lower can indicate unclear pronunciation, but may also be background noise or accent — weigh it cautiously).`
      : ''
  return [
    `THE ARTICLE (in ${languageName}), titled "${article.title}":`,
    `"""`,
    article.extract,
    `"""`,
    ``,
    `The learner ${mode === 'speak' ? 'SPOKE' : 'TYPED'} their explanation.${conf}`,
    ``,
    `THE LEARNER'S EXPLANATION (in ${languageName}):`,
    `"""`,
    explanation,
    `"""`,
    ``,
    `Evaluate it now.`,
  ].join('\n')
}

/** Call Claude for a real review. Throws a friendly Error on failure. */
export async function reviewWithClaude(input: ReviewInput, apiKey: string): Promise<Feedback> {
  const languageName = languageByCode(input.article.lang).name
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  // Built untyped: `output_config` (structured outputs) and adaptive `thinking`
  // are passed straight through to the API regardless of the SDK's typings.
  const params: any = {
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { format: { type: 'json_schema', schema: FEEDBACK_SCHEMA } },
    system: buildSystemPrompt(languageName),
    messages: [{ role: 'user', content: buildUserPrompt(input, languageName) }],
  }

  let response: Anthropic.Message
  try {
    response = (await client.messages.create(params)) as Anthropic.Message
  } catch (err: any) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('Your Anthropic API key was rejected. Check it in Settings.')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('Rate limited by the Anthropic API — wait a moment and try again.')
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error: ${err.message}`)
    }
    throw new Error(err?.message ?? 'Could not reach the Anthropic API.')
  }

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to review this text. Try a different article.')
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock) throw new Error('The model returned no feedback. Try again.')

  let parsed: Feedback
  try {
    parsed = JSON.parse(textBlock.text) as Feedback
  } catch {
    throw new Error('Could not parse the feedback. Try again.')
  }
  return normalize(parsed)
}

/** Clamp/repair a Feedback object so the UI never sees junk. */
function normalize(f: Feedback): Feedback {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
  const arr = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : [])
  return {
    score: clamp(f.score),
    comprehension: clamp(f.comprehension),
    summary: f.summary ?? '',
    grammar: arr(f.grammar),
    syntax: arr(f.syntax),
    vocabulary: arr(f.vocabulary),
    pronunciation: arr(f.pronunciation),
    strengths: arr(f.strengths),
    review: f.review ?? '',
  }
}

/**
 * Offline demo review used when no API key is configured, so the whole flow is
 * usable with zero setup. It is heuristic — not a real language assessment.
 */
export function mockReview(input: ReviewInput): Feedback {
  const words = input.explanation.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const effort = Math.min(100, 35 + wordCount * 2)
  const comprehension = Math.min(96, 45 + wordCount)
  const score = Math.round((effort + comprehension) / 2)

  const pronunciation =
    input.mode === 'speak'
      ? [
          'Demo mode can’t analyse audio. With a real API key, the AI flags words you likely mispronounced based on the transcription.',
        ]
      : []

  return {
    score,
    comprehension,
    summary:
      wordCount < 8
        ? 'A short attempt — add your API key and write a bit more for a real review.'
        : 'Solid effort. Add your Anthropic API key for a genuine, detailed review.',
    grammar: [],
    syntax: [],
    vocabulary: [],
    pronunciation,
    strengths: [
      wordCount >= 8 ? 'You explained the article in your own words — exactly the right exercise.' : 'You gave it a go!',
    ],
    review:
      `This is demo feedback generated locally — it can’t actually assess your ${languageByCode(input.article.lang).name}. ` +
      `You wrote ${wordCount} word${wordCount === 1 ? '' : 's'}. ` +
      `Open Settings and paste an Anthropic API key to unlock real feedback on your grammar, syntax and pronunciation, with corrections and an honest score. Next step: try explaining one more article.`,
  }
}
