import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import Portal from './Portal'

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
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-mg-ink/40 px-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-mg-line bg-white p-6 text-center shadow-2xl"
          >
            <div
              className={clsx(
                'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl',
                danger ? 'bg-mg-red-wash text-mg-red' : 'bg-mg-wash text-mg-ink',
              )}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-mg-ink">{title}</h3>
            <p className="mt-1.5 text-sm text-mg-ink-soft">{message}</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => !busy && onCancel()} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={handle}
                disabled={busy}
                className={clsx('btn flex-1 text-white', danger ? 'bg-mg-red hover:brightness-105' : 'bg-mg-grad')}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  )
}
