import { Card, getCardColor } from '@shared/schema';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSound } from '@/hooks/useSound';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
  animateFlip?: boolean;
  animateDeal?: boolean;
  dealDelay?: number;
  colorblindMode?: boolean;
}

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

// Get the suit pattern layout for the card center
const getSuitPattern = (rank: string, suit: string) => {
  const symbol = getSuitSymbol(suit);
  const positions: { top: string; left: string }[] = [];

  switch (rank) {
    case 'A':
      positions.push({ top: '50%', left: '50%' });
      break;
    case '2':
      positions.push({ top: '25%', left: '50%' }, { top: '75%', left: '50%' });
      break;
    case '3':
      positions.push(
        { top: '25%', left: '50%' },
        { top: '50%', left: '50%' },
        { top: '75%', left: '50%' }
      );
      break;
    case '4':
      positions.push(
        { top: '25%', left: '30%' },
        { top: '25%', left: '70%' },
        { top: '75%', left: '30%' },
        { top: '75%', left: '70%' }
      );
      break;
    case '5':
      positions.push(
        { top: '25%', left: '30%' },
        { top: '25%', left: '70%' },
        { top: '50%', left: '50%' },
        { top: '75%', left: '30%' },
        { top: '75%', left: '70%' }
      );
      break;
    case '6':
      positions.push(
        { top: '25%', left: '30%' },
        { top: '25%', left: '70%' },
        { top: '50%', left: '30%' },
        { top: '50%', left: '70%' },
        { top: '75%', left: '30%' },
        { top: '75%', left: '70%' }
      );
      break;
    case '7':
      positions.push(
        { top: '20%', left: '30%' },
        { top: '20%', left: '70%' },
        { top: '37.5%', left: '50%' },
        { top: '55%', left: '30%' },
        { top: '55%', left: '70%' },
        { top: '80%', left: '30%' },
        { top: '80%', left: '70%' }
      );
      break;
    case '8':
      positions.push(
        { top: '20%', left: '30%' },
        { top: '20%', left: '70%' },
        { top: '37.5%', left: '50%' },
        { top: '55%', left: '30%' },
        { top: '55%', left: '70%' },
        { top: '62.5%', left: '50%' },
        { top: '80%', left: '30%' },
        { top: '80%', left: '70%' }
      );
      break;
    case '9':
      positions.push(
        { top: '18%', left: '30%' },
        { top: '18%', left: '70%' },
        { top: '35%', left: '30%' },
        { top: '35%', left: '70%' },
        { top: '50%', left: '50%' },
        { top: '65%', left: '30%' },
        { top: '65%', left: '70%' },
        { top: '82%', left: '30%' },
        { top: '82%', left: '70%' }
      );
      break;
    case '10':
      positions.push(
        { top: '18%', left: '30%' },
        { top: '18%', left: '70%' },
        { top: '30%', left: '50%' },
        { top: '42%', left: '30%' },
        { top: '42%', left: '70%' },
        { top: '58%', left: '30%' },
        { top: '58%', left: '70%' },
        { top: '70%', left: '50%' },
        { top: '82%', left: '30%' },
        { top: '82%', left: '70%' }
      );
      break;
    default: // Face cards (J, Q, K)
      return (
        <div className="text-5xl font-bold flex items-center justify-center h-full">
          {rank}
        </div>
      );
  }

  return (
    <div className="absolute inset-0">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute text-2xl font-bold transform -translate-x-1/2 -translate-y-1/2"
          style={{ top: pos.top, left: pos.left }}
        >
          {symbol}
        </div>
      ))}
    </div>
  );
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

  const color = getCardColor(card.suit);
  const colorClass = color === 'red' ? 'text-poker-cardRed' : 'text-poker-cardBlack';
  const suitSymbol = getSuitSymbol(card.suit);
  
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

  return (
    <motion.div
      className={`relative w-[70px] h-[100px] ${className}`}
      initial={getInitialState()}
      animate={getAnimateState()}
      transition={{ 
        duration: animateDeal ? 0.6 : 0.4, 
        ease: animateDeal ? "easeOut" : "easeInOut",
        delay: animateDeal ? dealDelay / 1000 : 0
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Back */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div 
          className="w-full h-full rounded-md bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-900 flex items-center justify-center"
          data-testid="card-back"
        >
          <div className="w-full h-full p-2 flex items-center justify-center">
            <div className="w-full h-full border-2 border-blue-400/30 rounded-sm" />
          </div>
        </div>
      </motion.div>
      
      {/* Card Front */}
      <motion.div 
        className="absolute w-full h-full"
        style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
      >
        <div 
          className={`w-full h-full rounded-md bg-poker-cardBg border-2 border-gray-300 shadow-md relative overflow-hidden`}
          data-testid={`card-${card.id}`}
        >
          {/* Colorblind-friendly suit indicator badge (only in colorblind mode) */}
          {colorblindMode && getSuitIndicator()}
          
          {/* Top-left corner index */}
          <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${colorClass}`}>
            <div className="text-xs font-bold">{card.rank}</div>
            <div className="text-sm">{suitSymbol}</div>
          </div>
          
          {/* Bottom-right corner index (rotated) */}
          <div className={`absolute bottom-1 right-1 flex flex-col items-center leading-none ${colorClass} rotate-180`}>
            <div className="text-xs font-bold">{card.rank}</div>
            <div className="text-sm">{suitSymbol}</div>
          </div>
          
          {/* Card center pattern */}
          <div className={`absolute inset-0 ${colorClass}`}>
            {getSuitPattern(card.rank, card.suit)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
