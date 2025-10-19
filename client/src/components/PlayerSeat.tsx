import { Coins, Trophy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from './Chip';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { TurnTimer } from './TurnTimer';

interface PlayerSeatProps {
  player: Player;
// ... (rest of the component)
        </AnimatePresence>
        
        <AnimatePresence>
          {isCurrentPlayer && isProcessing && !player.isHuman && (
            <TurnTimer duration={800} />
          )}
        </AnimatePresence>

        {isWinner && !showWinAmount && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-poker-chipGold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            WINNER
          </div>
        {/* Player info */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-sm font-semibold text-white">
              {player.name}
            </div>
            {isDealer && (
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                D
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 text-poker-chipGold font-mono font-bold">
            <Coins className="w-4 h-4" />
            <span data-testid={`player-chips-${player.id}`}>${animatedChipCount}</span>
          </div>
          {player.bet > 0 && (
            <div className="text-xs text-poker-success mt-1" data-testid={`player-bet-${player.id}`}>
              Bet: ${player.bet}
            </div>
          )}
          {player.folded && (
            <div className="text-xs text-destructive mt-1" data-testid={`player-folded-${player.id}`}>
              Folded
            </div>
          )}
          {player.allIn && (
            <div className="text-xs text-poker-chipGold mt-1 font-bold" data-testid={`player-allin-${player.id}`}>
              ALL IN!
            </div>
          )}
        </div>

        {/* Player cards */}
        <div className="flex gap-1 justify-center" data-testid={`player-cards-${player.id}`}>
          {player.hand.length > 0 && (
            <>
              <PlayingCard 
                card={player.hand[0]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="transform scale-90"
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && phase !== 'showdown'}
                animateDeal={phase === 'pre-flop'}
                dealDelay={position * 2 * 150 + 150}
                animateFlip={player.isHuman && phase === 'pre-flop'}
                className="transform scale-90"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
