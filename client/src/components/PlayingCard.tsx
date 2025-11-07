import { Card } from '@shared/schema';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import cardSpriteSheet from '@assets/Cards/On Table.png';

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

// Calculate sprite position for a card
const getCardSpritePosition = (card: Card): { x: number, y: number } => {
  // Card dimensions in the sprite sheet
  const cardWidth = 79; // Width of each card in the sprite
  const cardHeight = 123; // Height of each card in the sprite
  
  // Map suits to row indices (0-3)
  const suitToRow: Record<string, number> = {
    'H': 0, // Hearts - Row 0
    'S': 1, // Spades - Row 1
    'D': 2, // Diamonds - Row 2
    'C': 3  // Clubs - Row 3
  };
  
  // Map ranks to column indices (0-12)
  const rankToCol: Record<string, number> = {
    '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5,
    '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
  };
  
  const row = suitToRow[card.suit] || 0;
  const col = rankToCol[card.rank] || 0;
  
  return {
    x: col * cardWidth,
    y: row * cardHeight
  };
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
  // Debug logging
  if (card) {
    console.log('[PlayingCard] Rendering card:', {
      card: `${card.rank}-${card.suit}`,
      faceDown,
      animateFlip,
      spritePosition: getCardSpritePosition(card)
    });
  }
  
  const [isFlipped, setIsFlipped] = useState(!animateFlip);
  const [isDealt, setIsDealt] = useState(!animateDeal);
  const [isTouched, setIsTouched] = useState(false);
  const [cardDimensions, setCardDimensions] = useState({ width: '70px', height: '100px' });
  const { playSound } = useSound();
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const animationStateRef = useRef({ willChange: false });
  const [settleBounceKey, setSettleBounceKey] = useState<number>(0);
  const [pinchActive, setPinchActive] = useState(false);
  const [peekActive, setPeekActive] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showGlow, setShowGlow] = useState(false);
  const [show3DFlip, setShow3DFlip] = useState(false);

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
        setShow3DFlip(true);
        if (!prefersReducedMotion) {
          playSound('card-flip', { volume: 0.12 });
          // Add glow pulse effect on flip
          setShowGlow(true);
          setTimeout(() => setShowGlow(false), 2000);
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
        setCardDimensions({ width: '70px', height: '100px' });  // lg
      } else if (vw >= 768) {
        setCardDimensions({ width: '65px', height: '93px' });   // md
      } else if (vw >= 640) {
        setCardDimensions({ width: '62px', height: '88px' });   // sm
      } else if (vw >= 480) {
        setCardDimensions({ width: '58px', height: '82px' });  // xs - optimized for mobile
      } else {
        setCardDimensions({ width: '56px', height: '80px' });   // mobile
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, []);

  if (!card) {
    return (
      <div 
        className={`card-empty-slot rounded-lg ${className}`}
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
        return <div className={`${baseClass} rounded-full shadow-sm`} style={{ backgroundColor: '#1F2937' }} aria-label="Spades indicator" />;
      case 'H': // Hearts - Square (filled) 
        return <div className={`${baseClass} shadow-sm`} style={{ backgroundColor: '#EF4444' }} aria-label="Hearts indicator" />;
      case 'D': // Diamonds - Diamond shape (rotated square)
        return <div className={`${baseClass} transform rotate-45 shadow-sm`} style={{ backgroundColor: '#EF4444' }} aria-label="Diamonds indicator" />;
      case 'C': // Clubs - Circle (outline)
        return <div className={`${baseClass} rounded-full border-2 bg-white shadow-sm`} style={{ borderColor: '#1F2937' }} aria-label="Clubs indicator" />;
      default:
        return null;
    }
  };

  // Determine the actual rotation based on both faceDown and isFlipped
  // faceDown=true means show back (0deg), faceDown=false means show front (180deg)
  // But we also need to consider the flip animation for human players
  const getCardRotation = () => {
    if (faceDown) {
      return 0; // Show card back
    }
    return isFlipped ? 180 : 0; // For face-up cards, use flip animation state
  };

  const getInitialState = () => {
    const rotation = getCardRotation();
    if (prefersReducedMotion) {
      // No animation for reduced motion
      return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${rotation}deg)` };
    }
    
    if (animateDeal) {
      // Use translate3d for GPU acceleration, start from deck position
      return { opacity: 0, transform: `translate3d(0, -400px, 0) scale(0.5) rotateY(${rotation}deg)` };
    }
    return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${rotation}deg)` };
  };

  const getAnimateState = () => {
    const rotation = getCardRotation();
    if (prefersReducedMotion) {
      // No animation for reduced motion
      return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${rotation}deg)` };
    }
    
    if (animateDeal && !isDealt) {
      return getInitialState();
    }
    return { opacity: 1, transform: `translate3d(0, 0, 0) scale(1) rotateY(${rotation}deg)` };
  };

  const spritePosition = card ? getCardSpritePosition(card) : { x: 0, y: 0 };
  
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
  const rotation = getCardRotation();
  const hoverAnimation = !faceDown && !prefersReducedMotion ? { 
    transform: `translate3d(0, -4px, 0) scale(1.02) rotateY(${rotation}deg)`,
    transition: { duration: 0.3, ease: 'easeOut' }
  } : undefined;

  const tapAnimation = !faceDown && card && !prefersReducedMotion ? { 
    transform: `translate3d(0, -6px, 0) scale(1.03) rotateY(${rotation}deg)`,
    transition: { duration: 0.15 }
  } : undefined;

  // Determine if this is a winning card
  const isWinningCard = highlight;
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative playing-card-border ${isWinningCard ? 'playing-card-winning' : ''} ${isHovered && !prefersReducedMotion ? 'playing-card-hover' : ''} ${show3DFlip ? 'card-3d-flip' : ''} ${animateDeal ? 'card-slide-deal' : ''} ${showGlow ? 'card-glow-pulse' : ''} ${!prefersReducedMotion ? 'hover-parallax' : ''} ${className}`}
      style={{ 
        width: cardDimensions.width, 
        height: cardDimensions.height,
        minWidth: cardDimensions.width,
        minHeight: cardDimensions.height,
        flexShrink: 0,
        transformStyle: 'preserve-3d',
        borderRadius: '8px',
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          className="w-full h-full rounded-lg overflow-hidden shadow-card-3d border"
          style={{
            backgroundImage: `url('${cardSpriteSheet}')`,
            backgroundPosition: '316px 492px', // Position for card back (red pattern)
            backgroundSize: '1027px 615px', // Full sprite sheet size
            borderColor: 'rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
          data-testid="card-back"
        >
          {/* Gloss overlay for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
          
          {/* Inner glow border */}
          <div className="absolute inset-[1px] rounded-md border border-white/10 pointer-events-none" 
            style={{
              boxShadow: 'inset 0 0 15px rgba(255,255,255,0.05)'
            }}
          />
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
          className={`w-full h-full playing-card rounded-lg overflow-hidden relative bg-white ${isTouched ? 'ring-2 ring-purple-500/50' : ''}`}
          data-testid={`card-${card.id}`}
          key={settleBounceKey}
          initial={prefersReducedMotion ? {} : { y: 0, scale: 1 }}
          animate={prefersReducedMotion ? {} : { y: [0, -3], scale: peekActive ? 1.15 : 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut', repeat: 1, repeatType: "reverse" }}
        >
          {/* Colorblind-friendly suit indicator badge (only in colorblind mode) */}
          {colorblindMode && getSuitIndicator()}
          
          {/* Card face using sprite sheet */}
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url('${cardSpriteSheet}')`,
              backgroundPosition: `-${spritePosition.x}px -${spritePosition.y}px`,
              backgroundSize: '1027px 615px', // Full sprite sheet size
              imageRendering: 'crisp-edges',
              filter: 'contrast(1.1) brightness(1.02)'
            }}
          />
          
          {/* Subtle inner highlight for depth */}
          <div className="absolute inset-[1px] rounded-md border border-white/50 pointer-events-none" />
          
          {/* Gloss effect for premium card feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 pointer-events-none" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}