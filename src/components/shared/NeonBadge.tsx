/**
 * Shared component for neon-styled badges/tags
 */

import { ReactNode } from 'react';

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
