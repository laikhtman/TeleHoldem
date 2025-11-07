import { Button, ButtonProps } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSound } from '@/hooks/useSound';
import { useMagneticEffect, Ripple } from './AnimationEffects';

interface AnimatedButtonProps extends ButtonProps {
  rippleColor?: string;
  enableRipple?: boolean;
  enableMagnetic?: boolean;
  enableShimmer?: boolean;
  enableGlowPulse?: boolean;
  soundOnClick?: boolean;
}

interface RippleType {
  x: number;
  y: number;
  id: string;
  color: string;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    children, 
    className = '', 
    onClick,
    rippleColor = '#8B5CF6',
    enableRipple = true,
    enableMagnetic = false,
    enableShimmer = false,
    enableGlowPulse = false,
    soundOnClick = true,
    variant = 'default',
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<RippleType[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const { playSound } = useSound();
    
    // Apply magnetic effect if enabled
    if (enableMagnetic && !prefersReducedMotion) {
      useMagneticEffect(buttonRef, 0.3);
    }
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Play sound
      if (soundOnClick && !prefersReducedMotion) {
        playSound('button-click', { volume: 0.15 });
      }
      
      // Create ripple effect
      if (enableRipple && !prefersReducedMotion) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now().toString();
        
        // Determine ripple color based on variant
        let color = rippleColor;
        if (variant === 'destructive') color = '#EF4444';
        else if (variant === 'ghost') color = '#06B6D4';
        else if (variant === 'secondary') color = '#EC4899';
        
        setRipples(prev => [...prev, { x, y, id, color }]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);
      }
      
      // Call original onClick
      onClick?.(e);
    };
    
    const animationClasses = cn(
      !prefersReducedMotion && 'button-press transition-transform',
      enableShimmer && !prefersReducedMotion && 'shimmer-button',
      enableGlowPulse && !prefersReducedMotion && 'button-glow-pulse',
      enableMagnetic && !prefersReducedMotion && 'magnetic-button'
    );
    
    return (
      <Button
        ref={ref || buttonRef}
        className={cn(animationClasses, 'relative overflow-hidden', className)}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        variant={variant}
        {...props}
      >
        {/* Ripple effects container */}
        {enableRipple && !prefersReducedMotion && (
          <AnimatePresence>
            {ripples.map(ripple => (
              <Ripple 
                key={ripple.id} 
                x={ripple.x} 
                y={ripple.y} 
                color={ripple.color} 
              />
            ))}
          </AnimatePresence>
        )}
        
        {/* Button content with press animation */}
        <motion.div
          className="relative z-10"
          animate={isPressed && !prefersReducedMotion ? { scale: 0.98 } : { scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.div>
        
        {/* Shimmer overlay for primary actions */}
        {enableShimmer && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer-sweep" />
          </div>
        )}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// Export convenience components for common button types
export const PrimaryAnimatedButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>((props, ref) => (
  <AnimatedButton ref={ref} variant="default" enableShimmer enableGlowPulse {...props} />
));

export const SecondaryAnimatedButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>((props, ref) => (
  <AnimatedButton ref={ref} variant="secondary" rippleColor="#EC4899" {...props} />
));

export const DestructiveAnimatedButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>((props, ref) => (
  <AnimatedButton ref={ref} variant="destructive" rippleColor="#EF4444" {...props} />
));

export const GhostAnimatedButton = forwardRef<HTMLButtonElement, Omit<AnimatedButtonProps, 'variant'>>((props, ref) => (
  <AnimatedButton ref={ref} variant="ghost" rippleColor="#06B6D4" enableMagnetic {...props} />
));

PrimaryAnimatedButton.displayName = 'PrimaryAnimatedButton';
SecondaryAnimatedButton.displayName = 'SecondaryAnimatedButton';
DestructiveAnimatedButton.displayName = 'DestructiveAnimatedButton';
GhostAnimatedButton.displayName = 'GhostAnimatedButton';