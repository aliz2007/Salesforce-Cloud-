import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, KeyRound, LogOut, ShieldCheck, User, X, Loader2, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { springSoft } from '../../motion'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

/** Avatar + dropdown (change password / logout). Sits on light surfaces. */
export default function AccountChip() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null
  const isAdmin = user.role === 'superadmin'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-mg-line bg-white py-1 pl-1 pr-2.5 shadow-sm transition-colors hover:bg-mg-wash"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mg-grad text-xs font-bold text-white shadow-glow">
          {initials(user.displayName) || <User className="h-4 w-4" />}
        </span>
        <span className="hidden text-sm font-semibold text-mg-ink sm:block">{user.displayName}</span>
        <ChevronDown className={`h-4 w-4 text-mg-mute transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={springSoft}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-mg-line bg-white shadow-card-hover"
          >
            <div className="flex items-center gap-3 border-b border-mg-line px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mg-grad text-sm font-bold text-white">
                {initials(user.displayName) || <User className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-mg-ink">{user.displayName}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-mg-mute">
                  {isAdmin ? <ShieldCheck className="h-3 w-3 text-mg-red" /> : <User className="h-3 w-3" />}
                  {isAdmin ? 'Superadmin' : 'Vendeur'}
                </div>
              </div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setOpen(false)
                  setPwOpen(true)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-mg-ink transition-colors hover:bg-mg-wash"
              >
                <KeyRound className="h-4 w-4 text-mg-mute" /> Changer le mot de passe
              </button>
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-mg-red transition-colors hover:bg-mg-red-wash"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  )
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { changeOwnPassword } = useAuth()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const valid = pwd.length >= 8 && pwd === confirm

  const reset = () => {
    setPwd('')
    setConfirm('')
    setError(null)
    setDone(false)
    setBusy(false)
  }
  const close = () => {
    reset()
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const res = await changeOwnPassword(pwd)
    setBusy(false)
    if (!res.ok) setError(res.error || 'Échec de la mise à jour.')
    else {
      setDone(true)
      setTimeout(close, 1100)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-mg-ink/40 p-5 backdrop-blur-sm"
        >
          <motion.form
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={springSoft}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-sm rounded-2xl border border-mg-line bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-mg-ink">Changer le mot de passe</h3>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-mg-wash text-mg-ink hover:bg-mg-line"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-mg-ink">Mot de passe mis à jour.</p>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoFocus
                  placeholder="Nouveau mot de passe (8+)"
                  autoComplete="new-password"
                  className="input mb-3"
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirmer"
                  autoComplete="new-password"
                  className="input"
                />
                {error && <p className="mt-2 text-sm text-mg-red">{error}</p>}
                <button type="submit" disabled={!valid || busy} className="btn-primary mt-5 w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                </button>
              </>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
