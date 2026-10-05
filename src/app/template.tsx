'use client'

import { motion } from 'framer-motion'

// Next.js re-mounts `template.tsx` on every navigation (unlike layout.tsx),
// which makes it the right place for a route-change animation: every page
// fades and slides in slightly on load without any per-page setup.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
