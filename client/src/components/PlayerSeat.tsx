import { Player } from '@shared/schema';
import { PlayingCard } from './PlayingCard';
import { Coins, Trophy } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  position: number;
  totalPlayers: number;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  isWinner: boolean;
}

export function PlayerSeat({ player, position, totalPlayers, isCurrentPlayer, isDealer, isWinner }: PlayerSeatProps) {
  // Calculate position around oval table using trigonometry
  const getPosition = () => {
    const tableWidth = 800;
    const tableHeight = 500;
    const radiusX = tableWidth / 2 - 80;
    const radiusY = tableHeight / 2 - 60;
    
    // Distribute players around oval
    const angle = (position / totalPlayers) * 2 * Math.PI - Math.PI / 2;
    
    const x = Math.cos(angle) * radiusX + tableWidth / 2;
    const y = Math.sin(angle) * radiusY + tableHeight / 2;
    
    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)'
    };
  };

  const seatClasses = [
    'rounded-lg p-3 backdrop-blur-sm transition-all duration-300',
    isCurrentPlayer ? 'bg-black/80 border-2 border-poker-chipGold animate-pulse-glow' : 'bg-black/70 border border-white/20',
    isWinner ? 'bg-poker-chipGold/20 border-2 border-poker-chipGold shadow-lg' : ''
  ].join(' ');

  return (
    <div
      className="absolute z-10"
      style={getPosition()}
      data-testid={`player-seat-${player.id}`}
    >
      <div className={seatClasses}>
        {isWinner && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-poker-chipGold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            WINNER
          </div>
        )}
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
            <span data-testid={`player-chips-${player.id}`}>${player.chips}</span>
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
                faceDown={!player.isHuman && !isWinner}
                className="transform scale-90"
              />
              <PlayingCard 
                card={player.hand[1]} 
                faceDown={!player.isHuman && !isWinner}
                className="transform scale-90"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
