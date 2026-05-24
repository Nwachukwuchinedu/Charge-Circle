'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

const directionVariants = {
  up: { y: 40 },
  left: { x: -40 },
  right: { x: 40 },
};

export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...directionVariants[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
