import clsx from 'clsx'
import { Mic, Keyboard, BookOpen, Flame, Trophy, GraduationCap, ArrowRight, AlertTriangle } from 'lucide-react'
import type { InputMode, Level, Progress } from '../types'
import { LANGUAGES, LEVELS, languageByCode } from '../data/languages'
import { Spinner } from './ui'

interface HomeProps {
  lang: string
  level: Level
  mode: InputMode
  speechSupported: boolean
  progress: Progress
  loading: boolean
  error: string | null
  onLang: (code: string) => void
  onLevel: (level: Level) => void
  onMode: (mode: InputMode) => void
  onStart: () => void
}

function streakDays(progress: Progress): number {
  if (!progress.records.length) return 0
  const days = new Set(progress.records.map((r) => new Date(r.date).toDateString()))
  let streak = 0
  const cursor = new Date()
  // Allow today or yesterday as the streak anchor.
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function Home(props: HomeProps) {
  const { lang, level, mode, speechSupported, progress, loading, error } = props
  const records = progress.records
  const avg = records.length
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0
  const best = records.reduce((m, r) => Math.max(m, r.score), 0)
  const streak = streakDays(progress)
  const selected = languageByCode(lang)

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      {/* Hero */}
      <section className="animate-fade-in">
        <p className="overline">Learn by understanding, not memorising</p>
        <h1 className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight sm:text-4xl">
          Read a real article. Explain it back. Get corrected.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          LinguaRead pulls a random, genuinely interesting article in{' '}
          <span className="font-semibold text-ink">{selected.endonym}</span>. You read it, then explain
          what you understood — out loud or in writing — and an AI reviews your grammar, syntax and
          pronunciation. You sharpen the language and pick up general knowledge at the same time.
        </p>
      </section>

      {/* Stats */}
      {records.length > 0 && (
        <section className="mt-7 grid grid-cols-3 gap-3 animate-fade-in">
          <Stat icon={<Flame size={16} />} value={`${streak}`} label={streak === 1 ? 'day streak' : 'day streak'} tint="ember" />
          <Stat icon={<GraduationCap size={16} />} value={`${avg}`} label="avg score" tint="brand" />
          <Stat icon={<Trophy size={16} />} value={`${best}`} label="best" tint="gold" />
        </section>
      )}

      {/* Language */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-ink">I want to practise…</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => props.onLang(l.code)}
              className={clsx('chip', l.code === lang && 'chip-active')}
            >
              <span className="text-base leading-none">{l.flag}</span>
              {l.endonym}
            </button>
          ))}
        </div>
      </section>

      {/* Level */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-ink">My level</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {LEVELS.map((lv) => (
            <button
              key={lv.id}
              onClick={() => props.onLevel(lv.id)}
              className={clsx(
                'rounded-xl border px-3 py-3 text-left transition-all',
                lv.id === level
                  ? 'border-brand bg-brand-wash shadow-sm'
                  : 'border-line bg-card hover:border-brand/40',
              )}
            >
              <div className={clsx('text-sm font-semibold', lv.id === level ? 'text-brand-dark' : 'text-ink')}>
                {lv.label}
              </div>
              <div className="mt-0.5 text-[12px] leading-tight text-mute">{lv.hint}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Mode */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-ink">How I'll explain it</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <ModeCard
            active={mode === 'speak'}
            disabled={!speechSupported}
            icon={<Mic size={18} />}
            title="Speak"
            desc={speechSupported ? 'Out loud — get pronunciation notes' : 'Not supported in this browser'}
            onClick={() => speechSupported && props.onMode('speak')}
          />
          <ModeCard
            active={mode === 'type'}
            icon={<Keyboard size={18} />}
            title="Type"
            desc="In writing — grammar & syntax"
            onClick={() => props.onMode('type')}
          />
        </div>
        {!speechSupported && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-mute">
            <AlertTriangle size={13} /> Voice input needs Chrome, Edge or Safari.
          </p>
        )}
      </section>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-ember/30 bg-ember-wash px-3.5 py-3 text-sm text-ember-dark">
          <AlertTriangle size={16} /> {error}
        </p>
      )}

      {/* Start */}
      <button onClick={props.onStart} disabled={loading} className="btn-primary mt-8 w-full !py-3.5 text-base">
        {loading ? (
          <>
            <Spinner /> Finding an article…
          </>
        ) : (
          <>
            <BookOpen size={18} /> Start reading <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Recent */}
      {records.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold text-ink">Recent sessions</h2>
          <ul className="space-y-2">
            {records.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5">
                <span className="text-lg">{languageByCode(r.lang).flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{r.articleTitle}</div>
                  <div className="text-[12px] text-mute">
                    {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                    {r.mode === 'speak' ? 'spoken' : 'written'} · {r.level}
                  </div>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-sm font-bold',
                    r.score >= 80
                      ? 'bg-brand-wash text-brand-dark'
                      : r.score >= 60
                        ? 'bg-[#FBF3DD] text-[#8a6a14]'
                        : 'bg-ember-wash text-ember-dark',
                  )}
                >
                  {r.score}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ icon, value, label, tint }: { icon: React.ReactNode; value: string; label: string; tint: 'brand' | 'ember' | 'gold' }) {
  const tintCls = tint === 'brand' ? 'text-brand' : tint === 'ember' ? 'text-ember' : 'text-gold'
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-3 text-center">
      <div className={clsx('mb-1 flex items-center justify-center', tintCls)}>{icon}</div>
      <div className="font-serif text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide2 text-mute">{label}</div>
    </div>
  )
}

function ModeCard({
  active,
  disabled,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
        disabled && 'cursor-not-allowed opacity-50',
        active ? 'border-brand bg-brand-wash shadow-sm' : 'border-line bg-card hover:border-brand/40',
      )}
    >
      <span className={clsx('mt-0.5', active ? 'text-brand' : 'text-ink-soft')}>{icon}</span>
      <span>
        <span className={clsx('block text-sm font-semibold', active ? 'text-brand-dark' : 'text-ink')}>{title}</span>
        <span className="block text-[12px] leading-tight text-mute">{desc}</span>
      </span>
    </button>
  )
}
