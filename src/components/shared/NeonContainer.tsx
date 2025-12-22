/**
 * Shared component for neon-styled containers
 * Used throughout the application for consistent neon theming
 */

import { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Props for NeonContainer component
 * 
 * Note: 'style' is omitted from MotionProps because the component manages
 * styling internally through color props to ensure consistent neon theming.
 * Additional motion props like animations, transitions, etc. are still supported.
 * 
 * @property children - Content to render inside the container
 * @property color - Hex color code for neon effect (e.g., '#00FFFF')
 * @property className - Additional CSS classes
 * @property opacity - Opacity suffix for background color (e.g., '10' for 10% opacity)
 * @property borderOpacity - Opacity suffix for border color (e.g., '20' for 20% opacity)
 * @property glowIntensity - Intensity of the glow effect
 */
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
