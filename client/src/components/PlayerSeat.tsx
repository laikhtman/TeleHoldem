import { Player, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { Coins, Trophy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from './Chip';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { TurnTimer } from './TurnTimer';

interface PlayerSeatProps {
  player: Player;
  position: number;
  totalPlayers: number;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  isWinner: boolean;
  phase: GamePhase;
  lastAction: string | null;
  winAmount?: number;
  isProcessing?: boolean;
  onChipAnimationTrigger?: (position: { x: number; y: number }) => void;
}

export function PlayerSeat({ 
  player, 
  position, 
  totalPlayers, 
  isCurrentPlayer, 
  isDealer, 
  isWinner, 
  phase, 
  lastAction, 
  winAmount = 0, 
  isProcessing = false,
  onChipAnimationTrigger 
}: PlayerSeatProps) {
  const [flyingChips, setFlyingChips] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [showAction, setShowAction] = useState(false);
  const [showWinAmount, setShowWinAmount] = useState(false);
  const prevBet = useRef(player.bet);
  const seatRef = useRef<HTMLDivElement>(null);
  const animatedChipCount = useAnimatedCounter(player.chips);

  useEffect(() => {
    if (player.bet > prevBet.current && seatRef.current) {
      const chipsToAnimate = Math.max(1, Math.min(5, Math.floor((player.bet - prevBet.current) / 20)));
      const rect = seatRef.current.getBoundingClientRect();
      const seatCenterX = rect.left + rect.width / 2;
      const seatCenterY = rect.top + rect.height / 2;
      
      const newChips = Array.from({ length: chipsToAnimate }, (_, i) => ({
        id: Date.now() + i,
        startX: seatCenterX,
        startY: seatCenterY
      }));
      
      setFlyingChips(newChips);
      setTimeout(() => setFlyingChips([]), 800);
      
      if (onChipAnimationTrigger) {
        onChipAnimationTrigger({ x: seatCenterX, y: seatCenterY });
      }
    }
    prevBet.current = player.bet;
  }, [player.bet, onChipAnimationTrigger]);

  useEffect(() => {
    if (lastAction && lastAction.startsWith(player.name)) {
      setShowAction(true);
      const timer = setTimeout(() => setShowAction(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, player.name]);

  useEffect(() => {
    if (winAmount > 0) {
      setShowWinAmount(true);
      const timer = setTimeout(() => setShowWinAmount(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [winAmount]);

  const getPosition = () => {
    const tableWidth = 800;
    const tableHeight = 500;
    const radiusX = tableWidth / 2 - 80;
    const radiusY = tableHeight / 2 - 60;
    
    const angle = (position / totalPlayers) * 2 * Math.PI - Math.PI / 2;
    
    const x = Math.cos(angle) * radiusX + tableWidth / 2;
    const y = Math.sin(angle) * radiusY + tableHeight / 2;
    
    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)'
    };
  };

  const seatClasses = [
    'rounded-lg p-3 backdrop-blur-sm transition-all duration-300',
    isCurrentPlayer ? 'bg-black/80 border-2 border-poker-chipGold animate-pulse-glow' : 'bg-black/70 border border-white/20',
    isWinner ? 'bg-poker-chipGold/20 border-2 border-poker-chipGold shadow-lg' : '',
    player.chips === 0 ? 'opacity-50' : ''
  ].join(' ');

  return (
    <div
      ref={seatRef}
      className="absolute z-10 seat-shadow"
      style={getPosition()}
      data-testid={`player-seat-${player.id}`}
    >
      <div className={seatClasses}>
        <AnimatePresence>
          {showAction && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold z-20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {lastAction?.split(' ').slice(1).join(' ')}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isCurrentPlayer && isProcessing && !player.isHuman && (
            <TurnTimer duration={800} />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showWinAmount && winAmount > 0 && (
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-poker-success text-white px-4 py-2 rounded-full text-sm font-bold z-20 shadow-lg"
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: [0.5, 1.2, 1],
              }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              data-testid={`win-indicator-${player.id}`}
            >
              +${winAmount}
            </motion.div>
          )}
        </AnimatePresence>

        {isWinner && !showWinAmount && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-poker-chipGold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            WINNER
          </div>
        )}
        {/* Player info */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-sm font-semibold text-white">
              {player.name}
            </div>
            {isDealer && (
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                D
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 text-poker-chipGold font-mono font-bold">
            <Coins className="w-4 h-4" />
            <span data-testid={`player-chips-${player.id}`}>${animatedChipCount}</span>
          </div>
          {player.bet > 0 && (
            <div className="text-xs text-poker-success mt-1" data-testid={`player-bet-${player.id}`}>
              Bet: ${player.bet}
            </div>
          )}
          {player.folded && (
            <div className="text-xs text-destructive mt-1" data-testid={`player-folded-${player.id}`}>
              Folded
            </div>
          )}
          {player.allIn && (
            <div className="text-xs text-poker-chipGold mt-1 font-bold" data-testid={`player-allin-${player.id}`}>
              ALL IN!
            </div>
          )}
        </div>

        {/* Player cards */}
        <div className="flex gap-1 justify-center" data-testid={`player-cards-${player.id}`}>
          {player.hand.length > 0 && (
            <>
              <PlayingCard 
                card={player.hand[0]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="transform scale-90"
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150 + 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="transform scale-90"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
