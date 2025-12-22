/**
 * Custom hook for managing ripple effects on interactive elements
 * 
 * @param duration - Duration of the ripple animation in milliseconds (default: 600)
 * @returns Object with showRipple state and triggerRipple function
 * 
 * @example
 * const { showRipple, triggerRipple } = useRipple(600);
 * // Call triggerRipple() when action occurs
 * // Use showRipple to conditionally render ripple effect
 */

import { useState, useCallback } from 'react';

export function useRipple(duration: number = 600) {
  const [showRipple, setShowRipple] = useState(false);

  const triggerRipple = useCallback(() => {
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), duration);
  }, [duration]);

  return { showRipple, triggerRipple };
}
