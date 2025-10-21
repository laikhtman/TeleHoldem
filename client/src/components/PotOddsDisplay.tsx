import { calculatePotOdds } from '@/lib/potOddsCalculator';
import { calculateSimpleWinProbability, calculatePotEquity } from '@/lib/simpleWinProbability';
import { Badge } from './ui/badge';
import { Card } from '@shared/schema';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PotOddsDisplayProps {
  amountToCall: number;
  potSize: number;
  playerCards?: Card[];
  communityCards?: Card[];
  numOpponents?: number;
}

export function PotOddsDisplay({ 
  amountToCall, 
  potSize,
  playerCards = [],
  communityCards = [],
  numOpponents = 1
}: PotOddsDisplayProps) {
  const potOdds = calculatePotOdds(amountToCall, potSize);
  
  // Calculate win probability if we have player cards
  const winProbability = playerCards.length === 2 
    ? calculateSimpleWinProbability(playerCards, communityCards, numOpponents)
    : 0;
  
  // Calculate pot equity
  const { shouldCall, expectedValue } = calculatePotEquity(
    winProbability,
    amountToCall,
    potSize
  );

  if (potOdds <= 0 && winProbability <= 0) {
    return null;
  }

  return (
    <motion.div 
      className="flex flex-col gap-3 rounded-lg bg-card/90 backdrop-blur-sm p-4 border border-border shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Decision Helper
        </h3>
        {shouldCall ? (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
            <TrendingUp className="w-3 h-3 mr-1" />
            +EV Call
          </Badge>
        ) : amountToCall > 0 && (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
            <TrendingDown className="w-3 h-3 mr-1" />
            -EV Call
          </Badge>
        )}
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pot Odds */}
        {potOdds > 0 && (
          <div className="flex flex-col items-center p-2 rounded-md bg-background/50">
            <span className="text-xs text-muted-foreground mb-1">Pot Odds</span>
            <span className="text-lg font-bold">{potOdds}%</span>
          </div>
        )}
        
        {/* Win Probability */}
        {winProbability > 0 && (
          <div className="flex flex-col items-center p-2 rounded-md bg-background/50">
            <span className="text-xs text-muted-foreground mb-1">Win Chance</span>
            <span className={`text-lg font-bold ${
              winProbability > 60 ? 'text-green-500' : 
              winProbability > 40 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {winProbability}%
            </span>
          </div>
        )}
      </div>
      
      {/* Expected Value */}
      {amountToCall > 0 && winProbability > 0 && (
        <div className="text-center p-2 rounded-md bg-background/50">
          <span className="text-xs text-muted-foreground">Expected Value</span>
          <div className={`text-sm font-semibold ${
            expectedValue >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(0)} chips
          </div>
        </div>
      )}
      
      {/* Info Text */}
      {amountToCall > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Call ${amountToCall} to win ${potSize + amountToCall}
        </p>
      )}
    </motion.div>
  );
}
