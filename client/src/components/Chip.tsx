import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useEffect } from 'react';

interface ChipProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

export function Chip({ className, style, size = 'md' }: ChipProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={cn(
        'rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-md chip-shine',
        sizeClasses[size],
        className
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
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

  // Calculate arc trajectory with more dramatic curve
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 150; // Higher arc peak for more dramatic effect

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  useEffect(() => {
    // Play chip placement sound when animation starts
    const timer = setTimeout(() => {
      playSound('chip-place', { volume: 0.2 });
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [delay, playSound]);

  const handleAnimationComplete = () => {
    playSound('chip-stack', { volume: 0.15 });
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <motion.div
      className={cn(
        'absolute rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-lg chip-shine z-50',
        sizeClasses[size]
      )}
      initial={{ 
        x: startX, 
        y: startY,
        opacity: 1,
        scale: 1
      }}
      animate={{ 
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        opacity: [1, 1, 0.9],
        scale: [1, 1.2, 0.95],
        rotate: [0, 360, 720]
      }}
      transition={{ 
        duration: 0.8,
        delay,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.4, 1]
      }}
      onAnimationComplete={handleAnimationComplete}
      data-testid="flying-chip"
    />
  );
}

interface ChipStackProps {
  count: number;
  className?: string;
}

export function ChipStack({ count, className }: ChipStackProps) {
  const displayCount = Math.min(count, 5);
  
  return (
    <div className={cn('relative', className)} data-testid="chip-stack">
      {Array.from({ length: displayCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-6 h-6 rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-md chip-shine"
          style={{
            top: `-${i * 2}px`,
            left: 0,
            zIndex: displayCount - i
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
      {count > 5 && (
        <div className="absolute -top-2 -right-2 bg-black/70 text-poker-chipGold text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-poker-chipGold">
          {count}
        </div>
      )}
    </div>
  );
}
