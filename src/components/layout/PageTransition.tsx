'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

const variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Fade-only variant for simpler transitions
export function FadeTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Scale-in variant for modals/overlays
export function ScaleTransition({ children, isVisible }: { children: ReactNode; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Slide-up variant for bottom sheets/drawers
export function SlideUpTransition({ children, isVisible }: { children: ReactNode; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
