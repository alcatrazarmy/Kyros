/**
 * Shared component for neon-styled badges/tags
 */

import { ReactNode } from 'react';

/**
 * Props for NeonBadge component
 * 
 * @property children - Content to render inside the badge
 * @property color - Hex color code for neon effect (e.g., '#00FFFF')
 * @property bgOpacity - Opacity suffix for background (default: '15' = 15% opacity)
 * @property borderOpacity - Opacity suffix for border (default: '20' = 20% opacity)
 * @property className - Additional CSS classes
 * 
 * Note: Opacity values are appended to the hex color (e.g., '#00FFFF' + '15' = '#00FFFF15')
 */
interface NeonBadgeProps {
  children: ReactNode;
  color: string;
  bgOpacity?: string;
  borderOpacity?: string;
  className?: string;
}

export function NeonBadge({ 
  children, 
  color, 
  bgOpacity = '15',
  borderOpacity = '20',
  className = ''
}: NeonBadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded ${className}`}
      style={{
        backgroundColor: color + bgOpacity,
        color: color,
        border: `1px solid ${color}${borderOpacity}`,
      }}
    >
      {children}
    </span>
  );
}
