'use client'

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'

/**
 * Small, shared animation primitives built on framer-motion.
 * Keep these generic (no page-specific logic) so any component can reuse them.
 */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } },
}

/** Fades + slides an element up once, when it scrolls into view. */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  ...rest
}: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Wraps a list so its children stagger in one after another as they enter view. */
export function StaggerGroup({
  children,
  className,
  stagger = 0.06,
  ...rest
}: HTMLMotionProps<'div'> & { stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** A single item inside a StaggerGroup. */
export function StaggerItem({ children, className, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div className={className} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  )
}

/** A tactile wrapper for clickable cards: lifts on hover, presses on tap. */
export function TiltCard({ children, className, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
