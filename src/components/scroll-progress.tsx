'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/** A quiet, accessible reading-position indicator for long ChefMate pages. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.25 })

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-accent shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_60%,transparent)]"
      style={{ scaleX }}
    />
  )
}
