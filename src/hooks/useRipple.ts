/**
 * Custom hook for managing ripple effects on interactive elements
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
