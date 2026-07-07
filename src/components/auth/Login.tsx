import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { MgBadge } from '../Brand'
import { useAuth } from '../../context/AuthContext'
import { EASE, fadeUp, staggerContainer } from '../../motion'

export default function Login() {
  const { login } = useAuth()
  const reduce = useReducedMotion()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password || busy) return
    setBusy(true)
    setError(null)
    const res = await login(username.trim(), password)
    if (!res.ok) {
      setError(res.error || 'Connexion impossible.')
      setBusy(false)
    }
    // On success the app re-routes automatically; keep the button busy.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mg-base px-5">
      {/* ambient aurora */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-mg-red/10 blur-[130px]"
        animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[10%] h-[360px] w-[420px] rounded-full bg-amber-400/10 blur-[130px]"
        animate={reduce ? undefined : { opacity: [0.5, 0.25, 0.5] }}
        transition={{ duration: 11, repeat: Infinity }}
      />

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm"
      >
        <motion.div variants={fadeUp} className="mb-8 flex flex-col items-center text-center">
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MgBadge size={56} />
          </motion.div>
          <div className="mt-5 overline">Accès réservé au réseau</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-mg-ink">
            MG Maroc <span className="text-mg-red">Sales Cloud</span>
          </h1>
          <p className="mt-1.5 text-sm text-mg-ink-soft">Connectez-vous pour continuer.</p>
        </motion.div>

        <motion.form
          variants={fadeUp}
          onSubmit={submit}
          className="rounded-2xl border border-mg-line bg-mg-panel p-6 shadow-card"
        >
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">
            Identifiant
          </label>
          <div className="relative mb-4">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mg-mute" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="ex. imane"
              className="input pl-9"
            />
          </div>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mg-mute">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mg-mute" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="input px-9"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-mg-mute transition-colors hover:bg-mg-wash hover:text-mg-ink"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-mg-red-wash px-3 py-2.5 text-sm text-mg-red-dark"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={busy || !username.trim() || !password}
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary mt-6 w-full"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Connexion…
              </>
            ) : (
              <>
                Se connecter <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.p variants={fadeUp} className="mt-6 text-center text-xs text-mg-mute">
          MG Maroc · Application interne · Accès sur le réseau local
        </motion.p>
      </motion.div>
    </div>
  )
}
