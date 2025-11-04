import { useState, useEffect, useRef } from 'react';

/**
 * Optimized hook for animating numeric values using requestAnimationFrame
 * Replaces the framer-motion based useAnimatedCounter for better performance
 */
export function useRAFAnimatedCounter(
  targetValue: number,
  duration: number = 500,
  options: {
    easingFn?: (t: number) => number;
    formatFn?: (value: number) => number;
  } = {}
) {
  // Initialize with formatted target value to ensure correct initial display
  const formatFn = options.formatFn || Math.round;
  const [displayValue, setDisplayValue] = useState(formatFn(targetValue));
  const previousValueRef = useRef(targetValue);
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  
  // Default ease-out-quad function for smooth deceleration
  const easingFn = options.easingFn || ((t: number) => t * (2 - t));

  // Update display value immediately when targetValue changes (for synchronization)
  useEffect(() => {
    // On first mount, just set the display value directly
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      setDisplayValue(formatFn(targetValue));
      previousValueRef.current = targetValue;
      return;
    }

    // Skip animation if value hasn't changed, but still update display
    if (previousValueRef.current === targetValue) {
      setDisplayValue(formatFn(targetValue));
      return;
    }

    const startValue = previousValueRef.current;
    const difference = targetValue - startValue;
    
    // For very small changes, just update immediately
    if (Math.abs(difference) < 1) {
      setDisplayValue(formatFn(targetValue));
      previousValueRef.current = targetValue;
      return;
    }

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      
      const newValue = startValue + difference * easedProgress;
      setDisplayValue(formatFn(newValue));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end at exact target value
        setDisplayValue(formatFn(targetValue));
        previousValueRef.current = targetValue;
        rafRef.current = null;
      }
    };

    // Cancel any existing animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetValue, duration, easingFn, formatFn]);

  return displayValue;
}