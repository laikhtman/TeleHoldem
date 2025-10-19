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
  const potRef = useRef<HTMLDivElement>(null);
  const chipCount = Math.min(Math.floor(amount / 50), 10);

  return (
    <div 
      ref={(node) => {
        potRef.current = node;
        if (onRef) onRef(node);
      }}
      className="absolute top-[30%] left-1/2 transform -translate-x-1/2 z-15"
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
        className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg border border-poker-chipGold/40 pot-elevation"
        animate={amount > 0 ? {
          scale: [1, 1.05, 1],
          borderColor: ['hsl(var(--poker-chipGold) / 0.4)', 'hsl(var(--poker-chipGold) / 0.8)', 'hsl(var(--poker-chipGold) / 0.4)']
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={amount > 0 ? {
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <Coins className="w-6 h-6 text-poker-chipGold" />
          </motion.div>
          <div>
            <div className="text-xs text-muted-foreground">Pot</div>
            <div className="text-2xl font-bold font-mono text-poker-chipGold" data-testid="pot-amount">
              ${animatedAmount}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
