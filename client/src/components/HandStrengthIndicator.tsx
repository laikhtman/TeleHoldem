import { Card, HandRank } from '@shared/schema';
import { handEvaluator, HandEvaluation } from '@/lib/handEvaluator';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HandStrengthIndicatorProps {
  hand: Card[];
  communityCards: Card[];
}

const handRankValues: Record<HandRank, number> = {
  'royal-flush': 10,
  'straight-flush': 9,
  'four-of-a-kind': 8,
  'full-house': 7,
  'flush': 6,
  'straight': 5,
  'three-of-a-kind': 4,
  'two-pair': 3,
  'pair': 2,
  'high-card': 1,
};

const getColorClass = (rank: HandRank): string => {
  const rankValue = handRankValues[rank];
  
  if (rankValue >= 5) {
    return 'bg-poker-chipGold text-black border-poker-chipGold';
  } else if (rankValue >= 2) {
    return 'bg-primary text-primary-foreground border-primary';
  } else {
    return 'bg-muted text-muted-foreground border-muted';
  }
};

const getDrawColorClass = (): string => {
  return 'bg-accent text-accent-foreground border-accent';
};

export function HandStrengthIndicator({ hand, communityCards }: HandStrengthIndicatorProps) {
  const [evaluation, setEvaluation] = useState<HandEvaluation | null>(null);
  const [previousRank, setPreviousRank] = useState<HandRank | null>(null);
  const [isImproving, setIsImproving] = useState(false);

  useEffect(() => {
    if (hand.length === 0) {
      setEvaluation(null);
      return;
    }

    const newEval = handEvaluator.evaluateHandWithDraws(hand, communityCards);
    
    if (evaluation && newEval.hand.rank !== evaluation.hand.rank) {
      const oldRank = handRankValues[evaluation.hand.rank];
      const newRank = handRankValues[newEval.hand.rank];
      
      if (newRank > oldRank) {
        setIsImproving(true);
        setTimeout(() => setIsImproving(false), 1000);
      }
    }
    
    setPreviousRank(evaluation?.hand.rank || null);
    setEvaluation(newEval);
  }, [hand, communityCards]);

  if (!evaluation || hand.length === 0) {
    return null;
  }

  const { hand: currentHand, draws } = evaluation;
  const rankValue = handRankValues[currentHand.rank];
  const hasFlushDraw = draws.flushDraw !== undefined;
  const hasStraightDraw = draws.straightDraw !== undefined;
  const totalOuts = (draws.flushDraw?.outs || 0) + (draws.straightDraw?.outs || 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentHand.rank}-${hasFlushDraw}-${hasStraightDraw}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Hand strength: ${currentHand.description}. Rank ${rankValue} out of 10${totalOuts > 0 ? ` with ${totalOuts} outs` : ''}`}
        data-testid="hand-strength-indicator"
      >
        {/* Main Hand Strength */}
        <motion.div
          animate={isImproving ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Badge
            className={`${getColorClass(currentHand.rank)} px-6 py-3 text-base font-bold shadow-lg transition-all duration-300 border-2`}
            data-testid="badge-hand-strength"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold" data-testid="text-hand-description">
                {currentHand.description}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-80" data-testid="text-hand-rank">
                  Rank: {rankValue}/10
                </span>
                {isImproving && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </motion.div>
                )}
              </div>
            </div>
          </Badge>
        </motion.div>

        {/* Draw Indicators */}
        {(hasFlushDraw || hasStraightDraw) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2"
          >
            {hasFlushDraw && (
              <Badge
                className={`${getDrawColorClass()} px-4 py-2 text-sm border animate-pulse`}
                data-testid="badge-flush-draw"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    Flush Draw ({draws.flushDraw!.suit})
                  </span>
                  <span className="text-xs opacity-80">
                    {draws.flushDraw!.outs} outs
                  </span>
                </div>
              </Badge>
            )}
            
            {hasStraightDraw && (
              <Badge
                className={`${getDrawColorClass()} px-4 py-2 text-sm border animate-pulse`}
                data-testid="badge-straight-draw"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {draws.straightDraw!.type === 'open-ended' 
                      ? 'Open-Ended Straight Draw' 
                      : 'Gutshot Straight Draw'}
                  </span>
                  <span className="text-xs opacity-80">
                    {draws.straightDraw!.outs} outs
                  </span>
                </div>
              </Badge>
            )}

            {/* Total Outs Summary */}
            {totalOuts > 0 && (
              <div className="text-xs text-muted-foreground text-center" data-testid="text-total-outs">
                Total: {totalOuts} outs to improve
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
