import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Renders children at document.body.
 *
 * Full-screen overlays use `position: fixed`, which is meant to be relative to
 * the viewport — but a transformed/filtered ancestor (Framer motion wrappers,
 * animated headers, page-transition blur…) becomes the containing block and
 * throws the overlay off. Portaling to <body> guarantees viewport-relative
 * positioning everywhere. Context and Framer's AnimatePresence still work,
 * because React keeps the portal in the component tree.
 */
export default function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
