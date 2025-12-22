/**
 * Shared component for neon-styled containers
 * Used throughout the application for consistent neon theming
 */

import { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonContainerProps extends Omit<MotionProps, 'style'> {
  children: ReactNode;
  color: string;
  className?: string;
  opacity?: string;
  borderOpacity?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
}

export function NeonContainer({ 
  children, 
  color, 
  className = '',
  opacity = '10',
  borderOpacity = '20',
  glowIntensity = 'low',
  ...motionProps 
}: NeonContainerProps) {
  const glowSizes = {
    low: `0 0 10px ${color}${borderOpacity}`,
    medium: `0 0 20px ${color}${borderOpacity}`,
    high: `0 0 30px ${color}40, inset 0 0 20px ${color}10`,
  };

  return (
    <motion.div
      className={cn('rounded-lg bg-black/40 border', className)}
      style={{
        borderColor: color + borderOpacity,
        backgroundColor: color + opacity,
        boxShadow: glowSizes[glowIntensity],
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
