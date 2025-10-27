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
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValueRef = useRef(targetValue);
  const rafRef = useRef<number | null>(null);
  
  // Default ease-out-quad function for smooth deceleration
  const easingFn = options.easingFn || ((t: number) => t * (2 - t));
  const formatFn = options.formatFn || Math.round;

  useEffect(() => {
    // Skip if value hasn't changed
    if (previousValueRef.current === targetValue) return;

    const startValue = previousValueRef.current;
    const difference = targetValue - startValue;
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