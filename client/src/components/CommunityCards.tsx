import { Card, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSkeleton } from './ui/card-skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
  colorblindMode?: boolean;
  highlightIds?: Set<string>;
}

const MAX_CONCURRENT_ANIMATIONS = 3; // Limit concurrent card animations

export function CommunityCards({ cards, phase, colorblindMode = false, highlightIds }: CommunityCardsProps) {
  const [revealedCards, setRevealedCards] = useState<boolean[]>(new Array(5).fill(false));
  const [previousCardCount, setPreviousCardCount] = useState(0);
  const [showGlow, setShowGlow] = useState(false);
  const [cardIdentities, setCardIdentities] = useState<string[]>([]);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [prevPhase, setPrevPhase] = useState(phase);
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle will-change for performance
  useEffect(() => {
    if (showGlow && containerRef.current && !prefersReducedMotion) {
      containerRef.current.style.willChange = 'transform, opacity';
      
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.willChange = 'auto';
        }
      }, 2000); // Glow duration + buffer
      
      return () => {
        clearTimeout(timer);
        if (containerRef.current) {
          containerRef.current.style.willChange = 'auto';
        }
      };
    }
  }, [showGlow, prefersReducedMotion]);

  useEffect(() => {
    if (phase !== prevPhase) {
      if (phase === 'flop' || phase === 'turn' || phase === 'river') {
        if (!prefersReducedMotion) {
          setShowSkeletons(true);
          const timer = setTimeout(() => {
            setShowSkeletons(false);
          }, 400); // Show skeletons for 400ms
          setPrevPhase(phase);
          return () => clearTimeout(timer);
        } else {
          setPrevPhase(phase);
        }
      }
    }
  }, [phase, prevPhase, prefersReducedMotion]);

  useEffect(() => {
    if (showSkeletons) return; // Don't run card animations while skeletons are visible

    const currentCardCount = cards.length;
    const currentIdentities = cards.map(c => c ? `${c.rank}-${c.suit}` : '');
    
    // Reset state when cards shrink (new hand starts)
    if (currentCardCount < previousCardCount) {
      setRevealedCards(new Array(5).fill(false));
      setPreviousCardCount(0);
      setCardIdentities([]);
      return;
    }
    
    // Check if new cards have been dealt (compare identities, not just count)
    const hasNewCards = currentCardCount > previousCardCount || 
      currentIdentities.some((id, idx) => id && id !== cardIdentities[idx]);
    
    if (hasNewCards && currentCardCount > 0) {
      const timers: NodeJS.Timeout[] = [];
      
      // Reset revealed flags for cards with changed identities
      setRevealedCards(prev => {
        const newRevealed = [...prev];
        currentIdentities.forEach((id, idx) => {
          if (id && id !== cardIdentities[idx]) {
            newRevealed[idx] = false;
          }
        });
        return newRevealed;
      });
      
      // Determine which cards are new
      const startIndex = currentIdentities.findIndex((id, idx) => 
        id && (!cardIdentities[idx] || id !== cardIdentities[idx])
      );
      
      if (startIndex !== -1) {
        // Show glow effect when new cards arrive (skip for reduced motion)
        if (!prefersReducedMotion) {
          setShowGlow(true);
          timers.push(setTimeout(() => setShowGlow(false), 1500));
        }
        
        // Animate new cards with staggering (instant for reduced motion)
        const cardsToAnimate = currentCardCount - startIndex;
        const staggerDelay = prefersReducedMotion ? 0 : 
          Math.min(200, 800 / Math.max(1, cardsToAnimate)); // Dynamic stagger based on card count
        
        for (let i = startIndex; i < currentCardCount; i++) {
          if (currentIdentities[i] && currentIdentities[i] !== cardIdentities[i]) {
            const delay = prefersReducedMotion ? 0 : (i - startIndex) * staggerDelay;
            timers.push(setTimeout(() => {
              setRevealedCards(prev => {
                const newRevealed = [...prev];
                newRevealed[i] = true;
                return newRevealed;
              });
            }, delay));
          }
        }
      }
      
      setPreviousCardCount(currentCardCount);
      setCardIdentities(currentIdentities);
      return () => timers.forEach(clearTimeout);
    }
  }, [cards, previousCardCount, cardIdentities, prefersReducedMotion, showSkeletons]);

  const getCardAnimation = (index: number) => {
    if (!cards[index] || revealedCards[index] || showSkeletons || prefersReducedMotion) {
      return {};
    }

    // Use transform-only animations for better performance
    if (index <= 2) {
      return {
        initial: { opacity: 0, transform: 'translateY(-50px) translateZ(0)' },
        animate: { opacity: 1, transform: 'translateY(0) translateZ(0)' },
        transition: { duration: 0.4, ease: "easeOut" }
      };
    } else {
      return {
        initial: { opacity: 0, transform: 'translateX(80px) scale(0.95) translateZ(0)' },
        animate: { opacity: 1, transform: 'translateX(0) scale(1) translateZ(0)' },
        transition: { duration: 0.3, ease: "easeOut" }
      };
    }
  };

  const skeletonsToShow = phase === 'flop' ? 3 : phase === 'turn' ? 1 : phase === 'river' ? 1 : 0;
  const skeletonStartIndex = phase === 'flop' ? 0 : phase === 'turn' ? 3 : phase === 'river' ? 4 : 0;

  const getCardDescription = (index: number): string => {
    const card = cards[index];
    if (!card) return 'Empty card slot';
    return `${card.rank} of ${card.suit}`;
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
      style={{ 
        zIndex: 3,
        transform: 'translate3d(-50%, -50%, 0)' // Hardware acceleration
      }} 
      role="group" 
      aria-label="Community cards"
    >
      <div className={`relative community-cards-container community-cards-border ${cards.length > 0 ? '' : ''}`}>
        {/* Glow effect container */}
        <AnimatePresence>
          {showGlow && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 -m-8 xs:-m-10 sm:-m-8 rounded-2xl pointer-events-none"
              initial={{ opacity: 0, transform: 'scale(0.9)' }}
              animate={{
                opacity: [0, 1, 0.6, 0],
                transform: ['scale(0.9)', 'scale(1.1)', 'scale(1)', 'scale(0.95)']
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
                boxShadow: '0 0 50px 15px rgba(255, 215, 0, 0.6), 0 0 100px 30px rgba(255, 215, 0, 0.4)',
                transform: 'translateZ(0)' // Hardware acceleration
              }}
            />
          )}
        </AnimatePresence>

        {/* Cards - 6px gap as per design requirements */}
        <div className="flex gap-1.5 relative justify-center items-center" data-testid="community-cards">
          {[0, 1, 2, 3, 4].map((index) => {
            const hasCard = !!cards[index];
            const animation = getCardAnimation(index);
            const cardKey = hasCard ? `${cards[index].rank}-${cards[index].suit}-${index}` : `empty-${index}`;
            
            const isSkeletonVisible = showSkeletons && index >= skeletonStartIndex && index < skeletonStartIndex + skeletonsToShow;

            return (
              <motion.div 
                key={cardKey}
                {...animation}
                data-testid={hasCard ? `community-card-${index}` : `community-card-empty-${index}`}
                data-card-revealed={hasCard && revealedCards[index] && !isSkeletonVisible ? 'true' : 'false'}
                aria-label={getCardDescription(index)}
                style={{
                  transform: 'translateZ(0)' // Hardware acceleration
                }}
              >
                {isSkeletonVisible && !prefersReducedMotion ? (
                  <CardSkeleton data-testid={`community-card-skeleton-${index}`} />
                ) : (
                  <PlayingCard 
                    card={cards[index]}
                    animateFlip={hasCard && !revealedCards[index] && !prefersReducedMotion}
                    className={hasCard ? 'card-stagger-reveal' : ''}
                    highlight={!!(cards[index] && highlightIds && highlightIds.has(cards[index]!.id))}
                    colorblindMode={colorblindMode}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
