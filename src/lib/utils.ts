import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random neon color for token visualization
 */
export function generateNeonColor(): string {
  const neonColors = [
    '#00FFFF', // cyan
    '#B026FF', // purple
    '#FF10F0', // pink
    '#39FF14', // green
    '#4D4DFF', // blue
    '#FF6600', // orange
  ];
  return neonColors[Math.floor(Math.random() * neonColors.length)];
}

/**
 * Mask sensitive token string
 */
export function maskToken(token: string, visible: number = 4): string {
  if (token.length <= visible * 2) {
    return '*'.repeat(token.length);
  }
  const start = token.substring(0, visible);
  const end = token.substring(token.length - visible);
  const middle = '*'.repeat(token.length - (visible * 2));
  return `${start}${middle}${end}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculate time ago
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get status color based on token status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#39FF14'; // neon green
    case 'revoked':
      return '#FF0000'; // red
    case 'expired':
      return '#FF6600'; // orange
    case 'rotating':
      return '#00FFFF'; // cyan
    default:
      return '#4D4DFF'; // blue
  }
}

/**
 * Generate a random token string
 */
export function generateTokenString(prefix: string = 'sk'): string {
  const randomPart = Math.random().toString(36).substring(2, 34);
  return `${prefix}_${randomPart}`;
}

/**
 * Create neon style object for consistent styling
 */
export function createNeonStyle(
  color: string,
  options: {
    bgOpacity?: string;
    borderOpacity?: string;
    withGlow?: boolean;
  } = {}
) {
  const { bgOpacity = '10', borderOpacity = '20', withGlow = false } = options;
  
  return {
    backgroundColor: color + bgOpacity,
    color: color,
    border: `1px solid ${color}${borderOpacity}`,
    ...(withGlow && {
      boxShadow: `0 0 20px ${color}20`,
    }),
  };
}

/**
 * Validate if a string is not empty or null
 */
export function isValidString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
