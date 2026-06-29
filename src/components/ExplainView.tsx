import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Mic, Square, ArrowLeft, Send, Keyboard, AlertTriangle, Lightbulb } from 'lucide-react'
import type { Article, InputMode } from '../types'
import { languageByCode } from '../data/languages'
import { Recognizer, isSpeechSupported } from '../lib/speech'
import { Spinner } from './ui'

const MIN_WORDS = 5

export function ExplainView({
  article,
  mode,
  submitting,
  error,
  onSubmit,
  onBack,
  onSwitchToType,
}: {
  article: Article
  mode: InputMode
  submitting: boolean
  error: string | null
  onSubmit: (explanation: string, confidence?: number) => void
  onBack: () => void
  onSwitchToType: () => void
}) {
  const language = languageByCode(article.lang)
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [recording, setRecording] = useState(false)
  const [confidence, setConfidence] = useState<number | undefined>(undefined)
  const [micError, setMicError] = useState<string | null>(null)

  const recognizerRef = useRef<Recognizer | null>(null)
  const baseTextRef = useRef('')
  const speechOk = isSpeechSupported()

  useEffect(() => {
    return () => recognizerRef.current?.abort()
  }, [])

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const canSubmit = words >= MIN_WORDS && !submitting && !recording

  function startRecording() {
    setMicError(null)
    setInterim('')
    baseTextRef.current = text.trim() ? text.trim() + ' ' : ''
    const rec = new Recognizer(language.speechTag, {
      onTranscript: (final, intrm) => {
        setText((baseTextRef.current + final).trimStart())
        setInterim(intrm)
      },
      onConfidence: (c) => setConfidence(c),
      onError: (msg) => {
        setMicError(msg)
        setRecording(false)
      },
      onEnd: () => {
        setRecording(false)
        setInterim('')
      },
    })
    recognizerRef.current = rec
    rec.start()
    setRecording(true)
  }

  function stopRecording() {
    recognizerRef.current?.stop()
    setRecording(false)
    setInterim('')
  }

  const showVoice = mode === 'speak' && speechOk

  return (
    <div className="mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink">
        <ArrowLeft size={16} /> Back to the article
      </button>

      <p className="overline">Your turn</p>
      <h1 className="mt-1 text-balance font-serif text-2xl font-semibold leading-tight">
        Explain “{article.title}” in {language.endonym}
      </h1>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft">
        <Lightbulb size={15} className="mt-0.5 shrink-0 text-gold" />
        In your own words, say what the article is about and the main things you learned — in {language.endonym}, not your
        native language. Don't copy sentences; paraphrase.
      </p>

      {/* Voice controls */}
      {showVoice && (
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={submitting}
            className={clsx(
              'relative grid h-20 w-20 place-items-center rounded-full text-white transition-all active:scale-95',
              recording ? 'bg-ember shadow-ember' : 'bg-brand shadow-brand',
            )}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording && <span className="absolute inset-0 rounded-full bg-ember/40 animate-pulse-ring" />}
            {recording ? <Square size={26} fill="currentColor" /> : <Mic size={30} />}
          </button>
          <p className="mt-3 text-sm font-medium text-ink-soft">
            {recording ? 'Listening… tap to stop' : text ? 'Tap to keep speaking' : `Tap and speak in ${language.endonym}`}
          </p>
          <button onClick={onSwitchToType} className="mt-1 inline-flex items-center gap-1 text-xs text-mute hover:text-ink">
            <Keyboard size={12} /> or type instead
          </button>
        </div>
      )}

      {/* Transcript / text area */}
      <div className="mt-5">
        <textarea
          value={text + (interim ? (text ? ' ' : '') + interim : '')}
          onChange={(e) => {
            setText(e.target.value)
            setInterim('')
          }}
          readOnly={recording}
          placeholder={
            showVoice
              ? 'Your spoken words will appear here — you can edit them before submitting.'
              : `Write your explanation in ${language.endonym}…`
          }
          rows={showVoice ? 5 : 8}
          className={clsx(
            'input min-h-[140px] resize-y font-serif text-[1.05rem] leading-relaxed',
            recording && 'border-ember/50 ring-2 ring-ember/15',
          )}
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-mute">
          <span className={clsx(words > 0 && words < MIN_WORDS && 'text-ember')}>
            {words} word{words === 1 ? '' : 's'}
            {words < MIN_WORDS && ` · at least ${MIN_WORDS} to submit`}
          </span>
          {mode === 'speak' && confidence !== undefined && !recording && (
            <span>recognition confidence {(confidence * 100).toFixed(0)}%</span>
          )}
        </div>
      </div>

      {micError && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-ember/30 bg-ember-wash px-3.5 py-2.5 text-sm text-ember-dark">
          <AlertTriangle size={15} /> {micError}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-ember/30 bg-ember-wash px-3.5 py-2.5 text-sm text-ember-dark">
          <AlertTriangle size={15} /> {error}
        </p>
      )}

      {/* Submit bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => onSubmit(text.trim(), mode === 'speak' ? confidence : undefined)}
            disabled={!canSubmit}
            className="btn-primary flex-1 !py-3"
          >
            {submitting ? (
              <>
                <Spinner /> Reviewing your {language.name}…
              </>
            ) : (
              <>
                <Send size={18} /> Get my feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
