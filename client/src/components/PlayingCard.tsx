import { Card } from '@shared/schema';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import svgCardsPath from '@assets/svg-cards.svg';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
  animateFlip?: boolean;
  animateDeal?: boolean;
  dealDelay?: number;
  colorblindMode?: boolean;
  highlight?: boolean;
}

// Convert our card format to SVG-cards naming convention
const getCardSvgId = (card: Card): string => {
  // Map suits: S->spade, H->heart, D->diamond, C->club
  const suitMap: Record<string, string> = {
    'S': 'spade',
    'H': 'heart',
    'D': 'diamond',
    'C': 'club'
  };
  
  // Map ranks: A->1, J->jack, Q->queen, K->king, 2-10->2-10
  const rankMap: Record<string, string> = {
    'A': '1',
    'J': 'jack',
    'Q': 'queen',
    'K': 'king'
  };
  
  const suit = suitMap[card.suit] || 'spade';
  const rank = rankMap[card.rank] || card.rank.toLowerCase();
  
  return `${suit}_${rank}`;
};

// Get the actual suit symbol (♠ ♥ ♦ ♣)
const getSuitSymbol = (suit: string) => {
  switch (suit) {
    case 'S': return '♠';
    case 'H': return '♥';
    case 'D': return '♦';
    case 'C': return '♣';
    default: return suit;
  }
};

export function PlayingCard({ 
  card, 
  faceDown = false, 
  className = '', 
  animateFlip = false,
  animateDeal = false,
  dealDelay = 0,
  colorblindMode = false,
  highlight = false
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(!animateFlip);
  const [isDealt, setIsDealt] = useState(!animateDeal);
  const [isTouched, setIsTouched] = useState(false);
  const [cardDimensions, setCardDimensions] = useState({ width: '90px', height: '129px' });
  const { playSound } = useSound();
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef({ willChange: false });
  const [settleBounceKey, setSettleBounceKey] = useState<number>(0);
  const [pinchActive, setPinchActive] = useState(false);
  const [peekActive, setPeekActive] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle will-change for performance
  useEffect(() => {
    if (animateDeal && !prefersReducedMotion && cardRef.current) {
      // Set will-change before animation
      cardRef.current.style.willChange = 'transform, opacity';
      animationStateRef.current.willChange = true;
      
      // Remove will-change after animation completes
      const timer = setTimeout(() => {
        if (cardRef.current && animationStateRef.current.willChange) {
          cardRef.current.style.willChange = 'auto';
          animationStateRef.current.willChange = false;
        }
      }, 1000 + dealDelay); // Animation duration + delay
      
      return () => {
        clearTimeout(timer);
        if (cardRef.current && animationStateRef.current.willChange) {
          cardRef.current.style.willChange = 'auto';
          animationStateRef.current.willChange = false;
        }
      };
    }
  }, [animateDeal, dealDelay, prefersReducedMotion]);

  useEffect(() => {
    if (animateFlip) {
      // Instant flip if reduced motion, else delayed
      const delay = prefersReducedMotion ? 0 : 100;
      const timer = setTimeout(() => {
        setIsFlipped(true);
        if (!prefersReducedMotion) {
          playSound('card-flip', { volume: 0.12 });
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [animateFlip, playSound, prefersReducedMotion]);

  useEffect(() => {
    if (animateDeal) {
      // Instant deal if reduced motion, else delayed
      const delay = prefersReducedMotion ? 0 : dealDelay;
      const timer = setTimeout(() => {
        setIsDealt(true);
        if (!prefersReducedMotion) {
          playSound('card-deal', { volume: 0.1 });
        }
        // trigger a subtle settle bounce shortly after being dealt
        if (!prefersReducedMotion) {
          setTimeout(() => setSettleBounceKey(prev => prev + 1), 120);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [animateDeal, dealDelay, playSound, prefersReducedMotion]);

  useEffect(() => {
    const updateCardSize = () => {
      const vw = window.innerWidth;
      if (vw >= 1024) {
        setCardDimensions({ width: '75px', height: '107px' });  // lg
      } else if (vw >= 768) {
        setCardDimensions({ width: '70px', height: '100px' });   // md
      } else if (vw >= 640) {
        setCardDimensions({ width: '85px', height: '121px' });   // sm
      } else if (vw >= 480) {
        setCardDimensions({ width: '105px', height: '150px' });  // xs (slightly larger for readability)
      } else {
        setCardDimensions({ width: '96px', height: '138px' });   // mobile (slightly larger for readability)
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, []);

  if (!card) {
    return (
      <div 
        className={`rounded-lg border-2 border-dashed border-border/40 bg-background/20 ${className}`}
        style={{
          width: cardDimensions.width,
          height: cardDimensions.height,
          minWidth: cardDimensions.width,
          minHeight: cardDimensions.height
        }}
        data-testid="card-placeholder"
      />
    );
  }

  // Colorblind-friendly suit indicators (small geometric shapes)
  const getSuitIndicator = () => {
    const baseClass = "absolute top-1.5 right-1.5 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-2.5 sm:h-2.5 z-10";
    switch (card.suit) {
      case 'S': // Spades - Circle (filled)
        return <div className={`${baseClass} rounded-full bg-poker-cardBlack shadow-sm`} aria-label="Spades indicator" />;
      case 'H': // Hearts - Square (filled) 
        return <div className={`${baseClass} bg-poker-cardRed shadow-sm`} aria-label="Hearts indicator" />;
      case 'D': // Diamonds - Diamond shape (rotated square)
        return <div className={`${baseClass} bg-poker-cardRed transform rotate-45 shadow-sm`} aria-label="Diamonds indicator" />;
      case 'C': // Clubs - Circle (outline)
        return <div className={`${baseClass} rounded-full border-2 border-poker-cardBlack bg-white shadow-sm`} aria-label="Clubs indicator" />;
      default:
        return null;
    }
  };

  const getInitialState = () => {
    if (prefersReducedMotion) {
      // No animation for reduced motion
      return { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)' };
    }
    
    if (animateDeal) {
      // Use translate3d for GPU acceleration, start from deck position
      return { opacity: 0, transform: 'translate3d(0, -400px, 0) scale(0.5) rotateY(180deg)' };
    }
    return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
  };

  const getAnimateState = () => {
    if (prefersReducedMotion) {
      // No animation for reduced motion
      return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
    }
    
    if (animateDeal && !isDealt) {
      return getInitialState();
    }
    return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
  };

  const cardSvgId = card ? getCardSvgId(card) : '';
  
  const getCardAriaLabel = () => {
    if (!card) return 'Empty card slot';
    if (faceDown) return 'Face down card';
    const rank = card.rank === 'A' ? 'Ace' : card.rank === 'K' ? 'King' : card.rank === 'Q' ? 'Queen' : card.rank === 'J' ? 'Jack' : card.rank;
    const suit = card.suit === 'S' ? 'Spades' : card.suit === 'H' ? 'Hearts' : card.suit === 'D' ? 'Diamonds' : card.suit === 'C' ? 'Clubs' : card.suit;
    return `${rank} of ${suit}`;
  };

  // Handle touch interactions for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!card) return;
    // two-finger pinch to peek/zoom
    if (e.touches && e.touches.length >= 2 && !prefersReducedMotion) {
      setPinchActive(true);
      playSound('button-click', { volume: 0.08 });
    }
    // long-press to peek (additional zoom)
    if (!longPressTimer.current && !prefersReducedMotion) {
      longPressTimer.current = setTimeout(() => setPeekActive(true), 500);
    }
    if (!faceDown && !prefersReducedMotion) {
      setIsTouched(true);
    }
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
    setPinchActive(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // end peek shortly after
    if (peekActive) {
      setTimeout(() => setPeekActive(false), 150);
    }
  };

  // Animation config based on reduced motion preference
  const transitionConfig = prefersReducedMotion 
    ? { duration: 0.01 } // Almost instant
    : { 
        duration: animateDeal ? 0.5 : 0.4, // 0.5s for dealing as requested
        ease: animateDeal ? [0.22, 0.61, 0.36, 1] : "easeInOut", // ease-out for natural motion
        delay: animateDeal ? dealDelay / 1000 : 0
      };

  // Hover/tap animations - disabled for reduced motion
  const hoverAnimation = !faceDown && !prefersReducedMotion ? { 
    transform: 'translate3d(0, -8px, 0) scale(1.05) rotateY(' + (isFlipped ? 180 : 0) + 'deg)',
    transition: { duration: 0.2, ease: 'easeOut' }
  } : undefined;

  const tapAnimation = !faceDown && card && !prefersReducedMotion ? { 
    transform: 'translate3d(0, -10px, 0) scale(1.08) rotateY(' + (isFlipped ? 180 : 0) + 'deg)',
    transition: { duration: 0.1 }
  } : undefined;

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{ 
        width: cardDimensions.width, 
        height: cardDimensions.height,
        minWidth: cardDimensions.width,
        minHeight: cardDimensions.height,
        flexShrink: 0,
        transformStyle: 'preserve-3d',
        // Hardware acceleration hint
        transform: `translateZ(0) scale(${pinchActive ? 1.2 : 1})`
      }}
      role="img"
      aria-label={getCardAriaLabel()}
      initial={getInitialState()}
      animate={getAnimateState()}
      transition={transitionConfig}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card Back */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)' // Hardware acceleration
        }}
      >
        <div 
          className="w-full h-full rounded-lg overflow-hidden shadow-card-3d bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 border border-gray-700/80"
          data-testid="card-back"
        >
          {/* High-quality card back with pattern */}
          <svg
            viewBox="0 0 169.075 244.640"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
          >
            <use href={`${svgCardsPath}#back`} fill="#1e40af" />
          </svg>
          {/* Subtle texture overlay for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/10 to-transparent pointer-events-none" />
          {/* Inner border for depth */}
          <div className="absolute inset-[2px] rounded-md border border-blue-400/20 pointer-events-none" />
        </div>
      </motion.div>
      
      {/* Card Front */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ 
          backfaceVisibility: 'hidden', 
          transform: 'rotateY(180deg) translateZ(0)' // Hardware acceleration
        }}
      >
        <motion.div 
          className={`w-full h-full rounded-lg overflow-hidden shadow-card-3d relative bg-white ${isTouched ? 'ring-2 ring-poker-chipGold ring-opacity-70' : ''} ${highlight ? 'outline outline-4 outline-poker-chipGold/80' : ''}`}
          data-testid={`card-${card.id}`}
          key={settleBounceKey}
          initial={prefersReducedMotion ? {} : { y: 0, scale: 1 }}
          animate={prefersReducedMotion ? {} : { y: [0, -6], scale: peekActive ? 1.15 : 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut', repeat: 1, repeatType: "reverse" }}
        >
          {/* Premium white card background with subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white pointer-events-none" />
          
          {/* Colorblind-friendly suit indicator badge (only in colorblind mode) */}
          {colorblindMode && getSuitIndicator()}
          
          {/* High-quality SVG Card with enhanced rendering */}
          <svg
            viewBox="0 0 169.075 244.640"
            className="w-full h-full relative z-10"
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              filter: 'contrast(1.1) brightness(1.02)',
              imageRendering: 'crisp-edges'
            }}
          >
            <use href={`${svgCardsPath}#${cardSvgId}`} />
          </svg>
          
          {/* Subtle inner border for depth and separation */}
          <div className="absolute inset-[1px] rounded-md border border-gray-300/50 pointer-events-none" />
          
          {/* Gloss effect for premium card feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 pointer-events-none" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
