import { Coins } from 'lucide-react';
import { useRAFAnimatedCounter } from '@/hooks/useRAFAnimatedCounter';
import { ChipStack, FlyingChip } from './Chip';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface PotDisplayProps {
  amount: number;
  onRef?: (ref: HTMLDivElement | null) => void;
  sidePots?: number[];
}

export function PotDisplay({ amount, onRef, sidePots = [] }: PotDisplayProps) {
  const animatedAmount = useRAFAnimatedCounter(amount, 600, { 
    easingFn: (t) => t * (2 - t) // ease-out for smooth deceleration
  });
  const chipCount = Math.min(Math.floor(amount / 50), 12);
  const [previousAmount, setPreviousAmount] = useState(amount);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  // Track amount changes for animation triggers
  useEffect(() => {
    if (amount > previousAmount) {
      setIsIncreasing(true);
      setPulseKey(prev => prev + 1);
      const timer = setTimeout(() => setIsIncreasing(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousAmount(amount);
  }, [amount, previousAmount]);

  return (
    <div 
      ref={onRef}
      className="absolute top-[25%] left-1/2 transform -translate-x-1/2"
      style={{ zIndex: 10 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Current pot: ${amount} dollars`}
      data-testid="pot-display"
    >
      {/* Enhanced Chip Stack Display */}
      <AnimatePresence>
        {amount > 0 && (
          <motion.div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 20 }}
            transition={{ 
              duration: 0.4, 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
          >
            <ChipStack count={chipCount} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side pots visualization: small stacks around the main pot */}
      <AnimatePresence>
        {sidePots.length > 1 && sidePots.map((amt, idx) => idx > 0 && amt > 0 ? (
          <motion.div
            key={`sidepot-${idx}`}
            className="absolute"
            style={{
              left: `${50 + (idx % 2 === 0 ? -22 - idx * 3 : 22 + idx * 3)}%`,
              bottom: '-2.5rem',
              transform: 'translateX(-50%)'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3 }}
            aria-label={`Side pot ${idx}: ${amt} dollars`}
          >
            <div className="flex flex-col items-center gap-1">
              <ChipStack count={Math.min(Math.floor(amt / 80), 8)} />
              <div className="text-[10px] font-mono text-gray-300 bg-black/70 px-2 py-0.5 rounded-md border border-white/10">SP {idx}: ${amt}</div>
            </div>
          </motion.div>
        ) : null)}
      </AnimatePresence>

      {/* Enhanced Pot Display Container */}
      <motion.div
        key={pulseKey}
        className="relative"
        initial={false}
        animate={isIncreasing ? {
          scale: [1, 1.12, 1],
          rotate: [0, -2, 2, 0]
        } : {}}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 400
        }}
      >
        {/* Glowing effect when pot increases */}
        <AnimatePresence>
          {isIncreasing && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-poker-chipGold/30 blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* Main Pot Container with enhanced styling */}
        <motion.div
          className="relative bg-gradient-to-br from-black/90 via-black/85 to-black/90 backdrop-blur-xl px-6 xs:px-8 sm:px-7 py-4 xs:py-5 sm:py-4 rounded-2xl border-2 border-poker-chipGold/60 shadow-pot-glow"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Inner glow gradient */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-poker-chipGold/10 via-transparent to-poker-chipGold/10 pointer-events-none" />
          
          {/* Content Container */}
          <div className="relative flex items-center gap-3 xs:gap-4">
            {/* Animated Coin Icon */}
            <motion.div
              className="relative"
              animate={isIncreasing ? {
                rotate: [0, 360],
                scale: [1, 1.3, 1]
              } : {}}
              transition={{ 
                duration: 0.8,
                type: "spring"
              }}
            >
              <Coins className="w-8 h-8 xs:w-10 xs:h-10 sm:w-8 sm:h-8 text-poker-chipGold drop-shadow-2xl" />
              {/* Coin shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-full pointer-events-none" />
            </motion.div>
            
            {/* Text Display */}
            <div className="flex flex-col">
              <div className="text-sm xs:text-base sm:text-sm text-gray-400 font-bold tracking-wider uppercase">POT</div>
              <motion.div 
                className="text-3xl xs:text-4xl sm:text-3xl font-black font-mono text-poker-chipGold tracking-wide drop-shadow-lg" 
                data-testid="pot-amount"
                animate={isIncreasing ? {
                  scale: [1, 1.2, 1]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                ${animatedAmount.toLocaleString()}
              </motion.div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-poker-chipGold/60 to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}
