import { useState, useEffect } from 'react';
import { GameState, GamePhase } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
import { PlayerSeat } from '@/components/PlayerSeat';
import { CommunityCards } from '@/components/CommunityCards';
import { PotDisplay } from '@/components/PotDisplay';
import { ActionControls } from '@/components/ActionControls';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const NUM_PLAYERS = 6;

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize game
    const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
    setGameState(initialState);
  }, []);

  const startNewHand = () => {
    if (!gameState) return;
    
    const newState = gameEngine.startNewHand(gameState);
    setGameState(newState);
    
    toast({
      title: "New Hand",
      description: "Cards have been dealt. Good luck!",
    });

    // After dealing, start bot actions if human is not first
    if (newState.currentPlayerIndex !== 0) {
      setTimeout(() => processBotActions(newState), 1000);
    }
  };

  const processBotActions = async (state: GameState) => {
    setIsProcessing(true);
    let currentState = state;

    while (currentState.currentPlayerIndex !== 0 && !gameEngine.isRoundComplete(currentState)) {
      const currentPlayer = currentState.players[currentState.currentPlayerIndex];
      
      if (currentPlayer.folded) {
        currentState = {
          ...currentState,
          currentPlayerIndex: gameEngine.getNextPlayerIndex(currentState)
        };
        continue;
      }

      // Get bot action
      const botAction = botAI.getAction(currentPlayer, currentState);
      
      // Apply action
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (botAction.action === 'fold') {
        currentState = gameEngine.playerFold(currentState, currentState.currentPlayerIndex);
      } else if (botAction.action === 'check') {
        currentState = gameEngine.playerCheck(currentState, currentState.currentPlayerIndex);
      } else if (botAction.action === 'bet' || botAction.action === 'call' || botAction.action === 'raise') {
        currentState = gameEngine.playerBet(currentState, currentState.currentPlayerIndex, botAction.amount || 0);
      }

      toast({
        description: currentState.lastAction || '',
        duration: 2000,
      });

      // Move to next player
      currentState = {
        ...currentState,
        currentPlayerIndex: gameEngine.getNextPlayerIndex(currentState)
      };

      setGameState({ ...currentState });
    }

    // Check if round is complete
    if (gameEngine.isRoundComplete(currentState)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentState.phase !== 'showdown') {
        currentState = gameEngine.advancePhase(currentState);
        setGameState({ ...currentState });
        
        toast({
          title: getPhaseTitle(currentState.phase),
          description: getPhaseDescription(currentState.phase),
        });

        // Continue with bot actions in new phase
        if (currentState.currentPlayerIndex !== 0) {
          setTimeout(() => processBotActions(currentState), 1000);
        }
      }
    }

    setIsProcessing(false);
  };

  const handleFold = () => {
    if (!gameState || isProcessing) return;
    
    const newState = gameEngine.playerFold(gameState, 0);
    setGameState(newState);
    
    toast({
      description: "You folded",
      variant: "destructive",
    });

    // Move to next player and process bots
    const nextState = {
      ...newState,
      currentPlayerIndex: gameEngine.getNextPlayerIndex(newState)
    };
    setGameState(nextState);
    setTimeout(() => processBotActions(nextState), 500);
  };

  const handleCheck = () => {
    if (!gameState || isProcessing) return;
    
    const newState = gameEngine.playerCheck(gameState, 0);
    setGameState(newState);
    
    toast({
      description: "You checked",
    });

    // Move to next player and process bots
    const nextState = {
      ...newState,
      currentPlayerIndex: gameEngine.getNextPlayerIndex(newState)
    };
    setGameState(nextState);
    setTimeout(() => processBotActions(nextState), 500);
  };

  const handleBet = (amount: number) => {
    if (!gameState || isProcessing) return;
    
    const newState = gameEngine.playerBet(gameState, 0, amount);
    setGameState(newState);
    
    toast({
      description: `You bet $${amount}`,
    });

    // Move to next player and process bots
    const nextState = {
      ...newState,
      currentPlayerIndex: gameEngine.getNextPlayerIndex(newState)
    };
    setGameState(nextState);
    setTimeout(() => processBotActions(nextState), 500);
  };

  const getPhaseTitle = (phase: GamePhase): string => {
    const titles: Record<GamePhase, string> = {
      'waiting': 'Waiting',
      'pre-flop': 'Pre-Flop',
      'flop': 'Flop',
      'turn': 'Turn',
      'river': 'River',
      'showdown': 'Showdown'
    };
    return titles[phase];
  };

  const getPhaseDescription = (phase: GamePhase): string => {
    const descriptions: Record<GamePhase, string> = {
      'waiting': 'Click "Start New Hand" to begin',
      'pre-flop': 'Initial betting round',
      'flop': 'Three community cards dealt',
      'turn': 'Fourth community card dealt',
      'river': 'Fifth community card dealt',
      'showdown': 'Revealing hands'
    };
    return descriptions[phase];
  };

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const humanPlayer = gameState.players[0];
  const canCheck = gameState.currentBet === 0 || gameState.currentBet === humanPlayer.bet;
  const minBet = gameState.currentBet - humanPlayer.bet || 10;
  const maxBet = humanPlayer.chips;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      {/* Poker Table */}
      <div 
        className="relative bg-poker-felt rounded-[200px] border-[10px] border-poker-tableBorder shadow-2xl"
        style={{ 
          width: '800px', 
          height: '500px',
          background: 'radial-gradient(ellipse at center, hsl(var(--poker-felt-light)), hsl(var(--poker-felt)))'
        }}
        data-testid="poker-table"
      >
        {/* Community Cards */}
        <CommunityCards cards={gameState.communityCards} />

        {/* Pot Display */}
        <PotDisplay amount={gameState.pot} />

        {/* Player Seats */}
        {gameState.players.map((player, index) => (
          <PlayerSeat
            key={player.id}
            player={player}
            position={index}
            totalPlayers={NUM_PLAYERS}
            isCurrentPlayer={index === gameState.currentPlayerIndex}
            isDealer={index === gameState.dealerIndex}
          />
        ))}

        {/* Game Phase Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <div className="text-sm text-white font-semibold" data-testid="text-game-phase">
              {getPhaseTitle(gameState.phase)}
            </div>
          </div>
        </div>

        {/* Last Action */}
        {gameState.lastAction && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <div className="text-xs text-white" data-testid="text-last-action">
                {gameState.lastAction}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full max-w-2xl">
        {gameState.phase === 'waiting' ? (
          <Button 
            onClick={startNewHand}
            size="lg"
            className="w-full bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold text-lg"
            data-testid="button-start-hand"
          >
            Start New Hand
          </Button>
        ) : (
          <ActionControls
            onFold={handleFold}
            onCheck={handleCheck}
            onBet={handleBet}
            canCheck={canCheck}
            minBet={minBet}
            maxBet={maxBet}
            disabled={gameState.currentPlayerIndex !== 0 || isProcessing || humanPlayer.folded}
          />
        )}
      </div>
    </div>
  );
}
