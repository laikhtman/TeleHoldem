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
        setCardDimensions({ width: '75px', height: '107px' });  // lg
      } else if (vw >= 768) {
        setCardDimensions({ width: '70px', height: '100px' });   // md
      } else if (vw >= 640) {
        setCardDimensions({ width: '65px', height: '93px' });   // sm
      } else if (vw >= 480) {
        setCardDimensions({ width: '60px', height: '86px' });  // xs - optimized for mobile
      } else {
        setCardDimensions({ width: '60px', height: '86px' });   // mobile - 60px × 86px as requested
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
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            borderColor: 'rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
          data-testid="card-back"
        >
          {/* Geometric pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <pattern id="geometric-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <polygon points="10,0 20,10 10,20 0,10" fill="rgba(255,255,255,0.1)" />
                  <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.15)" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#geometric-pattern)" />
            </svg>
          </div>
          
          {/* Center logo/design */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full" 
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1), 0 0 30px rgba(236, 72, 153, 0.4)'
              }}>
              <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-xl">
                ♠
              </div>
            </div>
          </div>
          
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
          className={`w-full h-full playing-card rounded-lg overflow-hidden relative ${isTouched ? 'ring-2 ring-purple-500/50' : ''}`}
          data-testid={`card-${card.id}`}
          key={settleBounceKey}
          initial={prefersReducedMotion ? {} : { y: 0, scale: 1 }}
          animate={prefersReducedMotion ? {} : { y: [0, -3], scale: peekActive ? 1.15 : 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut', repeat: 1, repeatType: "reverse" }}
        >
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
          
          {/* Update SVG suit colors */}
          <style dangerouslySetInnerHTML={{ __html: `
            svg .red { fill: #EF4444; }
            svg .black { fill: #1F2937; }
            svg [fill="red"] { fill: #EF4444; }
            svg [fill="black"] { fill: #1F2937; }
          ` }} />
          
          {/* Subtle inner highlight for depth */}
          <div className="absolute inset-[1px] rounded-md border border-white/50 pointer-events-none" />
          
          {/* Gloss effect for premium card feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 pointer-events-none" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
