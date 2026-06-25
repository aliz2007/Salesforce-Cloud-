import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { DocMeta } from '../types'
import { CATEGORY_MAP } from '../data/categories'
import DocViewer from './DocViewer'

export default function Lightbox({
  doc,
  onClose,
}: {
  doc: DocMeta | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: CATEGORY_MAP[doc.category].from }}
              >
                {CATEGORY_MAP[doc.category].label}
                {doc.model ? ` · ${doc.model}` : ''}
              </div>
              <div className="truncate text-base font-semibold">{doc.title}</div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="min-h-0 flex-1 px-4 pb-6 sm:px-10"
          >
            <DocViewer doc={doc} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
