import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useRef } from 'react';

interface ChipProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

export function Chip({ className, style, size = 'md' }: ChipProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const animationConfig = prefersReducedMotion
    ? { opacity: 1, transform: 'scale(1)' }
    : { opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] };

  const transitionConfig = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.3, ease: 'easeOut' };

  return (
    <motion.div
      className={cn(
        'rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-md chip-shine',
        sizeClasses[size],
        className
      )}
      style={{
        ...style,
        transform: 'translateZ(0)' // Hardware acceleration
      }}
      initial={prefersReducedMotion ? {} : { opacity: 0, transform: 'scale(0.5)' }}
      animate={animationConfig}
      exit={prefersReducedMotion ? {} : { opacity: 0, transform: 'scale(0.5)' }}
      transition={transitionConfig}
    />
  );
}

interface FlyingChipProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay?: number;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function FlyingChip({ 
  startX, 
  startY, 
  endX, 
  endY, 
  delay = 0,
  onComplete,
  size = 'sm'
}: FlyingChipProps) {
  const { playSound } = useSound();
  const prefersReducedMotion = useReducedMotion();
  const chipRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef({ willChange: false });

  // Calculate arc trajectory with more dramatic curve
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 150; // Higher arc peak for more dramatic effect

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Handle will-change for performance
  useEffect(() => {
    if (!prefersReducedMotion && chipRef.current) {
      // Set will-change before animation
      chipRef.current.style.willChange = 'transform, opacity';
      animationStateRef.current.willChange = true;
      
      // Remove will-change after animation completes
      const timer = setTimeout(() => {
        if (chipRef.current && animationStateRef.current.willChange) {
          chipRef.current.style.willChange = 'auto';
          animationStateRef.current.willChange = false;
        }
      }, (delay + 0.8) * 1000); // Animation duration + delay
      
      return () => {
        clearTimeout(timer);
        if (chipRef.current && animationStateRef.current.willChange) {
          chipRef.current.style.willChange = 'auto';
          animationStateRef.current.willChange = false;
        }
      };
    }
  }, [delay, prefersReducedMotion]);

  useEffect(() => {
    // Play chip placement sound when animation starts
    const timer = setTimeout(() => {
      if (!prefersReducedMotion) {
        playSound('chip-place', { volume: 0.2 });
      }
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [delay, playSound, prefersReducedMotion]);

  const handleAnimationComplete = () => {
    if (!prefersReducedMotion) {
      playSound('chip-stack', { volume: 0.15 });
    }
    if (onComplete) {
      onComplete();
    }
  };

  if (prefersReducedMotion) {
    // Instant movement for reduced motion
    return (
      <motion.div
        ref={chipRef}
        className={cn(
          'absolute rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-lg chip-shine z-50',
          sizeClasses[size]
        )}
        initial={{ 
          transform: `translate(${endX}px, ${endY}px) scale(0.95)`,
          opacity: 0.9
        }}
        animate={{ 
          transform: `translate(${endX}px, ${endY}px) scale(0.95)`,
          opacity: 0.9
        }}
        transition={{ duration: 0.01 }}
        onAnimationComplete={handleAnimationComplete}
        data-testid="flying-chip"
        style={{
          transform: 'translateZ(0)' // Hardware acceleration
        }}
      />
    );
  }

  // Full animation for normal motion preference
  return (
    <motion.div
      ref={chipRef}
      className={cn(
        'absolute rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-lg chip-shine z-50',
        sizeClasses[size]
      )}
      initial={{ 
        transform: `translate(${startX}px, ${startY}px) scale(1) rotate(0deg)`,
        opacity: 1
      }}
      animate={{ 
        transform: [
          `translate(${startX}px, ${startY}px) scale(1) rotate(0deg)`,
          `translate(${midX}px, ${midY}px) scale(1.2) rotate(360deg)`,
          `translate(${endX}px, ${endY}px) scale(0.95) rotate(720deg)`
        ],
        opacity: [1, 1, 0.9]
      }}
      transition={{ 
        duration: 0.8,
        delay,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.4, 1]
      }}
      onAnimationComplete={handleAnimationComplete}
      data-testid="flying-chip"
      style={{
        transform: 'translateZ(0)' // Hardware acceleration
      }}
    />
  );
}

interface ChipStackProps {
  count: number;
  className?: string;
}

export function ChipStack({ count, className }: ChipStackProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayCount = Math.min(count, 5);
  
  // Stagger animations for better performance (max 5 chips)
  const getAnimationDelay = (index: number) => {
    if (prefersReducedMotion) return 0;
    return index * 0.08; // Stagger by 80ms
  };

  const transitionConfig = (index: number) => prefersReducedMotion
    ? { duration: 0.01 }
    : { 
        delay: getAnimationDelay(index), 
        type: "spring", 
        stiffness: 300,
        damping: 20
      };

  const initialState = prefersReducedMotion
    ? { opacity: 1, transform: 'translateY(0) scale(1)' }
    : { opacity: 0, transform: 'translateY(20px) scale(0.8)' };

  const animateState = { 
    opacity: 1, 
    transform: 'translateY(0) scale(1)' 
  };
  
  return (
    <div className={cn('relative', className)} data-testid="chip-stack">
      {Array.from({ length: displayCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 xs:w-9 xs:h-9 sm:w-6 sm:h-6 rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-lg chip-shine"
          style={{
            top: `-${i * 3}px`,
            left: 0,
            zIndex: displayCount - i,
            transform: 'translateZ(0)' // Hardware acceleration
          }}
          initial={initialState}
          animate={animateState}
          transition={transitionConfig(i)}
        />
      ))}
      {count > 5 && (
        <motion.div 
          className="absolute -top-3 -right-3 bg-black/80 text-poker-chipGold text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-poker-chipGold shadow-lg"
          initial={prefersReducedMotion ? { transform: 'scale(1)' } : { transform: 'scale(0)' }}
          animate={{ transform: 'scale(1)' }}
          transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 400, delay: 0.3 }}
        >
          {count}
        </motion.div>
      )}
    </div>
  );
}