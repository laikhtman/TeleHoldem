import { useEffect, useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  minSwipeDistance?: number; // Minimum distance in pixels to register as a swipe
  maxSwipeTime?: number; // Maximum time in ms for the gesture to be considered a swipe
  preventDefault?: boolean;
  disabled?: boolean;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefault = true,
    disabled = false
  } = config;

  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      if (preventDefault) e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      
      // Show visual feedback during swipe
      if (Math.abs(deltaX) > 20) {
        setIsSwipingLeft(deltaX < 0);
        setIsSwipingRight(deltaX > 0);
      }
      
      if (preventDefault) e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Reset visual feedback
      setIsSwipingLeft(false);
      setIsSwipingRight(false);

      // Check if it's a valid swipe (not too slow, mostly horizontal)
      if (deltaTime < maxSwipeTime && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDistance && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < -minSwipeDistance && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else if (deltaTime < maxSwipeTime && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > minSwipeDistance && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < -minSwipeDistance && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }

      touchStartRef.current = null;
      if (preventDefault) e.preventDefault();
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, minSwipeDistance, maxSwipeTime, preventDefault, disabled]);

  return {
    ref: elementRef,
    isSwipingLeft,
    isSwipingRight
  };
}