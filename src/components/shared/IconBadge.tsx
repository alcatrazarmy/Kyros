/**
 * Shared component for icon badges with neon styling
 */

import { ReactNode } from 'react';

/**
 * Props for IconBadge component
 * 
 * @property icon - Icon element to display inside the badge
 * @property color - Hex color code for the icon color (e.g., '#00FFFF')
 * @property opacity - Opacity suffix for background (default: '10' = 10% opacity)
 * 
 * Note: Opacity is appended to the hex color (e.g., '#00FFFF' + '10' = '#00FFFF10')
 */
interface IconBadgeProps {
  icon: ReactNode;
  color: string;
  opacity?: string;
}

export function IconBadge({ icon, color, opacity = '10' }: IconBadgeProps) {
  return (
    <div 
      className="p-2 rounded-lg"
      style={{
        backgroundColor: color + opacity,
        color: color,
      }}
    >
      {icon}
    </div>
  );
}
