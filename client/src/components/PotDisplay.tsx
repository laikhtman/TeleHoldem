import { Coins } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { ChipStack } from './Chip';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

interface PotDisplayProps {
  amount: number;
  onRef?: (ref: HTMLDivElement | null) => void;
}

export function PotDisplay({ amount, onRef }: PotDisplayProps) {
  const animatedAmount = useAnimatedCounter(amount);
  const chipCount = Math.min(Math.floor(amount / 50), 10);

  return (
    <div 
      ref={onRef}
      className="absolute top-[30%] left-1/2 transform -translate-x-1/2"
      style={{ zIndex: 3 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Current pot: ${amount} dollars`}
    >
      <AnimatePresence>
        {amount > 0 && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <ChipStack count={chipCount} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-black/80 backdrop-blur-md px-5 xs:px-6 sm:px-6 py-3 xs:py-3.5 sm:py-3 rounded-xl border-2 border-poker-chipGold/50 pot-elevation shadow-2xl"
        animate={amount > 0 ? {
          scale: [1, 1.08, 1],
          borderColor: ['hsl(var(--poker-chipGold) / 0.5)', 'hsl(var(--poker-chipGold) / 0.9)', 'hsl(var(--poker-chipGold) / 0.5)']
        } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 xs:gap-2.5">
          <motion.div
            animate={amount > 0 ? {
              rotate: [0, 15, -15, 0],
              scale: [1, 1.15, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <Coins className="w-6 h-6 xs:w-7 xs:h-7 sm:w-6 sm:h-6 text-poker-chipGold drop-shadow-lg" />
          </motion.div>
          <div>
            <div className="text-xs xs:text-sm sm:text-xs text-muted-foreground font-semibold">POT</div>
            <div className="text-2xl xs:text-3xl sm:text-2xl font-bold font-mono text-poker-chipGold tracking-wide" data-testid="pot-amount">
              ${animatedAmount}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
