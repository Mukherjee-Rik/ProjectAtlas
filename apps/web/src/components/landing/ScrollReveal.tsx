'use client';

import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

/**
 * Entrance motion for the marketing page.
 *
 * Deliberately plain: a short rise and a fade, nothing else. Blur and scale on
 * entrance make a page feel like it is performing for you, and they cost a
 * compositor pass on every card in a grid.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const;

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Rise distance in px. Larger blocks read better with a little more travel. */
  distance?: number;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  distance = 12,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: (staggerDelay: number = 0.06) => ({
    transition: { staggerChildren: staggerDelay },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

interface ScrollStaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function ScrollStagger({
  children,
  className = '',
  staggerDelay = 0.06,
}: ScrollStaggerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      custom={staggerDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
