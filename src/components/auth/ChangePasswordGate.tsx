import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2, AlertCircle, LogOut, Check } from 'lucide-react'
import { MgBadge } from '../Brand'
import { useAuth } from '../../context/AuthContext'
import { fadeUp, staggerContainer } from '../../motion'

/** Shown right after sign-in when the account still carries a temporary password. */
export default function ChangePasswordGate() {
  const { user, changeOwnPassword, logout } = useAuth()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooShort = pwd.length > 0 && pwd.length < 8
  const mismatch = confirm.length > 0 && confirm !== pwd
  const valid = pwd.length >= 8 && confirm === pwd

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const res = await changeOwnPassword(pwd)
    if (!res.ok) {
      setError(res.error || 'Impossible de mettre à jour le mot de passe.')
      setBusy(false)
    }
    // On success `mustChangePassword` clears and the app routes onward.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mg-base px-5">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm"
      >
        <motion.div variants={fadeUp} className="mb-7 flex flex-col items-center text-center">
          <MgBadge size={48} />
          <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-mg-red-wash text-mg-red">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-mg-ink">
            Choisissez votre mot de passe
          </h1>
          <p className="mt-1.5 text-sm text-mg-ink-soft">
            Bonjour {user?.displayName}. Pour votre première connexion, définissez un nouveau mot de
            passe personnel.
          </p>
        </motion.div>

        <motion.form
          variants={fadeUp}
          onSubmit={submit}
          className="rounded-2xl border border-mg-line bg-mg-panel p-6 shadow-card"
        >
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            className="input mb-1"
          />
          <p className={`mb-3 text-[11px] ${tooShort ? 'text-mg-red' : 'text-mg-mute'}`}>
            {tooShort ? 'Trop court — 8 caractères minimum.' : 'Au moins 8 caractères.'}
          </p>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">
            Confirmer
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Répétez le mot de passe"
            className="input"
          />
          {mismatch && (
            <p className="mt-1 text-[11px] text-mg-red">Les mots de passe ne correspondent pas.</p>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-mg-red-wash px-3 py-2.5 text-sm text-mg-red-dark">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={!valid || busy} className="btn-primary mt-6 w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Enregistrer et continuer
              </>
            )}
          </button>
        </motion.form>

        <motion.button
          variants={fadeUp}
          onClick={() => logout()}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-medium text-mg-mute transition-colors hover:text-mg-ink"
        >
          <LogOut className="h-3.5 w-3.5" /> Se déconnecter
        </motion.button>
      </motion.div>
    </div>
  )
}
