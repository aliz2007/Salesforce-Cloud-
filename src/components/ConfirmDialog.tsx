import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-mg-ink p-6 text-center"
          >
            <div
              className={clsx(
                'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl',
                danger ? 'bg-mg-red/15 text-mg-red' : 'bg-white/[0.06] text-white',
              )}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-mg-mute">{message}</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => !busy && onCancel()} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={handle}
                disabled={busy}
                className={clsx('btn flex-1 text-white', danger ? 'bg-mg-red hover:brightness-110' : 'bg-mg-grad')}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
