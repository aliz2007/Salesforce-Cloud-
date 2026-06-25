import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StoreProvider, useStore } from './context/StoreContext'
import type { Role } from './types'
import Landing from './components/Landing'
import MarketingDashboard from './components/MarketingDashboard'
import SalesBrowser from './components/SalesBrowser'
import SalesMode from './components/SalesMode'
import { MgBadge } from './components/Brand'

type View = 'landing' | 'marketing' | 'vendeur' | 'sales'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

function Shell() {
  const { ready } = useStore()
  const [view, setView] = useState<View>('landing')

  if (!ready) return <Splash />

  const pick = (role: Role) => setView(role)

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <motion.div key="landing" {...fade}>
          <Landing onPick={pick} />
        </motion.div>
      )}

      {view === 'marketing' && (
        <motion.div key="marketing" {...fade}>
          <MarketingDashboard onExit={() => setView('landing')} />
        </motion.div>
      )}

      {view === 'vendeur' && (
        <motion.div key="vendeur" {...fade}>
          <SalesBrowser
            onExit={() => setView('landing')}
            onLaunch={() => setView('sales')}
          />
        </motion.div>
      )}

      {view === 'sales' && (
        <SalesMode key="sales" onExit={() => setView('vendeur')} />
      )}
    </AnimatePresence>
  )
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mg-base">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MgBadge size={56} />
        </motion.div>
        <div className="overline">Animés par la passion</div>
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
