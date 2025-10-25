import { Card } from '@shared/schema';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSound } from '@/hooks/useSound';
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

  useEffect(() => {
    if (animateFlip) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
        playSound('card-flip', { volume: 0.12 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [animateFlip, playSound]);

  useEffect(() => {
    if (animateDeal) {
      const timer = setTimeout(() => {
        setIsDealt(true);
        playSound('card-deal', { volume: 0.1 });
      }, dealDelay);
      return () => clearTimeout(timer);
    }
  }, [animateDeal, dealDelay, playSound]);

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
        setCardDimensions({ width: '100px', height: '143px' });  // xs
      } else {
        setCardDimensions({ width: '90px', height: '129px' });   // mobile
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
    if (animateDeal) {
      return { opacity: 0, scale: 0.3, y: -300, rotateY: 0 };
    }
    return { opacity: 1, scale: 1, y: 0, rotateY: isFlipped ? 180 : 0 };
  };

  const getAnimateState = () => {
    if (animateDeal && !isDealt) {
      return getInitialState();
    }
    return { opacity: 1, scale: 1, y: 0, rotateY: isFlipped ? 180 : 0 };
  };

  const cardSvgId = card ? getCardSvgId(card) : '';

  // Handle touch interactions for mobile
  const handleTouchStart = () => {
    if (!faceDown && card) {
      setIsTouched(true);
      playSound('button-click', { volume: 0.08 });
    }
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };


  return (
    <motion.div
      className={`relative ${className}`}
      style={{ 
        width: cardDimensions.width, 
        height: cardDimensions.height,
        minWidth: cardDimensions.width,
        minHeight: cardDimensions.height,
        flexShrink: 0,
        transformStyle: 'preserve-3d'
      }}
      initial={getInitialState()}
      animate={getAnimateState()}
      transition={{ 
        duration: animateDeal ? 0.8 : 0.4, 
        ease: animateDeal ? [0.4, 0, 0.2, 1] : "easeInOut",
        delay: animateDeal ? dealDelay / 1000 : 0
      }}
      whileHover={!faceDown ? { 
        y: -8, 
        scale: 1.05,
        transition: { duration: 0.2, ease: 'easeOut' }
      } : undefined}
      whileTap={!faceDown && card ? { 
        scale: 1.08,
        y: -10,
        transition: { duration: 0.1 }
      } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card Back */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ backfaceVisibility: 'hidden' }}
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
        style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
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
