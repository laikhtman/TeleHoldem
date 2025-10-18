import { Card, getCardColor } from '@shared/schema';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
}

export function PlayingCard({ card, faceDown = false, className = '' }: PlayingCardProps) {
  if (!card) {
    return (
      <div 
        className={`w-[70px] h-[100px] rounded-md border-2 border-dashed border-border/40 bg-background/20 ${className}`}
        data-testid="card-placeholder"
      />
    );
  }

  if (faceDown) {
    return (
      <div 
        className={`w-[70px] h-[100px] rounded-md bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-900 flex items-center justify-center ${className}`}
        data-testid="card-back"
      >
        <div className="w-full h-full p-2 flex items-center justify-center">
          <div className="w-full h-full border-2 border-blue-400/30 rounded-sm" />
        </div>
      </div>
    );
  }

  const color = getCardColor(card.suit);
  const colorClass = color === 'red' ? 'text-poker-cardRed' : 'text-poker-cardBlack';

  return (
    <div 
      className={`w-[70px] h-[100px] rounded-md bg-poker-cardBg border-2 border-gray-300 shadow-md flex flex-col items-center justify-between p-2 animate-deal-card ${className}`}
      data-testid={`card-${card.id}`}
    >
      <div className={`text-sm font-bold ${colorClass} self-start`}>
        {card.rank}
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {card.suit}
      </div>
      <div className={`text-sm font-bold ${colorClass} self-end rotate-180`}>
        {card.rank}
      </div>
    </div>
  );
}
