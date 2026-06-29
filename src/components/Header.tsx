import { Settings, KeyRound, Sparkles } from 'lucide-react'
import { Logo } from './ui'

export function Header({
  hasKey,
  onHome,
  onSettings,
}: {
  hasKey: boolean
  onHome: () => void
  onSettings: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={onHome} className="transition-opacity hover:opacity-80" aria-label="Home">
          <Logo />
        </button>
        <div className="flex items-center gap-2">
          <span
            className={
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ' +
              (hasKey
                ? 'border-brand/30 bg-brand-wash text-brand-dark'
                : 'border-gold/30 bg-[#FBF3DD] text-[#8a6a14]')
            }
          >
            {hasKey ? <Sparkles size={13} /> : <KeyRound size={13} />}
            {hasKey ? 'AI ready' : 'Demo mode'}
          </span>
          <button onClick={onSettings} className="btn-ghost !px-2.5 !py-2" aria-label="Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
