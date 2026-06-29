import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Home } from './components/Home'
import { ReadingView } from './components/ReadingView'
import { ExplainView } from './components/ExplainView'
import { FeedbackView } from './components/FeedbackView'
import { SettingsModal } from './components/SettingsModal'
import { fetchRandomArticle } from './lib/wikipedia'
import { reviewWithClaude, mockReview, type ReviewInput } from './lib/ai'
import { isSpeechSupported } from './lib/speech'
import {
  getApiKey,
  setApiKey as persistApiKey,
  loadPrefs,
  savePrefs,
  loadProgress,
  addRecord,
  clearProgress,
} from './lib/storage'
import type { Article, Feedback, InputMode, Level, Progress } from './types'

type Screen = 'home' | 'reading' | 'explain' | 'feedback'

export default function App() {
  const speechSupported = useMemo(() => isSpeechSupported(), [])

  const [apiKey, setApiKey] = useState<string>(() => getApiKey())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const savedPrefs = useMemo(() => loadPrefs(), [])
  const [lang, setLang] = useState<string>(savedPrefs?.lang ?? 'es')
  const [level, setLevel] = useState<Level>(savedPrefs?.level ?? 'intermediate')
  const [mode, setMode] = useState<InputMode>(
    savedPrefs?.mode && !(savedPrefs.mode === 'speak' && !speechSupported) ? savedPrefs.mode : speechSupported ? 'speak' : 'type',
  )

  const [screen, setScreen] = useState<Screen>('home')
  const [article, setArticle] = useState<Article | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  const [loadingArticle, setLoadingArticle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [homeError, setHomeError] = useState<string | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)

  const hasKey = apiKey.trim().length > 0

  useEffect(() => {
    savePrefs({ lang, level, mode })
  }, [lang, level, mode])

  // Keep window scrolled to top on screen change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen, article])

  async function loadArticle(toScreen: Screen = 'reading') {
    setHomeError(null)
    setLoadingArticle(true)
    try {
      const a = await fetchRandomArticle(lang, level)
      setArticle(a)
      setFeedback(null)
      setScreen(toScreen)
    } catch (err: any) {
      setHomeError(err?.message ?? 'Could not load an article. Check your connection and try again.')
    } finally {
      setLoadingArticle(false)
    }
  }

  async function handleSubmit(explanation: string, confidence?: number) {
    if (!article) return
    setExplainError(null)
    setSubmitting(true)
    const input: ReviewInput = { article, explanation, mode, speechConfidence: confidence }
    try {
      const result = hasKey ? await reviewWithClaude(input, apiKey) : mockReview(input)
      setFeedback(result)
      setProgress(
        addRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: Date.now(),
          lang,
          level,
          articleTitle: article.title,
          score: result.score,
          comprehension: result.comprehension,
          mode,
        }),
      )
      setScreen('feedback')
    } catch (err: any) {
      setExplainError(err?.message ?? 'Something went wrong getting your feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSaveKey(key: string) {
    persistApiKey(key)
    setApiKey(key)
  }

  function handleClearProgress() {
    clearProgress()
    setProgress({ records: [] })
  }

  return (
    <div className="min-h-screen bg-paper bg-grain">
      <Header hasKey={hasKey} onHome={() => setScreen('home')} onSettings={() => setSettingsOpen(true)} />

      <main>
        {screen === 'home' && (
          <Home
            lang={lang}
            level={level}
            mode={mode}
            speechSupported={speechSupported}
            progress={progress}
            loading={loadingArticle}
            error={homeError}
            onLang={setLang}
            onLevel={setLevel}
            onMode={setMode}
            onStart={() => loadArticle('reading')}
          />
        )}

        {screen === 'reading' && article && (
          <ReadingView
            article={article}
            level={level}
            loadingNext={loadingArticle}
            onExplain={() => {
              setExplainError(null)
              setScreen('explain')
            }}
            onSkip={() => loadArticle('reading')}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'explain' && article && (
          <ExplainView
            article={article}
            mode={mode}
            submitting={submitting}
            error={explainError}
            onSubmit={handleSubmit}
            onBack={() => setScreen('reading')}
            onSwitchToType={() => setMode('type')}
          />
        )}

        {screen === 'feedback' && article && feedback && (
          <FeedbackView
            feedback={feedback}
            article={article}
            mode={mode}
            isDemo={!hasKey}
            onNext={() => loadArticle('reading')}
            onRetry={() => {
              setExplainError(null)
              setScreen('explain')
            }}
            onHome={() => setScreen('home')}
          />
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        apiKey={apiKey}
        onSave={handleSaveKey}
        onClearProgress={handleClearProgress}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
