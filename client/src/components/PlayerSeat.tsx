import { PlayerStats } from './PlayerStats';
import { Player, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { Coins, Trophy, XCircle, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from './Chip';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { TurnTimer } from './TurnTimer';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHaptic } from '@/hooks/useHaptic';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';

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
  onFold?: () => void;
  soundEnabled?: boolean;
  soundVolume?: number;
}

export function PlayerSeat({ player, position, totalPlayers, isCurrentPlayer, isDealer, isWinner, phase, lastAction, winAmount = 0, onChipAnimationTrigger, isProcessing, colorblindMode = false, onFold, soundEnabled = true, soundVolume = 0.5 }: PlayerSeatProps) {
  const [flyingChips, setFlyingChips] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [actionBadge, setActionBadge] = useState<ActionBadge | null>(null);
  const [showWinAmount, setShowWinAmount] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [textSize, setTextSize] = useState({ name: '16px', chips: '16px' });
  const prevBet = useRef(player.bet);
  const seatRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const animatedChipCount = useAnimatedCounter(player.chips);
  const { triggerHaptic } = useHaptic();
  const { playSound } = useSound();
  const { toast } = useToast();
  
  // Slight downscale seats on very small screens to reduce overlap
  const getSeatScale = () => {
    if (typeof window === 'undefined') return 1;
    const vw = window.innerWidth;
    if (vw < 360) return 0.82;
    if (vw < 480) return 0.88;
    return 1;
  };
  const [seatScale, setSeatScale] = useState<number>(getSeatScale());
  useEffect(() => {
    const onResize = () => setSeatScale(getSeatScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  useEffect(() => {
    const updateTextSize = () => {
      const vw = window.innerWidth;
      if (vw >= 480) {
        setTextSize({ name: '19px', chips: '19px' });  // xs and above
      } else {
        setTextSize({ name: '17px', chips: '17px' });  // mobile
      }
    };

    updateTextSize();
    window.addEventListener('resize', updateTextSize);
    return () => window.removeEventListener('resize', updateTextSize);
  }, []);

  const getPosition = () => {
    const baseWidth = 100;
    const baseHeight = 66.67;
    
    // Slightly expand seating radius on small screens to reduce crowding
    let vw = 1024;
    if (typeof window !== 'undefined') {
      vw = window.innerWidth;
    }
    const isSmall = vw < 480;
    const isVerySmall = vw < 360;

    const bufferPercentage = isVerySmall ? 0.055 : isSmall ? 0.075 : 0.12;
    const maxRadiusX = (baseWidth / 2) * (1 - bufferPercentage);
    const maxRadiusY = (baseHeight / 2) * (1 - bufferPercentage);
    
    const radiusX = maxRadiusX - (isVerySmall ? 1 : isSmall ? 3 : 8);
    const radiusY = maxRadiusY - (isVerySmall ? 1 : isSmall ? 3 : 6);
    
    const angle = (position / totalPlayers) * 2 * Math.PI - Math.PI / 2;
    
    const x = Math.cos(angle) * radiusX + baseWidth / 2;
    const y = Math.sin(angle) * radiusY + baseHeight / 2;
    
    return {
      left: `${x}%`,
      top: `${y}%`,
    } as React.CSSProperties;
  };

  const seatClasses = [
    'rounded-lg p-3 xs:p-3.5 sm:p-3.5 md:p-4 lg:p-4 backdrop-blur-sm transition-all duration-300 relative',
    isCurrentPlayer ? 'bg-black/85 border-[3px] sm:border-2 md:border-[3px] border-poker-chipGold animate-pulse-glow shadow-2xl' : 'bg-black/75 border border-white/30',
    isWinner ? 'bg-poker-chipGold/25 border-[3px] sm:border-2 md:border-[3px] border-poker-chipGold shadow-2xl' : '',
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

  const getPlayerStatusDescription = () => {
    const parts = [player.name];
    if (player.chips === 0) parts.push('eliminated');
    else parts.push(`${player.chips} chips`);
    if (player.folded) parts.push('folded');
    else if (player.allIn) parts.push('all-in');
    if (isCurrentPlayer) parts.push('current turn');
    if (isDealer) parts.push('dealer');
    return parts.join(', ');
  };
  
  // Swipe up gesture for folding on player's hole cards (only for human player)
  useSwipeGesture(cardsRef, {
    onSwipeUp: () => {
      // Only allow swipe fold for human player when it's their turn
      if (player.isHuman && isCurrentPlayer && onFold && !isProcessing && !player.folded) {
        // Haptic and sound feedback for swipe fold
        triggerHaptic('light');
        if (soundEnabled) {
          playSound('fold', { volume: soundVolume * 0.3 });
        }
        
        // Call the fold handler
        onFold();
        
        // Show toast notification
        toast({
          title: "Swipe Up",
          description: "Folded",
          duration: 1500
        });
      }
    },
    threshold: 50, // Lower threshold for easier activation
    enabled: player.isHuman && isCurrentPlayer && !isProcessing && !player.folded
  });

  return (
    <div
      ref={seatRef}
      className="absolute seat-shadow"
      style={{ ...getPosition(), zIndex: 4, transform: `translate(-50%, -50%) scale(${seatScale})` }}
      data-testid={`player-seat-${player.id}`}
      onMouseEnter={() => setShowStats(true)}
      onMouseLeave={() => setShowStats(false)}
      role="article"
      aria-label={getPlayerStatusDescription()}
      aria-current={isCurrentPlayer ? "true" : undefined}
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
              className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold z-[60] flex items-center gap-1.5 shadow-lg ${getBadgeStyle(actionBadge.type).class}`}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${player.name} ${actionBadge.text}`}
            >
              {getBadgeStyle(actionBadge.type).icon}
              <span className="capitalize">{actionBadge.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showWinAmount && winAmount > 0 && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-poker-success text-white px-3 py-1 rounded-full text-xs font-bold z-[60] shadow-lg"
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: [0, 1.2, 1],
              }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              data-testid={`win-indicator-${player.id}`}
              role="status"
              aria-live="polite"
              aria-label={`${player.name} won ${winAmount} dollars`}
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
        <div className="text-center mb-2 xs:mb-2.5 sm:mb-1.5">
          <div className="flex items-center justify-between gap-2 xs:gap-2.5 mb-1 xs:mb-1.5">
            <div className="font-bold text-white tracking-wide max-w-[120px] xs:max-w-[140px] truncate" style={{ fontSize: textSize.name }}>
              {player.name}
            </div>
            {isDealer && (
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-white text-black text-sm xs:text-base sm:text-xs md:text-sm font-bold flex items-center justify-center shadow-md">
                D
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 xs:gap-1.5 text-poker-chipGold font-mono font-bold" style={{ fontSize: textSize.chips }}>
            <Coins className="w-5 h-5 xs:w-6 xs:h-6 sm:w-4 sm:h-4 md:w-5 md:h-5" aria-hidden="true" />
            <span data-testid={`player-chips-${player.id}`} aria-label={`${player.name} has ${animatedChipCount} dollars in chips`}>${animatedChipCount}</span>
          </div>
          {player.bet > 0 && (
            <div className="text-sm xs:text-base sm:text-sm md:text-sm text-poker-success mt-1 font-semibold" data-testid={`player-bet-${player.id}`}>
              Bet: ${player.bet}
            </div>
          )}
          {player.folded && (
            <div className="text-sm xs:text-base sm:text-sm md:text-sm text-destructive mt-1 font-semibold" data-testid={`player-folded-${player.id}`} aria-label={`${player.name} has folded`}>
              Folded
            </div>
          )}
          {player.allIn && (
            <div className="text-sm xs:text-base sm:text-sm md:text-sm text-poker-chipGold mt-1 font-bold animate-pulse" data-testid={`player-allin-${player.id}`} aria-label={`${player.name} is all-in`}>
              ALL IN!
            </div>
          )}
        </div>

        {/* Player cards */}
        <div 
          ref={cardsRef}
          className="flex gap-1 xs:gap-1.5 justify-center flex-shrink-0" 
          data-testid={`player-cards-${player.id}`}
          style={player.isHuman && isCurrentPlayer && !player.folded ? { cursor: 'grab' } : {}}
        >
          {player.hand.length > 0 && (
            <>
              <PlayingCard 
                card={player.hand[0]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="flex-shrink-0"
                colorblindMode={colorblindMode}
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150 + 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="flex-shrink-0"
                colorblindMode={colorblindMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
