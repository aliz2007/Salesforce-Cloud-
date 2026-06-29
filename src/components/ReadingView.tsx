import { ExternalLink, RefreshCw, MessageSquareText, ArrowLeft } from 'lucide-react'
import type { Article, Level } from '../types'
import { languageByCode } from '../data/languages'
import { Spinner } from './ui'

export function ReadingView({
  article,
  level,
  loadingNext,
  onExplain,
  onSkip,
  onBack,
}: {
  article: Article
  level: Level
  loadingNext: boolean
  onExplain: () => void
  onSkip: () => void
  onBack: () => void
}) {
  const language = languageByCode(article.lang)
  const paragraphs = article.extract.split(/\n+/).filter((p) => p.trim().length > 0)

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="chip chip-active !cursor-default">
          <span className="text-base leading-none">{language.flag}</span>
          {language.endonym}
        </span>
        <span className="chip !cursor-default capitalize">{level}</span>
        <span className="ml-auto text-xs text-mute">Read it through — you don't need every word.</span>
      </div>

      <article className="card overflow-hidden">
        {article.thumbnail && (
          <div className="h-44 w-full overflow-hidden border-b border-line bg-paper sm:h-56">
            <img src={article.thumbnail} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5 sm:p-7">
          <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-[1.75rem]">{article.title}</h1>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Wikipedia <ExternalLink size={12} />
          </a>
          <div className="prose-article mt-4">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </article>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={onSkip} disabled={loadingNext} className="btn-ghost shrink-0">
            {loadingNext ? <Spinner /> : <RefreshCw size={16} />}
            <span className="hidden sm:inline">New article</span>
          </button>
          <button onClick={onExplain} className="btn-primary flex-1 !py-3">
            <MessageSquareText size={18} /> I've read it — let me explain
          </button>
        </div>
      </div>
    </div>
  )
}
