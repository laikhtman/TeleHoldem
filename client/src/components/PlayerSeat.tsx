import { PlayerStats } from './PlayerStats';
import { Player, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { Coins, Trophy, XCircle, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from './Chip';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { TurnTimer } from './TurnTimer';

type ActionBadgeType = 'fold' | 'check' | 'call' | 'bet' | 'raise';

interface ActionBadge {
  type: ActionBadgeType;
  text: string;
}

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
  onChipAnimationTrigger?: (position: { x: number; y: number }) => void;
  isProcessing: boolean;
  colorblindMode?: boolean;
}

export function PlayerSeat({ player, position, totalPlayers, isCurrentPlayer, isDealer, isWinner, phase, lastAction, winAmount = 0, onChipAnimationTrigger, isProcessing, colorblindMode = false }: PlayerSeatProps) {
  const [flyingChips, setFlyingChips] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [actionBadge, setActionBadge] = useState<ActionBadge | null>(null);
  const [showWinAmount, setShowWinAmount] = useState(false);
  const [showStats, setShowStats] = useState(false);
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
      const actionParts = lastAction.split(' ').slice(1);
      const rawType = actionParts[0].toLowerCase();
      
      let type: ActionBadgeType = 'check';
      if (rawType.includes('fold')) type = 'fold';
      else if (rawType.includes('check')) type = 'check';
      else if (rawType.includes('call')) type = 'call';
      else if (rawType.includes('bet')) type = 'bet';
      else if (rawType.includes('raise')) type = 'raise';

      setActionBadge({ type, text: actionParts.join(' ') });
      
      const timer = setTimeout(() => setActionBadge(null), 2500);
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
    const baseWidth = 100;
    const baseHeight = 66.67;
    
    const bufferPercentage = 0.12;
    const maxRadiusX = (baseWidth / 2) * (1 - bufferPercentage);
    const maxRadiusY = (baseHeight / 2) * (1 - bufferPercentage);
    
    const radiusX = maxRadiusX - 8;
    const radiusY = maxRadiusY - 6;
    
    const angle = (position / totalPlayers) * 2 * Math.PI - Math.PI / 2;
    
    const x = Math.cos(angle) * radiusX + baseWidth / 2;
    const y = Math.sin(angle) * radiusY + baseHeight / 2;
    
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)'
    };
  };

  const seatClasses = [
    'rounded-lg p-2 xs:p-2.5 sm:p-3 md:p-4 backdrop-blur-sm transition-all duration-300 relative',
    isCurrentPlayer ? 'bg-black/80 border-2 border-poker-chipGold animate-pulse-glow' : 'bg-black/70 border border-white/20',
    isWinner ? 'bg-poker-chipGold/20 border-2 border-poker-chipGold shadow-lg' : '',
    player.chips === 0 ? 'opacity-50 grayscale' : ''
  ].join(' ');

  const getBadgeStyle = (type: ActionBadgeType) => {
    switch (type) {
      case 'fold':
        return { icon: <XCircle className="w-4 h-4" />, class: 'bg-destructive text-destructive-foreground' };
      case 'check':
      case 'call':
        return { icon: <CheckCircle className="w-4 h-4" />, class: 'bg-poker-success text-white' };
      case 'bet':
      case 'raise':
        return { icon: <ArrowUpCircle className="w-4 h-4" />, class: 'bg-poker-chipGold text-black' };
      default:
        return { icon: null, class: 'bg-black/70 text-white' };
    }
  };

  return (
    <div
      ref={seatRef}
      className="absolute seat-shadow"
      style={{ ...getPosition(), zIndex: 4 }}
      data-testid={`player-seat-${player.id}`}
      onMouseEnter={() => setShowStats(true)}
      onMouseLeave={() => setShowStats(false)}
    >
      <AnimatePresence>{showStats && <PlayerStats player={player} />}</AnimatePresence>
      <div className={seatClasses}>
        {player.chips === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded-md">OUT</span>
          </div>
        )}
        <AnimatePresence>
          {actionBadge && (
            <motion.div
              className={`absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold z-20 flex items-center gap-2 shadow-lg ${getBadgeStyle(actionBadge.type).class}`}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {getBadgeStyle(actionBadge.type).icon}
              <span className="capitalize">{actionBadge.text}</span>
            </motion.div>
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
                scale: [0, 1.2, 1],
              }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              data-testid={`win-indicator-${player.id}`}
            >
              +${winAmount}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isCurrentPlayer && isProcessing && !player.isHuman && (
            <TurnTimer duration={800} />
          )}
        </AnimatePresence>

        {isWinner && !showWinAmount && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-poker-chipGold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            WINNER
          </div>
        )}
        {/* Player info */}
        <div className="text-center mb-1.5 xs:mb-2">
          <div className="flex items-center justify-between gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
            <div className="text-xs xs:text-sm md:text-base font-semibold text-white">
              {player.name}
            </div>
            {isDealer && (
              <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-white text-black text-[10px] xs:text-xs font-bold flex items-center justify-center">
                D
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-0.5 xs:gap-1 text-poker-chipGold font-mono font-bold text-xs xs:text-sm md:text-base">
            <Coins className="w-3 h-3 xs:w-4 xs:h-4" />
            <span data-testid={`player-chips-${player.id}`}>${animatedChipCount}</span>
          </div>
          {player.bet > 0 && (
            <div className="text-[10px] xs:text-xs text-poker-success mt-0.5 xs:mt-1" data-testid={`player-bet-${player.id}`}>
              Bet: ${player.bet}
            </div>
          )}
          {player.folded && (
            <div className="text-[10px] xs:text-xs text-destructive mt-0.5 xs:mt-1" data-testid={`player-folded-${player.id}`}>
              Folded
            </div>
          )}
          {player.allIn && (
            <div className="text-[10px] xs:text-xs text-poker-chipGold mt-0.5 xs:mt-1 font-bold" data-testid={`player-allin-${player.id}`}>
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
                colorblindMode={colorblindMode}
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150 + 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="transform scale-90"
                colorblindMode={colorblindMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}