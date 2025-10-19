import { useState, useCallback, useRef, useEffect } from 'react';

export function useShake(duration: number = 400) {
  const [isShaking, setIsShaking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsShaking(true);
    
    timeoutRef.current = setTimeout(() => {
      setIsShaking(false);
      timeoutRef.current = null;
    }, duration);
  }, [duration]);

  // Cleanup timeout on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isShaking, triggerShake };
}
