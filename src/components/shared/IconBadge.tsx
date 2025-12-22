/**
 * Shared component for icon badges with neon styling
 */

import { ReactNode } from 'react';

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
