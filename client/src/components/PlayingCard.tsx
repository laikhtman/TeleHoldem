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

  if (!card) {
    return (
      <div 
        className={`w-[70px] h-[100px] rounded-md border-2 border-dashed border-border/40 bg-background/20 ${className}`}
        data-testid="card-placeholder"
      />
    );
  }

  // Colorblind-friendly suit indicators (small geometric shapes)
  const getSuitIndicator = () => {
    const baseClass = "absolute top-1 right-1 w-2.5 h-2.5 z-10";
    switch (card.suit) {
      case 'S': // Spades - Circle (filled)
        return <div className={`${baseClass} rounded-full bg-poker-cardBlack`} aria-label="Spades indicator" />;
      case 'H': // Hearts - Square (filled) 
        return <div className={`${baseClass} bg-poker-cardRed`} aria-label="Hearts indicator" />;
      case 'D': // Diamonds - Diamond shape (rotated square)
        return <div className={`${baseClass} bg-poker-cardRed transform rotate-45`} aria-label="Diamonds indicator" />;
      case 'C': // Clubs - Circle (outline)
        return <div className={`${baseClass} rounded-full border-2 border-poker-cardBlack bg-white`} aria-label="Clubs indicator" />;
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

  return (
    <motion.div
      className={`relative w-[70px] h-[100px] ${className}`}
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
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Back */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div 
          className="w-full h-full rounded-md overflow-hidden border border-gray-400 shadow-md"
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
          className={`w-full h-full rounded-md overflow-hidden border border-gray-400 shadow-md relative`}
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
