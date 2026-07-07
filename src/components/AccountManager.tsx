import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Pencil,
  KeyRound,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'
import type { SafeUser, UserRole } from '../types'
import { useAuth } from '../context/AuthContext'
import AccountChip from './auth/AccountChip'
import { fadeUp, springSoft, staggerContainer } from '../motion'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}
function genPassword() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const n = '23456789'
  const pick = (s: string, k: number) =>
    Array.from({ length: k }, () => s[Math.floor(Math.random() * s.length)]).join('')
  return `MG-${pick(a, 4)}${pick(n, 3)}`
}

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: SafeUser }
  | { kind: 'reset'; user: SafeUser }
  | { kind: 'delete'; user: SafeUser }
  | null

export default function AccountManager({ onExit }: { onExit: () => void }) {
  const { user: me, users, refreshUsers } = useAuth()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshUsers().finally(() => setLoading(false))
  }, [refreshUsers])

  const sorted = useMemo(
    () =>
      [...users].sort(
        (a, b) =>
          (a.role === 'superadmin' ? 0 : 1) - (b.role === 'superadmin' ? 0 : 1) ||
          a.displayName.localeCompare(b.displayName, 'fr'),
      ),
    [users],
  )
  const adminCount = users.filter((u) => u.role === 'superadmin').length

  return (
    <div className="min-h-screen bg-mg-base pb-20">
      <header className="sticky top-0 z-30 border-b border-mg-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-wash text-mg-ink transition-colors hover:bg-mg-line"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-mg-red">
                Administration
              </div>
              <div className="text-sm font-extrabold text-mg-ink">Gestion des comptes</div>
            </div>
          </div>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-mg-ink-soft">
            {users.length} compte{users.length > 1 ? 's' : ''} ·{' '}
            {adminCount} superadmin{adminCount > 1 ? 's' : ''}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDialog({ kind: 'create' })}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4" /> Ajouter un compte
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-mg-mute" />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            {sorted.map((u) => (
              <motion.div
                key={u.id}
                variants={fadeUp}
                layout
                className="flex items-center gap-4 rounded-2xl border border-mg-line bg-mg-panel p-4 shadow-card"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mg-grad text-sm font-bold text-white shadow-glow">
                  {initials(u.displayName) || <UserIcon className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold text-mg-ink">{u.displayName}</span>
                    <RoleBadge role={u.role} />
                    {u.id === me?.id && (
                      <span className="rounded-full bg-mg-wash px-2 py-0.5 text-[10px] font-semibold text-mg-mute">
                        Vous
                      </span>
                    )}
                    {u.mustChangePassword && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Mot de passe temporaire
                      </span>
                    )}
                  </div>
                  <div className="truncate text-sm text-mg-mute">@{u.username}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn title="Modifier" onClick={() => setDialog({ kind: 'edit', user: u })}>
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    title="Réinitialiser le mot de passe"
                    onClick={() => setDialog({ kind: 'reset', user: u })}
                  >
                    <KeyRound className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    title="Supprimer"
                    danger
                    disabled={u.id === me?.id || (u.role === 'superadmin' && adminCount <= 1)}
                    onClick={() => setDialog({ kind: 'delete', user: u })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {dialog?.kind === 'create' && <UserFormModal onClose={() => setDialog(null)} />}
        {dialog?.kind === 'edit' && (
          <UserFormModal user={dialog.user} onClose={() => setDialog(null)} />
        )}
        {dialog?.kind === 'reset' && (
          <ResetModal user={dialog.user} onClose={() => setDialog(null)} />
        )}
        {dialog?.kind === 'delete' && (
          <DeleteModal user={dialog.user} onClose={() => setDialog(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  return role === 'superadmin' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-mg-red-wash px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mg-red">
      <ShieldCheck className="h-3 w-3" /> Superadmin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-mg-wash px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mg-ink-soft">
      <UserIcon className="h-3 w-3" /> Vendeur
    </span>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-mg-mute transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        danger ? 'hover:bg-mg-red-wash hover:text-mg-red' : 'hover:bg-mg-wash hover:text-mg-ink'
      }`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────── Modals ─────────────────────────────── */

function Shell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-mg-ink/40 p-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 22, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 22, opacity: 0, scale: 0.98 }}
        transition={springSoft}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-mg-line bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-mg-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-mg-wash text-mg-ink hover:bg-mg-line"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function ErrorLine({ text }: { text: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-mg-red-wash px-3 py-2.5 text-sm text-mg-red-dark">
      <AlertCircle className="h-4 w-4 shrink-0" /> {text}
    </div>
  )
}

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard may be blocked on http — the value is visible anyway */
    }
  }
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Mot de passe temporaire"
        className="input flex-1 font-mono"
      />
      <button
        type="button"
        onClick={() => onChange(genPassword())}
        title="Générer"
        className="btn-ghost px-3"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button type="button" onClick={copy} title="Copier" className="btn-ghost px-3">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

function RolePicker({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['vendeur', 'superadmin'] as UserRole[]).map((r) => {
        const on = role === r
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
              on
                ? 'border-mg-red bg-mg-red-wash text-mg-red'
                : 'border-mg-line text-mg-ink-soft hover:text-mg-ink'
            }`}
          >
            {r === 'superadmin' ? <ShieldCheck className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            {r === 'superadmin' ? 'Superadmin' : 'Vendeur'}
          </button>
        )
      })}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 mt-4 block text-xs font-semibold uppercase tracking-wider text-mg-mute first:mt-0">
      {children}
    </label>
  )
}

function UserFormModal({ user, onClose }: { user?: SafeUser; onClose: () => void }) {
  const { createUser, updateUser } = useAuth()
  const editing = !!user
  const [username, setUsername] = useState(user?.username ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'vendeur')
  const [password, setPassword] = useState(editing ? '' : genPassword())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = editing
      ? await updateUser(user!.id, { displayName, role })
      : await createUser({ username, displayName, role, password })
    setBusy(false)
    if (res.ok) onClose()
    else setError(res.error || 'Opération impossible.')
  }

  return (
    <Shell title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={onClose}>
      <form onSubmit={submit}>
        <Label>Identifiant de connexion</Label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={editing}
          placeholder="ex. karim.b"
          autoComplete="off"
          className="input disabled:opacity-60"
        />
        <Label>Nom affiché</Label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="ex. Karim Benali"
          className="input"
        />
        <Label>Rôle</Label>
        <RolePicker role={role} onChange={setRole} />
        {!editing && (
          <>
            <Label>Mot de passe initial</Label>
            <PasswordField value={password} onChange={setPassword} />
            <p className="mt-1.5 text-[11px] text-mg-mute">
              Le vendeur devra le changer à sa première connexion. Communiquez-le-lui.
            </p>
          </>
        )}
        {error && <ErrorLine text={error} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </div>
      </form>
    </Shell>
  )
}

function ResetModal({ user, onClose }: { user: SafeUser; onClose: () => void }) {
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState(genPassword())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await resetPassword(user.id, password)
    setBusy(false)
    if (res.ok) onClose()
    else setError(res.error || 'Réinitialisation impossible.')
  }

  return (
    <Shell title="Réinitialiser le mot de passe" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="text-sm text-mg-ink-soft">
          Nouveau mot de passe temporaire pour <b className="text-mg-ink">{user.displayName}</b>{' '}
          (@{user.username}). Il devra le changer à sa prochaine connexion.
        </p>
        <div className="mt-4">
          <PasswordField value={password} onChange={setPassword} />
        </div>
        {error && <ErrorLine text={error} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réinitialiser'}
          </button>
        </div>
      </form>
    </Shell>
  )
}

function DeleteModal({ user, onClose }: { user: SafeUser; onClose: () => void }) {
  const { deleteUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const res = await deleteUser(user.id)
    setBusy(false)
    if (res.ok) onClose()
    else setError(res.error || 'Suppression impossible.')
  }

  return (
    <Shell title="Supprimer le compte" onClose={onClose}>
      <p className="text-sm text-mg-ink-soft">
        Supprimer définitivement le compte de <b className="text-mg-ink">{user.displayName}</b> (@
        {user.username})&nbsp;? Cette action est irréversible.
      </p>
      {error && <ErrorLine text={error} />}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-ghost">
          Annuler
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          className="btn bg-mg-red text-white hover:brightness-105"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Supprimer
        </button>
      </div>
    </Shell>
  )
}
