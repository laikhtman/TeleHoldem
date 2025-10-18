import { Card } from '@shared/schema';
import { PlayingCard } from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex gap-3" data-testid="community-cards">
        {[0, 1, 2, 3, 4].map((index) => (
          <PlayingCard 
            key={index}
            card={cards[index]}
            className={cards[index] ? 'shadow-lg' : ''}
          />
        ))}
      </div>
    </div>
  );
}
