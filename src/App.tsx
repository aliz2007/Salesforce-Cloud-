import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider, useStore } from './context/StoreContext'
import Login from './components/auth/Login'
import ChangePasswordGate from './components/auth/ChangePasswordGate'
import Hub, { type HubDest } from './components/Hub'
import MarketingDashboard from './components/MarketingDashboard'
import SalesBrowser from './components/SalesBrowser'
import SalesMode from './components/SalesMode'
import AccountManager from './components/AccountManager'
import TcoSimulator from './components/TcoSimulator'
import { MgBadge } from './components/Brand'
import { EASE } from './motion'

const fade = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(4px)' },
  transition: { duration: 0.4, ease: EASE },
}

/* ── Top-level gate: splash → login → (first-login) change password → app ── */
function AuthGate() {
  const { ready, user } = useAuth()

  let key = 'splash'
  let node = <Splash />
  if (ready && !user) {
    key = 'login'
    node = <Login />
  } else if (ready && user?.mustChangePassword) {
    key = 'change'
    node = <ChangePasswordGate />
  } else if (ready && user) {
    key = 'app'
    node = (
      <StoreProvider>
        <AuthedApp role={user.role} />
      </StoreProvider>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={key} {...fade}>
        {node}
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Role-based routing once signed in ── */
function AuthedApp({ role }: { role: 'superadmin' | 'vendeur' }) {
  const { ready } = useStore()
  if (!ready) return <Splash />
  return role === 'superadmin' ? <AdminRouter /> : <VendeurRouter />
}

function AdminRouter() {
  const [view, setView] = useState<'hub' | HubDest | 'sales'>('hub')

  return (
    <AnimatePresence mode="wait">
      {view === 'hub' && (
        <motion.div key="hub" {...fade}>
          <Hub onNavigate={(d) => setView(d)} />
        </motion.div>
      )}
      {view === 'marketing' && (
        <motion.div key="marketing" {...fade}>
          <MarketingDashboard onExit={() => setView('hub')} />
        </motion.div>
      )}
      {view === 'vendeur' && (
        <motion.div key="vendeur" {...fade}>
          <SalesBrowser onExit={() => setView('hub')} onLaunch={() => setView('sales')} />
        </motion.div>
      )}
      {view === 'accounts' && (
        <motion.div key="accounts" {...fade}>
          <AccountManager onExit={() => setView('hub')} />
        </motion.div>
      )}
      {view === 'tco' && (
        <motion.div key="tco" {...fade}>
          <TcoSimulator onExit={() => setView('hub')} />
        </motion.div>
      )}
      {view === 'sales' && <SalesMode key="sales" onExit={() => setView('vendeur')} />}
    </AnimatePresence>
  )
}

function VendeurRouter() {
  const { logout } = useAuth()
  const [view, setView] = useState<'browser' | 'sales'>('browser')

  return (
    <AnimatePresence mode="wait">
      {view === 'browser' && (
        <motion.div key="browser" {...fade}>
          <SalesBrowser account onExit={() => logout()} onLaunch={() => setView('sales')} />
        </motion.div>
      )}
      {view === 'sales' && <SalesMode key="sales" onExit={() => setView('browser')} />}
    </AnimatePresence>
  )
}

function Splash() {
  const reduce = useReducedMotion()
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mg-base">
      {/* Ambient glow */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mg-red/15 blur-[120px] ${
          reduce ? '' : 'animate-pulse-glow'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative flex flex-col items-center gap-5"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Orbiting / spinning ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-mg-red border-r-mg-red/40"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
          {/* Soft pulsing halo */}
          <motion.div
            aria-hidden
            className="absolute inset-1.5 rounded-full bg-mg-red/5"
            animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Floating badge */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MgBadge size={56} />
          </motion.div>
        </div>

        <div
          className={`overline bg-gradient-to-r from-mg-red via-mg-red-light to-mg-red bg-clip-text text-mg-red text-transparent [background-size:200%_auto] ${
            reduce ? '' : 'animate-gradient-pan'
          }`}
        >
          Animés par la passion
        </div>

        {/* Shimmering progress hint */}
        <div className="relative h-1 w-32 overflow-hidden rounded-full bg-mg-line">
          {reduce ? (
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-mg-grad" />
          ) : (
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-mg-grad"
              animate={{ x: ['-110%', '230%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
