/**
 * Shared component for statistics cards
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
  delay?: number;
}

export function StatCard({ label, value, color, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-lg bg-black/40 border backdrop-blur-sm"
      style={{
        borderColor: color + '30',
        boxShadow: `0 0 20px ${color}10`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color }}>{icon}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </motion.div>
  );
}
