import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { SafeUser, UserRole } from '../types'

/**
 * Authentication against the intranet backend. All credential checking and
 * hashing happens server-side; the browser only holds a `SafeUser` (no
 * secrets) and relies on an httpOnly session cookie.
 */
interface AuthValue {
  ready: boolean
  user: SafeUser | null
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  changeOwnPassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>

  // ── Account management (superadmin) ──
  users: SafeUser[]
  refreshUsers: () => Promise<void>
  createUser: (input: {
    username: string
    displayName: string
    role: UserRole
    password: string
  }) => Promise<{ ok: boolean; error?: string }>
  updateUser: (
    id: string,
    patch: { displayName?: string; role?: UserRole },
  ) => Promise<{ ok: boolean; error?: string }>
  resetPassword: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>
  deleteUser: (id: string) => Promise<{ ok: boolean; error?: string }>
}

const Ctx = createContext<AuthValue | null>(null)

async function api(url: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    ...opts,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || `Erreur serveur (${res.status})`)
  return body
}

/** Wrap an async call into a { ok, error } result so the UI never throws. */
async function guard(fn: () => Promise<void>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<SafeUser | null>(null)
  const [users, setUsers] = useState<SafeUser[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { user } = await api('/api/auth/me')
        if (active) setUser(user)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    return guard(async () => {
      const { user } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setUser(user)
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setUsers([])
    }
  }, [])

  const changeOwnPassword = useCallback(async (newPassword: string) => {
    return guard(async () => {
      const { user } = await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      })
      setUser(user)
    })
  }, [])

  const refreshUsers = useCallback(async () => {
    const { users } = await api('/api/users')
    setUsers(users)
  }, [])

  const createUser = useCallback<AuthValue['createUser']>(
    (input) =>
      guard(async () => {
        await api('/api/users', { method: 'POST', body: JSON.stringify(input) })
        await refreshUsers()
      }),
    [refreshUsers],
  )

  const updateUser = useCallback<AuthValue['updateUser']>(
    (id, patch) =>
      guard(async () => {
        await api(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
        await refreshUsers()
      }),
    [refreshUsers],
  )

  const resetPassword = useCallback<AuthValue['resetPassword']>(
    (id, password) =>
      guard(async () => {
        await api(`/api/users/${id}/reset-password`, {
          method: 'POST',
          body: JSON.stringify({ password }),
        })
        await refreshUsers()
      }),
    [refreshUsers],
  )

  const deleteUser = useCallback<AuthValue['deleteUser']>(
    (id) =>
      guard(async () => {
        await api(`/api/users/${id}`, { method: 'DELETE' })
        await refreshUsers()
      }),
    [refreshUsers],
  )

  const value: AuthValue = {
    ready,
    user,
    login,
    logout,
    changeOwnPassword,
    users,
    refreshUsers,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
