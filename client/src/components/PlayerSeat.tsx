import { PlayerStats } from './PlayerStats';
import { Player, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { Coins, Trophy, XCircle, CheckCircle, ArrowUpCircle, User, Crown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from './Chip';
import { useRAFAnimatedCounter } from '@/hooks/useRAFAnimatedCounter';
import { TurnTimer } from './TurnTimer';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHaptic } from '@/hooks/useHaptic';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const [textSize, setTextSize] = useState({ 
    name: '1.375rem',   // Scales: 19.25px mobile, 20.625px tablet, 22px desktop
    chips: '1.5rem',    // Scales: 21px mobile, 22.5px tablet, 24px desktop
    status: '1.125rem', // Scales: 15.75px mobile, 16.875px tablet, 18px desktop
    bet: '1.25rem'      // Scales: 17.5px mobile, 18.75px tablet, 20px desktop
  });
  const prevBet = useRef(player.bet);
  const seatRef = useRef<HTMLDivElement>(null);
  const animatedChipCount = useRAFAnimatedCounter(player.chips, 400, { 
    easingFn: (t) => t * (2 - t) // smooth ease-out
  });
  const { triggerHaptic } = useHaptic();
  const { playSound } = useSound();
  const { toast } = useToast();
  
  // Slight downscale seats on very small screens to reduce overlap
  const getSeatScale = () => {
    if (typeof window === 'undefined') return 1;
    const vw = window.innerWidth;
    if (vw < 360) return 0.85;
    if (vw < 480) return 0.92;
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
      if (vw >= 1024) {
        // Desktop sizes (base 16px)
        setTextSize({ 
          name: '1.375rem',   // 22px at 16px base
          chips: '1.5rem',    // 24px at 16px base
          status: '1.125rem', // 18px at 16px base
          bet: '1.25rem'      // 20px at 16px base
        });
      } else if (vw >= 768) {
        // Tablet sizes (base 15px)
        setTextSize({ 
          name: '1.333rem',   // ~20px at 15px base
          chips: '1.467rem',  // ~22px at 15px base
          status: '1.067rem', // ~16px at 15px base
          bet: '1.2rem'       // ~18px at 15px base
        });
      } else if (vw >= 480) {
        // Large phones (base 14px)
        setTextSize({ 
          name: '1.429rem',   // ~20px at 14px base
          chips: '1.571rem',  // ~22px at 14px base
          status: '1.143rem', // ~16px at 14px base
          bet: '1.286rem'     // ~18px at 14px base
        });
      } else {
        // Small phones (base 14px)
        setTextSize({ 
          name: '1.286rem',   // ~18px at 14px base
          chips: '1.429rem',  // ~20px at 14px base
          status: '1.071rem', // ~15px at 14px base
          bet: '1.143rem'     // ~16px at 14px base
        });
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
    
    // Map seat indices to specific angles for better distribution
    // User (seat 0) is placed at bottom center for ergonomic reasons
    const seatAngles = [
      90,   // Seat 0: Bottom center (human player)
      30,   // Seat 1: Bottom-right
      330,  // Seat 2: Top-right
      270,  // Seat 3: Top center
      210,  // Seat 4: Top-left
      150   // Seat 5: Bottom-left
    ];
    
    // Get the angle for this seat position
    const angleDeg = seatAngles[position] || (position * 60); // Fallback for more than 6 players
    // Convert to radians (0° is right, 90° is bottom, 270° is top)
    const angleRad = (angleDeg * Math.PI) / 180;
    
    const x = Math.cos(angleRad) * radiusX + baseWidth / 2;
    const y = Math.sin(angleRad) * radiusY + baseHeight / 2;
    
    return {
      left: `${x}%`,
      top: `${y}%`,
    } as React.CSSProperties;
  };

  // Enhanced seat styling with better visual hierarchy
  const getSeatClasses = () => {
    const baseClasses = 'rounded-xl p-4 xs:p-5 sm:p-5 md:p-6 lg:p-6 backdrop-blur-md transition-all duration-300 relative shadow-xl';
    
    if (player.chips === 0) {
      // Eliminated players - heavily dimmed
      return `${baseClasses} bg-black/40 border-2 border-gray-800/50 opacity-40 grayscale`;
    }
    
    if (player.folded) {
      // Folded players - dimmed but still visible
      return `${baseClasses} bg-black/50 border-2 border-gray-600/50 opacity-60`;
    }
    
    if (isCurrentPlayer) {
      // Current player - highly prominent with animated glow
      return `${baseClasses} bg-gradient-to-br from-black/90 to-black/80 border-4 border-poker-chipGold animate-pulse-glow-enhanced shadow-poker-glow`;
    }
    
    if (isWinner) {
      // Winner - gold theme
      return `${baseClasses} bg-gradient-to-br from-poker-chipGold/30 to-poker-chipGold/20 border-4 border-poker-chipGold shadow-poker-gold`;
    }
    
    if (player.allIn) {
      // All-in player - special red glow effect
      return `${baseClasses} bg-gradient-to-br from-red-900/80 to-black/80 border-3 border-red-500 shadow-red-glow`;
    }
    
    // Default seat styling
    return `${baseClasses} bg-gradient-to-br from-black/80 to-black/70 border-2 border-white/20 hover:border-white/30`;
  };

  const seatClasses = getSeatClasses();

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
  const { ref: swipeRef, isSwipingLeft, isSwipingRight } = useSwipeGesture({
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
    }
  }, {
    minSwipeDistance: 50, // Lower threshold for easier activation
    disabled: !(player.isHuman && isCurrentPlayer && !isProcessing && !player.folded)
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
        {/* Enhanced Player Info Section with Avatar */}
        <div className="flex flex-col items-center mb-3">
          {/* Avatar and Name Row */}
          <div className="flex items-center gap-3 mb-2">
            {/* Player Avatar - Larger and more prominent */}
            <Avatar className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-2 border-white/20 shadow-lg">
              <AvatarFallback 
                className={`text-lg xs:text-xl sm:text-2xl font-bold ${
                  player.folded ? 'bg-gray-700 text-gray-400' : 
                  player.allIn ? 'bg-red-900 text-white' :
                  isCurrentPlayer ? 'bg-poker-chipGold text-black' :
                  'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
                }`}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start">
              {/* Player Name */}
              <div className="font-bold text-white tracking-wide" style={{ fontSize: textSize.name }}>
                {player.name}
              </div>
              
              {/* Chip Count - More prominent */}
              <div className="flex items-center gap-1 text-poker-chipGold font-mono font-bold" style={{ fontSize: textSize.chips }}>
                <Coins className="w-6 h-6 xs:w-7 xs:h-7" aria-hidden="true" />
                <span data-testid={`player-chips-${player.id}`}>
                  ${animatedChipCount}
                </span>
              </div>
            </div>

            {/* Enhanced Dealer Button */}
            {isDealer && (
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gradient-to-br from-poker-chipGold to-yellow-600 text-black font-bold flex items-center justify-center shadow-lg border-2 border-yellow-400"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.1 }}
                aria-label="Dealer button"
              >
                <Crown className="w-5 h-5 xs:w-6 xs:h-6" />
              </motion.div>
            )}
          </div>

          {/* Status Indicators Row */}
          <div className="flex flex-col items-center gap-1">
            {player.bet > 0 && (
              <motion.div 
                className="text-poker-success font-bold" 
                style={{ fontSize: textSize.bet }}
                data-testid={`player-bet-${player.id}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                BET: ${player.bet}
              </motion.div>
            )}
            
            {player.folded && (
              <motion.div 
                className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full font-bold" 
                style={{ fontSize: textSize.status }}
                data-testid={`player-folded-${player.id}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                FOLDED
              </motion.div>
            )}
            
            {player.allIn && !player.folded && (
              <motion.div 
                className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full font-bold shadow-red-glow" 
                style={{ fontSize: textSize.status }}
                data-testid={`player-allin-${player.id}`}
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 10px rgba(239, 68, 68, 0.5)',
                    '0 0 20px rgba(239, 68, 68, 0.8)',
                    '0 0 10px rgba(239, 68, 68, 0.5)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ALL IN!
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Player Cards Section - Larger and more prominent */}
        <div 
          ref={swipeRef}
          className="flex gap-2 xs:gap-2.5 justify-center flex-shrink-0 mt-2" 
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
                className="flex-shrink-0 scale-110 xs:scale-125 sm:scale-125 hover:scale-[1.3] transition-transform duration-200"
                colorblindMode={colorblindMode}
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150 + 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="flex-shrink-0 scale-110 xs:scale-125 sm:scale-125 hover:scale-[1.3] transition-transform duration-200"
                colorblindMode={colorblindMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
