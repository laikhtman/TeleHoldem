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
        {/* Poker table background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-poker-felt to-green-800 opacity-20" />
        
        {/* Central rotating container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={animationVariants.container}
          animate="animate"
        >
          {/* Animated card suits in corners */}
          {suits.map((suit, index) => {
            const positions = [
              'top-0 left-1/2 -translate-x-1/2',
              'right-0 top-1/2 -translate-y-1/2',
              'bottom-0 left-1/2 -translate-x-1/2',
              'left-0 top-1/2 -translate-y-1/2'
            ];
            
            return (
              <motion.div
                key={index}
                className={cn(
                  "absolute text-4xl font-bold",
                  suit.color,
                  positions[index]
                )}
                variants={animationVariants.suit}
                initial="initial"
                animate="animate"
                custom={suit.delay}
              >
                {suit.symbol}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Center chip stack */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-1"
            variants={animationVariants.chip}
            initial="initial"
            animate="animate"
          >
            {/* Stacked chips */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-poker-chipGold to-yellow-600 border-2 border-yellow-700 shadow-lg"
                style={{
                  marginTop: i > 0 ? '-35px' : 0,
                  zIndex: 3 - i,
                  transform: 'translateZ(0)' // GPU acceleration
                }}
              >
                {/* Chip detail */}
                <div className="w-full h-full rounded-full border-4 border-dashed border-yellow-800/30 flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-xs">$</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Loading message */}
      <motion.p 
        className={cn(
          "text-foreground/70 font-medium",
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

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-poker-chipGold"
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: prefersReducedMotion ? 0.8 : [0.3, 1, 0.3],
            }}
            transition={prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }
            }
          />
        ))}
      </div>
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