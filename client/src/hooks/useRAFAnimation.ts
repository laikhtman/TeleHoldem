import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for requestAnimationFrame-based animations
 * Provides smooth 60fps animations with automatic cleanup
 */
export function useRAFAnimation(callback: (timestamp: number) => void, isActive: boolean = true) {
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    callback(timestamp - startTimeRef.current);
    
    if (isActive) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [callback, isActive]);

  useEffect(() => {
    if (isActive) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startTimeRef.current = null;
      }
    };
  }, [animate, isActive]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startTimeRef.current = null;
    }
  }, []);

  return { stop };
}

/**
 * Hook for animating numeric values using RAF for smooth transitions
 */
export function useRAFCounter(
  targetValue: number, 
  duration: number = 500,
  options: { 
    easingFn?: (t: number) => number;
    onComplete?: () => void;
  } = {}
) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const previousValueRef = useRef(targetValue);
  const animationRef = useRef<number | null>(null);
  
  const easingFn = options.easingFn || ((t: number) => t * (2 - t)); // Default ease-out

  useEffect(() => {
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
      setCurrentValue(Math.round(newValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = targetValue;
        if (options.onComplete) {
          options.onComplete();
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easingFn, options]);

  return currentValue;
}

import { useState, useRef } from 'react';

/**
 * Hook for animating timer countdown using RAF
 */
export function useRAFTimer(duration: number, onComplete?: () => void) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  const start = useCallback(() => {
    isActiveRef.current = true;
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(currentProgress);

      if (currentProgress < 100 && isActiveRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (currentProgress >= 100) {
        isActiveRef.current = false;
        if (onComplete) onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [duration, onComplete]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
    startTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { progress, start, stop, reset };
}

/**
 * Hook for smooth chip animations using RAF
 */
export function useRAFChipAnimation(
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  duration: number = 800
) {
  const [position, setPosition] = useState(startPos);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback((onComplete?: () => void) => {
    setIsAnimating(true);
    let startTime: number | null = null;

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth arc
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      // Calculate arc trajectory
      const x = startPos.x + (endPos.x - startPos.x) * easedProgress;
      const y = startPos.y + (endPos.y - startPos.y) * easedProgress;
      
      // Add arc height
      const arcHeight = 100;
      const arcProgress = Math.sin(progress * Math.PI);
      const arcY = y - (arcHeight * arcProgress);

      setPosition({ x, y: arcY });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animateFrame);
      } else {
        setIsAnimating(false);
        if (onComplete) onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(animateFrame);
  }, [startPos, endPos, duration]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { position, isAnimating, animate, stop };
}