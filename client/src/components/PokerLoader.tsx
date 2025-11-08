import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface PokerLoaderProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PokerLoader({ 
  message = "Shuffling the deck...", 
  className,
  size = 'md' 
}: PokerLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Card suits for the animation
  const suits = [
    { symbol: '♠', color: 'text-black', delay: 0 },
    { symbol: '♥', color: 'text-red-600', delay: 0.15 },
    { symbol: '♦', color: 'text-red-600', delay: 0.3 },
    { symbol: '♣', color: 'text-black', delay: 0.45 }
  ];

  const animationVariants = {
    container: {
      animate: prefersReducedMotion 
        ? {} 
        : {
            rotate: 360,
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }
    },
    suit: {
      initial: { opacity: 0, scale: 0.8 },
      animate: (delay: number) => ({
        opacity: prefersReducedMotion ? 1 : [0, 1, 1, 0],
        scale: prefersReducedMotion ? 1 : [0.8, 1.2, 1, 0.8],
        transition: prefersReducedMotion 
          ? { duration: 0.01 }
          : {
              opacity: {
                duration: 1.5,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
              },
              scale: {
                duration: 1.5,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
              }
            }
      })
    },
    chip: {
      initial: { y: 0, opacity: 0.7 },
      animate: prefersReducedMotion 
        ? { y: 0, opacity: 1 }
        : {
            y: [-5, 5, -5],
            opacity: [0.7, 1, 0.7],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      {/* Main loader container */}
      <div className={cn("relative", sizeClasses[size])}>        
        {/* Central rotating container with diamond */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={animationVariants.container}
          animate="animate"
        >
          {/* Progress circle background */}
          <svg
            className="absolute inset-0 -rotate-90 transform w-full h-full"
            viewBox="0 0 128 128"
          >
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="rgb(55, 65, 81)"
              strokeWidth="8"
              fill="none"
            />
          </svg>
          
          {/* Animated progress circle */}
          <svg
            className="absolute inset-0 -rotate-90 transform w-full h-full"
            viewBox="0 0 128 128"
          >
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#facc15"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="351.86"
              strokeDashoffset="175.93"
              className="animate-spin"
              style={{ 
                animationDuration: prefersReducedMotion ? '0s' : '3s'
              }}
            />
          </svg>

          {/* Center diamond icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              variants={animationVariants.chip}
              initial="initial"
              animate="animate"
            >
              <Diamond className="h-12 w-12 text-amber-400" fill="currentColor" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Loading message */}
      <motion.p 
        className={cn(
          "text-gray-300 font-medium text-center",
          textSizes[size]
        )}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: prefersReducedMotion ? 1 : [0.5, 1, 0.5],
        }}
        transition={prefersReducedMotion 
          ? { duration: 0.01 }
          : {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
        }
      >
        {message}
      </motion.p>
    </div>
  );
}

// Compact inline version for small loading states
export function PokerSpinner({ className, size = 16 }: { className?: string; size?: number }) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      animate={prefersReducedMotion 
        ? {} 
        : { rotate: 360 }
      }
      transition={prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }
      }
    >
      <div 
        className="w-full h-full rounded-full border-2 border-poker-chipGold/20 border-t-poker-chipGold"
        style={{ transform: 'translateZ(0)' }} // GPU acceleration
      />
    </motion.div>
  );
}