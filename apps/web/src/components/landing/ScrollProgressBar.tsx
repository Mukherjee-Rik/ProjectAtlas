'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/** A hairline read-position indicator. Desktop only to keep mobile scroll 100% native. */
export function ScrollProgressBar() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 640);
  }, []);

  if (!isDesktop) return null;

  return <DesktopProgressBar />;
}

function DesktopProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px hidden sm:block">
      <motion.div className="h-full origin-left bg-primary/70" style={{ scaleX }} />
    </div>
  );
}
