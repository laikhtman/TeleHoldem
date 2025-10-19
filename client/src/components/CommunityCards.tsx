import { Card, GamePhase } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSkeleton } from './ui/card-skeleton';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  const [revealedCards, setRevealedCards] = useState<boolean[]>(new Array(5).fill(false));
  const [previousCardCount, setPreviousCardCount] = useState(0);
  const [showGlow, setShowGlow] = useState(false);
  const [cardIdentities, setCardIdentities] = useState<string[]>([]);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [prevPhase, setPrevPhase] = useState(phase);

  useEffect(() => {
    if (phase !== prevPhase) {
      if (phase === 'flop' || phase === 'turn' || phase === 'river') {
        setShowSkeletons(true);
        const timer = setTimeout(() => {
          setShowSkeletons(false);
        }, 400); // Show skeletons for 400ms
        setPrevPhase(phase);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, prevPhase]);

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
        // Show glow effect when new cards arrive
        setShowGlow(true);
        timers.push(setTimeout(() => setShowGlow(false), 1500));
        
        // Animate new cards
        for (let i = startIndex; i < currentCardCount; i++) {
          if (currentIdentities[i] && currentIdentities[i] !== cardIdentities[i]) {
            const delay = (i - startIndex) * 200;
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
  }, [cards, previousCardCount, cardIdentities]);

    const getCardAnimation = (index: number) => {
      if (!cards[index] || revealedCards[index] || showSkeletons) {
        return {};
      }
  
      if (index <= 2) {
        return {
          initial: { opacity: 0, y: -50 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: "easeOut" }
        };
      } else {
        return {
          initial: { opacity: 0, x: 80, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          transition: { duration: 0.3, ease: "easeOut" }
        };
      }
    };
  
    const skeletonsToShow = phase === 'flop' ? 3 : phase === 'turn' ? 1 : phase === 'river' ? 1 : 0;
    const skeletonStartIndex = phase === 'flop' ? 0 : phase === 'turn' ? 3 : phase === 'river' ? 4 : 0;
  
    return (
      <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          {/* Glow effect container */}
          <AnimatePresence>
            {showGlow && (
              <motion.div
                className="absolute inset-0 -m-8 rounded-xl pointer-events-none"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: [0, 1, 0.5, 0],
                  scale: [0.9, 1.05, 1, 0.95]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                  boxShadow: '0 0 40px 10px rgba(255, 215, 0, 0.5), 0 0 80px 20px rgba(255, 215, 0, 0.3)',
                }}
              />
            )}
          </AnimatePresence>
  
          {/* Cards */}
          <div className="flex gap-3 relative" data-testid="community-cards">
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
                >
                  {isSkeletonVisible ? (
                    <CardSkeleton data-testid={`community-card-skeleton-${index}`} />
                  ) : (
                    <PlayingCard 
                      card={cards[index]}
                      animateFlip={hasCard && !revealedCards[index]}
                      className={hasCard ? 'shadow-lg' : ''}
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
