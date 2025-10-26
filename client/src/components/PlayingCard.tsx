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
  colorblindMode = false
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(!animateFlip);
  const [isDealt, setIsDealt] = useState(!animateDeal);
  const [isTouched, setIsTouched] = useState(false);
  const [cardDimensions, setCardDimensions] = useState({ width: '90px', height: '129px' });
  const { playSound } = useSound();
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef({ willChange: false });

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
      return { opacity: 1, transform: 'translateY(0) scale(1) rotateY(0deg)' };
    }
    
    if (animateDeal) {
      // Use transform instead of individual properties for better performance
      return { opacity: 0, transform: 'translateY(-300px) scale(0.3) rotateY(0deg)' };
    }
    return { opacity: 1, transform: `translateY(0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
  };

  const getAnimateState = () => {
    if (prefersReducedMotion) {
      // No animation for reduced motion
      return { opacity: 1, transform: `translateY(0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
    }
    
    if (animateDeal && !isDealt) {
      return getInitialState();
    }
    return { opacity: 1, transform: `translateY(0) scale(1) rotateY(${isFlipped ? 180 : 0}deg)` };
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
  const handleTouchStart = () => {
    if (!faceDown && card && !prefersReducedMotion) {
      setIsTouched(true);
      playSound('button-click', { volume: 0.08 });
    }
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };

  // Animation config based on reduced motion preference
  const transitionConfig = prefersReducedMotion 
    ? { duration: 0.01 } // Almost instant
    : { 
        duration: animateDeal ? 0.8 : 0.4, 
        ease: animateDeal ? [0.4, 0, 0.2, 1] : "easeInOut",
        delay: animateDeal ? dealDelay / 1000 : 0
      };

  // Hover/tap animations - disabled for reduced motion
  const hoverAnimation = !faceDown && !prefersReducedMotion ? { 
    transform: 'translateY(-8px) scale(1.05) rotateY(' + (isFlipped ? 180 : 0) + 'deg)',
    transition: { duration: 0.2, ease: 'easeOut' }
  } : undefined;

  const tapAnimation = !faceDown && card && !prefersReducedMotion ? { 
    transform: 'translateY(-10px) scale(1.08) rotateY(' + (isFlipped ? 180 : 0) + 'deg)',
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
        transform: 'translateZ(0)'
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
          className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-500 shadow-lg"
          data-testid="card-back"
        >
          <svg
            viewBox="0 0 169.075 244.640"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <use href={`${svgCardsPath}#back`} fill="#0062ff" />
          </svg>
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
        <div 
          className={`w-full h-full rounded-lg overflow-hidden border-2 border-gray-500 shadow-lg relative ${isTouched ? 'ring-2 ring-poker-chipGold ring-opacity-50' : ''}`}
          data-testid={`card-${card.id}`}
        >
          {/* Colorblind-friendly suit indicator badge (only in colorblind mode) */}
          {colorblindMode && getSuitIndicator()}
          
          {/* SVG Card from professional deck */}
          <svg
            viewBox="0 0 169.075 244.640"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <use href={`${svgCardsPath}#${cardSvgId}`} />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}