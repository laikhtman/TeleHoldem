import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Optimized hook for animating numeric values using requestAnimationFrame
 * Fixed to ensure pot always shows correct value and never shows stale $0
 */
export function useRAFAnimatedCounter(
  targetValue: number,
  duration: number = 500,
  options: {
    easingFn?: (t: number) => number;
    formatFn?: (value: number) => number;
    skipAnimation?: boolean; // Allow skipping animation for critical values
  } = {}
) {
  const formatFn = options.formatFn || Math.round;
  
  // CRITICAL FIX: Always initialize with the current target value to avoid showing 0
  const [displayValue, setDisplayValue] = useState(() => formatFn(targetValue));
  const animationStartValueRef = useRef(targetValue);
  const rafRef = useRef<number | null>(null);
  const lastTargetRef = useRef(targetValue);
  const isAnimatingRef = useRef(false);
  
  // Default ease-out-quad function for smooth deceleration
  const easingFn = options.easingFn || ((t: number) => t * (2 - t));

  // Cancel any ongoing animation
  const cancelAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      isAnimatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // CRITICAL FIX: If skipAnimation is true or we're dealing with critical initial values
    // Always show the exact value immediately without animation
    if (options.skipAnimation || (lastTargetRef.current === 0 && targetValue > 0)) {
      cancelAnimation();
      setDisplayValue(formatFn(targetValue));
      animationStartValueRef.current = targetValue;
      lastTargetRef.current = targetValue;
      
      // Log for debugging
      if (targetValue > 0) {
        console.log('[PotDisplay] Immediate update (no animation):', targetValue);
      }
      return;
    }

    // If value hasn't changed, ensure display is correct
    if (lastTargetRef.current === targetValue) {
      // Still update display to ensure synchronization
      setDisplayValue(formatFn(targetValue));
      return;
    }

    // For initial non-zero values, show immediately
    if (animationStartValueRef.current === 0 && targetValue > 0) {
      console.log('[PotDisplay] Initial non-zero value, showing immediately:', targetValue);
      setDisplayValue(formatFn(targetValue));
      animationStartValueRef.current = targetValue;
      lastTargetRef.current = targetValue;
      return;
    }

    const startValue = isAnimatingRef.current ? displayValue : animationStartValueRef.current;
    const difference = targetValue - startValue;
    
    // For very small changes or going to zero, update immediately
    if (Math.abs(difference) < 1 || targetValue === 0) {
      cancelAnimation();
      setDisplayValue(formatFn(targetValue));
      animationStartValueRef.current = targetValue;
      lastTargetRef.current = targetValue;
      console.log('[PotDisplay] Small change or zero, immediate update:', targetValue);
      return;
    }

    // Log animation start
    console.log('[PotDisplay] Starting animation from', startValue, 'to', targetValue);

    cancelAnimation();
    isAnimatingRef.current = true;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      
      const newValue = startValue + difference * easedProgress;
      const formattedValue = formatFn(newValue);
      
      // Ensure we never show 0 when target is non-zero
      const displayVal = targetValue > 0 && formattedValue === 0 ? formatFn(targetValue) : formattedValue;
      setDisplayValue(displayVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - ensure exact target value
        console.log('[PotDisplay] Animation complete, final value:', targetValue);
        setDisplayValue(formatFn(targetValue));
        animationStartValueRef.current = targetValue;
        lastTargetRef.current = targetValue;
        rafRef.current = null;
        isAnimatingRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimation();
    };
  }, [targetValue, duration, easingFn, formatFn, cancelAnimation, displayValue, options.skipAnimation]);

  // CRITICAL: Always return the correct value, never 0 when target is non-zero
  const safeDisplayValue = targetValue > 0 && displayValue === 0 ? formatFn(targetValue) : displayValue;
  
  return safeDisplayValue;
}