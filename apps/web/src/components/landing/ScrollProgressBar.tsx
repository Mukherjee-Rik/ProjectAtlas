'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/** A hairline read-position indicator. One colour, no glow. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px">
      <motion.div className="h-full origin-left bg-primary/70" style={{ scaleX }} />
    </div>
  );
}
