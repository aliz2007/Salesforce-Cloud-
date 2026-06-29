import { useState } from 'react'
import { X, KeyRound, ExternalLink, Eye, EyeOff, ShieldCheck, Trash2, Check } from 'lucide-react'

export function SettingsModal({
  open,
  apiKey,
  onSave,
  onClearProgress,
  onClose,
}: {
  open: boolean
  apiKey: string
  onSave: (key: string) => void
  onClearProgress: () => void
  onClose: () => void
}) {
  const [value, setValue] = useState(apiKey)
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!open) return null

  function save() {
    onSave(value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border border-line bg-paper p-5 shadow-card-hover animate-fade-in sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="btn-ghost !p-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-ink">
          <KeyRound size={15} /> Anthropic API key
        </label>
        <p className="mb-2.5 text-[13px] leading-relaxed text-ink-soft">
          Paste your key to unlock real AI feedback. It's stored only in this browser and sent directly to Anthropic from
          your device — it never touches any server of ours.
        </p>

        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-…"
            spellCheck={false}
            autoComplete="off"
            className="input pr-10 font-mono text-sm"
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-mute hover:text-ink"
            aria-label={show ? 'Hide key' : 'Show key'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={save} className="btn-primary">
            {saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              'Save key'
            )}
          </button>
          {value && (
            <button
              onClick={() => {
                setValue('')
                onSave('')
              }}
              className="btn-ghost"
            >
              Remove
            </button>
          )}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Get a key <ExternalLink size={12} />
          </a>
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-brand-wash px-3 py-2.5 text-[12px] leading-relaxed text-brand-dark">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Without a key, the app runs in demo mode: the full read-and-explain flow works, but the review is a local
          placeholder rather than a real assessment.
        </p>

        <hr className="my-5 border-line" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-ink">Progress history</div>
            <div className="text-[12px] text-mute">Stored locally on this device.</div>
          </div>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearProgress()
                  setConfirmClear(false)
                }}
                className="btn-ember !py-2"
              >
                Confirm
              </button>
              <button onClick={() => setConfirmClear(false)} className="btn-ghost !py-2">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="btn-ghost !py-2 text-ember-dark">
              <Trash2 size={15} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
