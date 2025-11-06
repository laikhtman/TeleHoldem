import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Chip } from '@/components/Chip';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';

interface DraggableChipProps {
  value: number;
  onDrop?: (value: number, isAllIn?: boolean) => void;
  disabled?: boolean;
  className?: string;
  soundVolume?: number;
  maxChips?: number;
}

export function DraggableChip({ value, onDrop, disabled = false, className = '', soundVolume = 0.5, maxChips = 1000 }: DraggableChipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Scale chip when dragging
  const scale = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      return isDragging ? 1.2 : (distance > 10 ? 1.05 : 1);
    }
  );

  // Rotation based on drag direction
  const rotate = useTransform(x, [-100, 100], [-10, 10]);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasBeenDragged(true);
    triggerHaptic('light');
    playSound('chip-collect', { volume: soundVolume * 0.3 });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Check if chip was dragged far enough to trigger a bet
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    
    if (dragDistance > 100 && onDrop) {
      // Check if dragged towards the center of the screen (pot area)
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      // Get chip's current position
      const chipRect = (event.target as HTMLElement).getBoundingClientRect();
      const chipCenterX = chipRect.left + chipRect.width / 2;
      const chipCenterY = chipRect.top + chipRect.height / 2;
      
      // Calculate if chip is closer to center than its starting position
      const distanceToCenter = Math.sqrt(
        (chipCenterX - screenCenterX) ** 2 + 
        (chipCenterY - screenCenterY) ** 2
      );
      
      const originalDistanceToCenter = Math.sqrt(
        ((chipCenterX - info.offset.x) - screenCenterX) ** 2 + 
        ((chipCenterY - info.offset.y) - screenCenterY) ** 2
      );
      
      if (distanceToCenter < originalDistanceToCenter) {
        // Determine if this is an all-in based on drag distance and value
        const isAllIn = value === maxChips || dragDistance > 200;
        
        onDrop(value, isAllIn);
        
        // Different haptic/sound for all-in
        if (isAllIn) {
          triggerHaptic('heavy');
          playSound('raise', { volume: soundVolume * 0.45 });
          setTimeout(() => {
            playSound('chip-stack', { volume: soundVolume * 0.4 });
          }, 200);
        } else {
          triggerHaptic('medium');
          playSound('chip-place', { volume: soundVolume * 0.35 });
        }
      } else {
        // Snap back
        triggerHaptic('light');
        playSound('button-click', { volume: soundVolume * 0.15 });
      }
    } else if (dragDistance <= 100) {
      // Not dragged far enough
      triggerHaptic('light');
      playSound('button-click', { volume: soundVolume * 0.1 });
    }
  };

  // Get chip color based on value - crypto theme with denomination-based colors
  const getChipColor = (amount: number) => {
    if (amount >= 100) return 'bg-gradient-to-br from-poker-chipGold to-amber-600 text-black';
    if (amount >= 50) return 'bg-gradient-to-br from-purple-600 to-pink-600 text-white';
    if (amount >= 25) return 'bg-gradient-to-br from-purple-500 to-purple-700 text-white';
    if (amount >= 10) return 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white';
    return 'bg-gradient-to-br from-gray-600 to-gray-800 text-white';
  };
  
  // Get chip border and glow based on value
  const getChipBorderAndGlow = (amount: number) => {
    if (amount >= 100) return 'border-poker-chipGold shadow-gold-glow';
    if (amount >= 50) return 'border-purple-500 shadow-purple-glow';
    if (amount >= 25) return 'border-purple-400 shadow-purple-glow-sm';
    if (amount >= 10) return 'border-cyan-500 shadow-cyan-glow';
    return 'border-gray-500';
  };

  return (
    <div ref={constraintsRef} className="relative min-w-[48px] min-h-[48px]">
      <motion.div
        drag={!disabled}
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        dragMomentum={false}
        whileDrag={{ cursor: 'grabbing' }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, y, scale, rotate }}
        animate={{
          x: hasBeenDragged && !isDragging ? 0 : x.get(),
          y: hasBeenDragged && !isDragging ? 0 : y.get(),
        }}
        className={`min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation relative ${disabled ? 'opacity-50' : 'cursor-grab'} ${className}`}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300
        }}
      >
        <div className={`relative ${isDragging ? 'shadow-2xl' : 'shadow-lg'} transition-shadow`}>
          {/* Custom chip with value display */}
          <div className={`w-16 h-16 rounded-full ${getChipColor(value)} border-2 ${getChipBorderAndGlow(value)} chip-shine flex items-center justify-center font-bold text-sm ${isDragging ? 'scale-110' : ''} transition-all duration-300`}>
            ${value}
          </div>
          
          {/* Use regular Chip as decoration */}
          <div className="absolute top-0 right-0">
            <Chip size="sm" className="opacity-80" />
          </div>
        </div>
        
        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulse" />
        )}
      </motion.div>
      
      {/* Drag hint on first interaction */}
      {!hasBeenDragged && !disabled && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
          Drag to bet
        </div>
      )}
    </div>
  );
}