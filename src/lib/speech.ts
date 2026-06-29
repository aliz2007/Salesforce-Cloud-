/**
 * Thin wrapper over the browser Web Speech API (SpeechRecognition).
 * Transcribes the learner's spoken explanation in the target language.
 *
 * Pronunciation note: the API returns text, not phonemes — so we can't grade
 * pronunciation acoustically. We surface the per-result confidence and let the
 * AI reason about likely pronunciation issues from transcription slips.
 */

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function isSpeechSupported(): boolean {
  return getRecognitionCtor() !== null
}

export interface RecognizerCallbacks {
  /** Fired continuously with the best-so-far transcript (final + interim). */
  onTranscript: (final: string, interim: string) => void
  /** Average confidence (0–1) across final results, once available. */
  onConfidence?: (confidence: number) => void
  onError?: (message: string) => void
  onEnd?: () => void
}

export class Recognizer {
  private rec: SpeechRecognitionLike | null = null
  private finalText = ''
  private confidences: number[] = []
  private manualStop = false

  constructor(private lang: string, private cb: RecognizerCallbacks) {}

  start() {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      this.cb.onError?.('Speech recognition is not available in this browser. Try Chrome, Edge or Safari — or type your answer instead.')
      return
    }
    this.finalText = ''
    this.confidences = []
    this.manualStop = false

    const rec = new Ctor()
    rec.lang = this.lang
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const alt = result[0]
        if (result.isFinal) {
          this.finalText += alt.transcript
          if (typeof alt.confidence === 'number' && alt.confidence > 0) {
            this.confidences.push(alt.confidence)
          }
        } else {
          interim += alt.transcript
        }
      }
      this.cb.onTranscript(this.finalText.trim(), interim.trim())
    }

    rec.onerror = (e: any) => {
      const code = e?.error
      if (code === 'no-speech') return // benign; keep listening
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        this.cb.onError?.('Microphone access was blocked. Allow the mic, or type your answer instead.')
      } else if (code === 'aborted') {
        // user stopped — ignore
      } else {
        this.cb.onError?.(`Speech recognition error: ${code ?? 'unknown'}`)
      }
    }

    rec.onend = () => {
      // Chrome ends the session on pauses; restart unless the user stopped.
      if (!this.manualStop) {
        try {
          rec.start()
          return
        } catch {
          /* fallthrough to end */
        }
      }
      if (this.confidences.length) {
        const avg = this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length
        this.cb.onConfidence?.(avg)
      }
      this.cb.onEnd?.()
    }

    this.rec = rec
    try {
      rec.start()
    } catch (err) {
      this.cb.onError?.('Could not start the microphone.')
    }
  }

  stop() {
    this.manualStop = true
    this.rec?.stop()
  }

  abort() {
    this.manualStop = true
    this.rec?.abort()
  }
}
