import {
  RefreshCw,
  RotateCcw,
  Home as HomeIcon,
  CheckCircle2,
  SpellCheck,
  Braces,
  BookA,
  Volume2,
  Sparkles,
  KeyRound,
} from 'lucide-react'
import type { Article, Feedback, FeedbackItem, InputMode } from '../types'
import { languageByCode } from '../data/languages'
import { ScoreRing } from './ui'

export function FeedbackView({
  feedback,
  article,
  mode,
  isDemo,
  onNext,
  onRetry,
  onHome,
}: {
  feedback: Feedback
  article: Article
  mode: InputMode
  isDemo: boolean
  onNext: () => void
  onRetry: () => void
  onHome: () => void
}) {
  const language = languageByCode(article.lang)
  const totalIssues = feedback.grammar.length + feedback.syntax.length + feedback.vocabulary.length

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-6">
      <p className="overline">Your review</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight">{article.title}</h1>

      {isDemo && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-gold/30 bg-[#FBF3DD] px-3.5 py-3 text-sm text-[#7a5f12]">
          <KeyRound size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Demo feedback.</strong> Add an Anthropic API key in Settings to get a genuine assessment of your{' '}
            {language.name} — real grammar, syntax and pronunciation corrections.
          </span>
        </div>
      )}

      {/* Scores */}
      <section className="mt-6 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-line bg-card p-6 shadow-card sm:justify-around">
        <ScoreRing score={feedback.score} label="overall" />
        <ScoreRing score={feedback.comprehension} size={104} label="understood" />
        <div className="min-w-[160px] flex-1">
          <p className="font-serif text-lg leading-snug text-ink">{feedback.summary}</p>
          <p className="mt-2 text-sm text-mute">
            {totalIssues === 0
              ? 'No language issues flagged — excellent.'
              : `${totalIssues} thing${totalIssues === 1 ? '' : 's'} to work on.`}
          </p>
        </div>
      </section>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <section className="mt-5 rounded-2xl border border-brand/20 bg-brand-wash p-5">
          <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-brand-dark">
            <CheckCircle2 size={16} /> What you did well
          </h2>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Error categories */}
      <Category title="Grammar" icon={<SpellCheck size={16} />} items={feedback.grammar} />
      <Category title="Syntax & word order" icon={<Braces size={16} />} items={feedback.syntax} />
      <Category title="Vocabulary & word choice" icon={<BookA size={16} />} items={feedback.vocabulary} />

      {/* Pronunciation */}
      {mode === 'speak' && (
        <section className="mt-5">
          <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-ink">
            <Volume2 size={16} className="text-ember" /> Pronunciation
          </h2>
          {feedback.pronunciation.length > 0 ? (
            <ul className="space-y-2">
              {feedback.pronunciation.map((p, i) => (
                <li key={i} className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink">
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-mute">
              Nothing notable flagged from your transcription.
            </p>
          )}
        </section>
      )}

      {/* Review */}
      <section className="mt-6 rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <Sparkles size={16} className="text-gold" /> Tutor's note
        </h2>
        <p className="font-serif text-[1.05rem] leading-relaxed text-ink-soft">{feedback.review}</p>
      </section>

      {/* Actions */}
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button onClick={onNext} className="btn-primary !py-3">
          <RefreshCw size={17} /> Another article
        </button>
        <button onClick={onRetry} className="btn-ghost !py-3">
          <RotateCcw size={17} /> Explain again
        </button>
        <button onClick={onHome} className="btn-ghost !py-3">
          <HomeIcon size={17} /> Home
        </button>
      </div>
    </div>
  )
}

function Category({ title, icon, items }: { title: string; icon: React.ReactNode; items: FeedbackItem[] }) {
  if (items.length === 0) return null
  return (
    <section className="mt-5">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="text-ember">{icon}</span>
        {title}
        <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-mute">{items.length}</span>
      </h2>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl border border-line bg-card p-3.5">
            <p className="text-sm leading-relaxed">
              <span className="font-serif text-ember-dark line-through decoration-ember/40">{item.excerpt}</span>
              <span className="mx-1.5 text-mute">→</span>
              <span className="font-serif font-semibold text-brand-dark">{item.correction}</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{item.issue}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
