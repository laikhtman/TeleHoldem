import { Card, getCardColor } from '@shared/schema';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
  animateFlip?: boolean;
}

export function PlayingCard({ card, faceDown = false, className = '', animateFlip = false }: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(!animateFlip);

  useEffect(() => {
    if (animateFlip) {
      const timer = setTimeout(() => setIsFlipped(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateFlip]);

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

  return (
    <motion.div
      className={`relative w-[70px] h-[100px] ${className}`}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
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
      <motion.div 
        className="absolute w-full h-full"
        style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
      >
        <div 
          className={`w-full h-full rounded-md bg-poker-cardBg border-2 border-gray-300 shadow-md flex flex-col items-center justify-between p-2`}
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
      </motion.div>
    </motion.div>
  );
}
