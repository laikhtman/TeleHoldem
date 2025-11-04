import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useRef } from 'react';

// Chip denomination configurations with physics weights
export const CHIP_CONFIGS = {
  1: { 
    color: 'bg-white', 
    border: 'border-gray-400', 
    text: 'text-gray-900',
    weight: 1.0, // Lightweight
    symbol: '$1'
  },
  5: { 
    color: 'bg-red-600', 
    border: 'border-red-800', 
    text: 'text-white',
    weight: 1.1, // Standard weight
    symbol: '$5'
  },
  25: { 
    color: 'bg-green-600', 
    border: 'border-green-800', 
    text: 'text-white',
    weight: 1.2, // Heavier
    symbol: '$25'
  },
  100: { 
    color: 'bg-gray-900', 
    border: 'border-gray-700', 
    text: 'text-white',
    weight: 1.3, // Heaviest standard
    symbol: '$100'
  },
  500: { 
    color: 'bg-purple-600', 
    border: 'border-purple-800', 
    text: 'text-white',
    weight: 1.4, // Premium weight
    symbol: '★500'
  },
  1000: { 
    color: 'bg-yellow-500', 
    border: 'border-yellow-700', 
    text: 'text-gray-900',
    weight: 1.5, // Heaviest premium
    symbol: '♦1K'
  }
} as const;

interface ChipProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  denomination?: keyof typeof CHIP_CONFIGS;
  showValue?: boolean;
  physicsEnabled?: boolean;
}

export function Chip({ 
  className, 
  style, 
  size = 'md',
  denomination = 100,
  showValue = false,
  physicsEnabled = false
}: ChipProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = CHIP_CONFIGS[denomination] || CHIP_CONFIGS[100];
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-8 h-8 text-xs',
  };

  // Physics-based animation for enabled chips
  const physicsAnimation = physicsEnabled && !prefersReducedMotion ? {
    initial: { 
      opacity: 0, 
      scale: 0.5, 
      rotateY: -180,
      y: -50 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300 / config.weight, // Heavier chips move slower
        damping: 20 * config.weight,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.3
      }
    }
  } : {};

  const standardAnimation = !physicsEnabled ? {
    initial: prefersReducedMotion ? {} : { opacity: 0, scale: 0.5 },
    animate: prefersReducedMotion 
      ? { opacity: 1, scale: 1 } 
      : { opacity: [0, 1], scale: [0.5, 1] },
    exit: prefersReducedMotion ? {} : { opacity: 0, scale: 0.5 },
    transition: prefersReducedMotion 
      ? { duration: 0.01 } 
      : { duration: 0.3, ease: 'easeOut' }
  } : {};

  const animationProps = physicsEnabled ? physicsAnimation : standardAnimation;

  return (
    <motion.div
      className={cn(
        'rounded-full border-2 shadow-md chip-shine flex items-center justify-center font-bold',
        config.color,
        config.border,
        sizeClasses[size],
        className
      )}
      style={{
        ...style,
        transform: 'translateZ(0)' // Hardware acceleration
      }}
      {...animationProps}
    >
      {showValue && (
        <span className={config.text}>
          {denomination >= 500 ? config.symbol : ''}
        </span>
      )}
    </motion.div>
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

  const animateState = prefersReducedMotion ? { opacity: 1, transform: 'translateY(0) scale(1)' } : {
    opacity: 1,
    transform: [
      'translateY(0) scale(1) rotate(0deg)',
      'translateY(0) scale(1.01) rotate(1deg)',
      'translateY(0) scale(1) rotate(0deg)'
    ]
  };
  
  return (
    <div className={cn('relative', className)} data-testid="chip-stack">
      {Array.from({ length: displayCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-8 h-8 xs:w-9 xs:h-9 sm:w-6 sm:h-6 rounded-full border-2 shadow-lg chip-shine ${
            i % 3 === 0 ? 'bg-red-600 border-red-800' : i % 3 === 1 ? 'bg-blue-600 border-blue-800' : 'bg-yellow-500 border-yellow-700'
          }`}
          style={{
            top: `-${i * 3}px`,
            left: 0,
            zIndex: displayCount - i,
            transform: 'translateZ(0)' // Hardware acceleration
          }}
          initial={initialState}
          animate={animateState}
          transition={prefersReducedMotion ? transitionConfig(i) : { ...transitionConfig(i), repeat: 0, duration: 0.4 }}
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
