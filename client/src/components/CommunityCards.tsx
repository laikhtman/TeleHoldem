import { Card } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { useEffect, useState } from 'react';

interface CommunityCardsProps {
  cards: Card[];
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(5).fill(false));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    cards.forEach((_, index) => {
      if (!flippedCards[index]) {
        timers.push(setTimeout(() => {
          setFlippedCards(prev => {
            const newFlipped = [...prev];
            newFlipped[index] = true;
            return newFlipped;
          });
        }, index * 200));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [cards, flippedCards]);

  return (
    <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="flex gap-3" data-testid="community-cards">
        {[0, 1, 2, 3, 4].map((index) => (
          <PlayingCard 
            key={index}
            card={cards[index]}
            animateFlip={!!cards[index] && !flippedCards[index]}
            className={cards[index] ? 'shadow-lg' : ''}
          />
        ))}
      </div>
    </div>
  );
}
