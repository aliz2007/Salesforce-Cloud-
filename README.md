# LinguaRead · Read it. Explain it. Master it.

A language-learning web app for people who **already speak** a language and want
to get **better** at it — while picking up general knowledge along the way.

The loop is simple:

1. **Read** a random, genuinely interesting article pulled live from Wikipedia,
   in the language you're practising.
2. **Explain** what you understood — *in that language* — by **speaking** (with
   your microphone) or **typing**.
3. **Get reviewed** by an AI tutor (Claude) that grades your **comprehension**
   and flags errors of **grammar**, **syntax/word-order**, **vocabulary** and —
   when you speak — **pronunciation**, with concrete corrections and an honest
   score.

Because you have to reconstruct the meaning in your own words, you practise
*active* production instead of passive recognition — and learn something new
every session.

---

## ✨ Features

- **10 languages** (Spanish, French, German, Italian, Portuguese, Dutch,
  English, Russian, Japanese, Chinese), each from its own Wikipedia.
- **Three levels** that tune article length/density (beginner → advanced).
- **Speak or type** — voice uses the browser's Web Speech API; the transcript is
  editable before you submit.
- **AI review** via the Anthropic API (Claude Opus) returning structured,
  categorised feedback with corrections in the target language and explanations
  in English.
- **Progress tracking** — streak, average score, best score and recent sessions,
  stored locally in your browser.
- **Demo mode** — the whole flow works with **no API key**; the review is a local
  placeholder until you add a key.

## 🧱 Stack

Vite · React · TypeScript · Tailwind CSS · `@anthropic-ai/sdk` · lucide-react.
No backend — it's a static site.

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the build
```

Open the app, click the gear → **Settings**, and paste an Anthropic API key
(<https://console.anthropic.com/settings/keys>) to enable real feedback. The key
is stored only in your browser (`localStorage`) and is sent **directly** from
your device to the Anthropic API — it never passes through any server of ours.

## 🔌 How it works

| Concern | Where |
| --- | --- |
| Random articles | `src/lib/wikipedia.ts` — public Wikipedia Action API (`origin=*` CORS), filtered to fit the chosen level. |
| Speech-to-text | `src/lib/speech.ts` — thin wrapper over `SpeechRecognition`. |
| AI review | `src/lib/ai.ts` — Claude via `@anthropic-ai/sdk` (browser-direct) with structured JSON output; includes an offline mock. |
| Storage | `src/lib/storage.ts` — API key, preferences and progress in `localStorage`. |
| Screens | `src/components/` — `Home` · `ReadingView` · `ExplainView` · `FeedbackView` · `SettingsModal`. |

### A note on pronunciation

The browser speech API returns **text**, not audio, so the app can't grade
pronunciation acoustically. It passes the transcript (and the recogniser's
confidence) to the AI, which flags *likely* pronunciation difficulties from
transcription slips and commonly mispronounced words — framed as "likely", not
measured. True acoustic scoring would need an audio model and is a natural next
step.

## ⚙️ Configuration

No build-time configuration is required. Optionally, a deployment can bake in a
default key via `VITE_ANTHROPIC_API_KEY` (see `.env.example`) — but note anything
in `VITE_*` ships to the client, so only do that for a private/internal build.

## 🌐 Hosting

The bundle is small and fully static — deploy `dist/` to Cloudflare Pages,
Vercel, Netlify, GitHub Pages, or any static host. Connect the repo and set the
build command to `npm run build` and the output directory to `dist/`.

## 🗺️ Ideas / roadmap

- Acoustic pronunciation scoring with an audio model.
- Spaced-repetition of the specific mistakes you make.
- Save articles and re-attempt them later; per-language progress charts.
- Difficulty auto-calibration based on your recent scores.
- A small backend proxy so a shared deployment can offer AI feedback without
  each user supplying a key.
