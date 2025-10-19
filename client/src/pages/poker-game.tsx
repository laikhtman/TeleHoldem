import { useState, useEffect, useRef } from 'react';
import { GameState, GamePhase, Card, ActionHistoryEntry, PlayerAction } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
import { PlayerSeat } from '@/components/PlayerSeat';
import { CommunityCards } from '@/components/CommunityCards';
import { PotDisplay } from '@/components/PotDisplay';
import { ActionControls } from '@/components/ActionControls';
import { ActionHistory } from '@/components/ActionHistory';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { WinnerCelebration } from '@/components/WinnerCelebration';
import { HandStrengthIndicator } from '@/components/HandStrengthIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from '@/components/Chip';

const NUM_PLAYERS = 6;
const MAX_HISTORY_ENTRIES = 30;

interface FlyingChipData {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function addActionHistory(
  state: GameState,
  type: ActionHistoryEntry['type'],
  message: string,
  playerName?: string,
  action?: PlayerAction,
  amount?: number
): GameState {
  const newEntry: ActionHistoryEntry = {
    id: `${Date.now()}-${Math.random()}`,
    type,
    playerName,
    action,
    amount,
    phase: state.phase,
    timestamp: Date.now(),
    message
  };

  const updatedHistory = [...state.actionHistory, newEntry];
  const trimmedHistory = updatedHistory.slice(-MAX_HISTORY_ENTRIES);

  return {
    ...state,
    actionHistory: trimmedHistory
  };
}

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [winningPlayerIds, setWinningPlayerIds] = useState<string[]>([]);
  const [winAmounts, setWinAmounts] = useState<Record<string, number>>({});
  const [phaseKey, setPhaseKey] = useState(0);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [flyingChips, setFlyingChips] = useState<FlyingChipData[]>([]);
  const potPosition = useRef<{ x: number; y: number }>({ x: 400, y: 150 });
  const { toast } = useToast();

  useEffect(() => {
    if (phaseKey > 0) {
      setShowPhaseTransition(true);
      const timer = setTimeout(() => setShowPhaseTransition(false), 700);
      return () => clearTimeout(timer);
    }
  }, [phaseKey]);

  const handlePotRef = (node: HTMLDivElement | null) => {
    if (node) {
      const rect = node.getBoundingClientRect();
      potPosition.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
  };

  useEffect(() => {
    // Initialize game
    const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
    setGameState(initialState);
  }, []);

  const startNewHand = () => {
    if (!gameState) return;
    
    setWinningPlayerIds([]);
    setWinAmounts({});
    setFlyingChips([]);
    let newState = gameEngine.startNewHand(gameState);
    
    // Clear action history for new hand
    newState = { ...newState, actionHistory: [] };
    
    // Add new hand entry
    newState = addActionHistory(
      newState,
      'phase-change',
      'New hand started. Cards dealt to all players.'
    );
    
    // Post blinds (small blind $10, big blind $20)
    const smallBlindIndex = (newState.dealerIndex + 1) % NUM_PLAYERS;
    const bigBlindIndex = (newState.dealerIndex + 2) % NUM_PLAYERS;
    newState = gameEngine.postBlinds(newState, 10, 20);
    
    // Add blinds history
    newState = addActionHistory(
      newState,
      'blinds-posted',
      'posted small blind',
      newState.players[smallBlindIndex].name,
      undefined,
      10
    );
    newState = addActionHistory(
      newState,
      'blinds-posted',
      'posted big blind',
      newState.players[bigBlindIndex].name,
      undefined,
      20
    );
    
    // First action is from player after big blind
    const bigBlindIdx = (newState.dealerIndex + 2) % NUM_PLAYERS;
    newState = {
      ...newState,
      currentPlayerIndex: (bigBlindIdx + 1) % NUM_PLAYERS
    };
    
    setGameState(newState);
    
    toast({
      variant: "info" as any,
      title: "New Hand",
      description: newState.lastAction || "Cards have been dealt. Good luck!",
      duration: 3000,
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
        currentState = addActionHistory(
          currentState,
          'player-action',
          'folded',
          currentPlayer.name,
          'fold'
        );
      } else if (botAction.action === 'check') {
        currentState = gameEngine.playerCheck(currentState, currentState.currentPlayerIndex);
        currentState = addActionHistory(
          currentState,
          'player-action',
          'checked',
          currentPlayer.name,
          'check'
        );
      } else if (botAction.action === 'bet' || botAction.action === 'call' || botAction.action === 'raise') {
        const prevBet = currentPlayer.bet;
        const prevCurrentBet = currentState.currentBet;
        currentState = gameEngine.playerBet(currentState, currentState.currentPlayerIndex, botAction.amount || 0);
        
        // Determine the actual action type based on game state
        let actualAction: PlayerAction = 'bet';
        let actionMessage = '';
        if (prevCurrentBet === 0) {
          actualAction = 'bet';
          actionMessage = `bet $${botAction.amount}`;
        } else if (botAction.amount === prevCurrentBet - prevBet) {
          actualAction = 'call';
          actionMessage = `called $${botAction.amount}`;
        } else {
          actualAction = 'raise';
          actionMessage = `raised to $${prevBet + (botAction.amount || 0)}`;
        }
        
        currentState = addActionHistory(
          currentState,
          'player-action',
          actionMessage,
          currentPlayer.name,
          actualAction,
          botAction.amount
        );
      }

      toast({
        variant: "info" as any,
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
      
      const activePlayers = gameEngine.getActivePlayers(currentState);
      if (activePlayers.length === 1) {
        const { winners, winningHand } = gameEngine.resolveShowdown(currentState);
        const winnerNames = winners.map(i => currentState.players[i].name).join(', ');
        
        const winnerIds = winners.map(i => currentState.players[i].id);
        setWinningPlayerIds(winnerIds);
        
        // Calculate win amount per winner
        const totalPot = currentState.pots.reduce((sum, pot) => sum + pot.amount, 0);
        const winAmountPerWinner = Math.floor(totalPot / winners.length);
        const newWinAmounts: Record<string, number> = {};
        winners.forEach(winnerIndex => {
          newWinAmounts[currentState.players[winnerIndex].id] = winAmountPerWinner;
        });
        setWinAmounts(newWinAmounts);
        
        toast({
          variant: "success" as any,
          title: "Hand Complete!",
          description: `${winnerNames} wins the pot - ${winningHand}`,
          duration: 5000,
        });
        
        currentState = gameEngine.awardPots(currentState, winners);
        
        // Add pot award history
        winners.forEach(winnerIndex => {
          currentState = addActionHistory(
            currentState,
            'pot-award',
            `won $${winAmountPerWinner} - ${winningHand}`,
            currentState.players[winnerIndex].name,
            undefined,
            winAmountPerWinner
          );
        });
        
        currentState = { ...currentState, phase: 'waiting' as GamePhase };
        setGameState({ ...currentState });
        setIsProcessing(false);
        return;
      }
      
      if (currentState.phase === 'river') {
        await resolveShowdown(currentState);
      } else if (currentState.phase !== 'showdown' && currentState.phase !== 'waiting') {
        const prevPhase = currentState.phase;
        currentState = gameEngine.advancePhase(currentState);
        
        // Add history entry for cards dealt
        if (currentState.phase === 'flop') {
          currentState = addActionHistory(
            currentState,
            'cards-dealt',
            'Three community cards dealt'
          );
        } else if (currentState.phase === 'turn') {
          currentState = addActionHistory(
            currentState,
            'cards-dealt',
            'Turn card dealt'
          );
        } else if (currentState.phase === 'river') {
          currentState = addActionHistory(
            currentState,
            'cards-dealt',
            'River card dealt'
          );
        }
        
        let nextPlayerIndex = (currentState.dealerIndex + 1) % currentState.players.length;
        while (currentState.players[nextPlayerIndex].folded) {
          nextPlayerIndex = (nextPlayerIndex + 1) % currentState.players.length;
        }
        
        currentState = {
          ...currentState,
          currentPlayerIndex: nextPlayerIndex
        };
        
        setGameState({ ...currentState });
        setPhaseKey(prev => prev + 1);
        
        toast({
          variant: "info" as any,
          title: getPhaseTitle(currentState.phase),
          description: getPhaseDescription(currentState.phase),
          duration: 3500,
        });

        if (currentState.currentPlayerIndex !== 0) {
          setTimeout(() => processBotActions(currentState), 1000);
        }
      }
    }

    setIsProcessing(false);
  };

  const resolveShowdown = async (state: GameState) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const { winners, winningHand } = gameEngine.resolveShowdown(state);
    
    if (winners.length > 0) {
      const winnerIds = winners.map(i => state.players[i].id);
      setWinningPlayerIds(winnerIds);

      const winnerNames = winners.map(i => state.players[i].name).join(', ');
      
      // Calculate win amount per winner
      const totalPot = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
      const winAmountPerWinner = Math.floor(totalPot / winners.length);
      const newWinAmounts: Record<string, number> = {};
      winners.forEach(winnerIndex => {
        newWinAmounts[state.players[winnerIndex].id] = winAmountPerWinner;
      });
      setWinAmounts(newWinAmounts);
      
      toast({
        variant: "success" as any,
        title: "Hand Complete!",
        description: `${winnerNames} wins the pot - ${winningHand}`,
        duration: 5000,
      });
      
      // Award pot
      let finalState = gameEngine.awardPots(state, winners);
      
      // Add pot award history
      winners.forEach(winnerIndex => {
        finalState = addActionHistory(
          finalState,
          'pot-award',
          `won $${winAmountPerWinner} - ${winningHand}`,
          finalState.players[winnerIndex].name,
          undefined,
          winAmountPerWinner
        );
      });
      
      finalState = { ...finalState, phase: 'waiting' as GamePhase };
      setGameState(finalState);
    }
  };

  const handlePlayerAction = (newState: GameState) => {
    setGameState(newState);
    
    const activePlayers = gameEngine.getActivePlayers(newState);
    if (activePlayers.length === 1) {
      const { winners, winningHand } = gameEngine.resolveShowdown(newState);
      const winnerNames = winners.map(i => newState.players[i].name).join(', ');
      const winnerIds = winners.map(i => newState.players[i].id);
      setWinningPlayerIds(winnerIds);
      
      // Calculate win amount per winner
      const totalPot = newState.pots.reduce((sum, pot) => sum + pot.amount, 0);
      const winAmountPerWinner = Math.floor(totalPot / winners.length);
      const newWinAmounts: Record<string, number> = {};
      winners.forEach(winnerIndex => {
        newWinAmounts[newState.players[winnerIndex].id] = winAmountPerWinner;
      });
      setWinAmounts(newWinAmounts);
      
      toast({
        variant: "success" as any,
        title: "Hand Complete!",
        description: `${winnerNames} wins the pot - ${winningHand}`,
        duration: 5000,
      });
      
      let finalState = gameEngine.awardPots(newState, winners);
      
      // Add pot award history
      winners.forEach(winnerIndex => {
        finalState = addActionHistory(
          finalState,
          'pot-award',
          `won $${winAmountPerWinner} - ${winningHand}`,
          finalState.players[winnerIndex].name,
          undefined,
          winAmountPerWinner
        );
      });
      
      finalState = { ...finalState, phase: 'waiting' as GamePhase };
      setGameState(finalState);
      return;
    }

    toast({
      variant: "info" as any,
      description: newState.lastAction || '',
      duration: 2000,
    });

    const nextState = {
      ...newState,
      currentPlayerIndex: gameEngine.getNextPlayerIndex(newState)
    };
    setGameState(nextState);
    setTimeout(() => processBotActions(nextState), 500);
  };

  const handleFold = () => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    let newState = gameEngine.playerFold(gameState, 0);
    newState = addActionHistory(
      newState,
      'player-action',
      'folded',
      gameState.players[0].name,
      'fold'
    );
    handlePlayerAction(newState);
  };

  const handleCheck = () => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    let newState = gameEngine.playerCheck(gameState, 0);
    newState = addActionHistory(
      newState,
      'player-action',
      'checked',
      gameState.players[0].name,
      'check'
    );
    handlePlayerAction(newState);
  };

  const handleCall = () => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    const amountToCall = gameState.currentBet - gameState.players[0].bet;
    let newState = gameEngine.playerBet(gameState, 0, amountToCall);
    newState = addActionHistory(
      newState,
      'player-action',
      `called $${amountToCall}`,
      gameState.players[0].name,
      'call',
      amountToCall
    );
    handlePlayerAction(newState);
  };

  const handleBet = (amount: number) => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    let newState = gameEngine.playerBet(gameState, 0, amount);
    newState = addActionHistory(
      newState,
      'player-action',
      `bet $${amount}`,
      gameState.players[0].name,
      'bet',
      amount
    );
    handlePlayerAction(newState);
  };

  const handleRaise = (amount: number) => {
    if (!gameState || isProcessing) return;
    setIsProcessing(true);
    const currentPlayerBet = gameState.players[0].bet;
    let newState = gameEngine.playerBet(gameState, 0, amount);
    newState = addActionHistory(
      newState,
      'player-action',
      `raised to $${currentPlayerBet + amount}`,
      gameState.players[0].name,
      'raise',
      amount
    );
    handlePlayerAction(newState);
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

  import { LoadingSpinner } from '@/components/ui/loading-spinner';

// ... (rest of the imports)

// ... (inside PokerGame component)

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-white">
        <LoadingSpinner className="w-12 h-12 mb-4 text-poker-chipGold" />
        <p className="text-lg font-semibold">Shuffling the deck...</p>
      </div>
    );
  }


  const humanPlayer = gameState.players[0];
  const canCheck = gameState.currentBet === 0 || gameState.currentBet === humanPlayer.bet;
  const minBet = gameState.currentBet - humanPlayer.bet || 10;
  const maxBet = humanPlayer.chips;
  const minRaiseAmount = gameState.currentBet + (gameState.currentBet - (gameState.players.find(p => p.bet < gameState.currentBet)?.bet || 0));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 gap-6">
      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Poker Table with Wood Border */}
        <div 
          className="rounded-[210px] wood-grain p-[10px] table-edge-glow"
          style={{ 
            width: '820px', 
            height: '520px',
          }}
        >
          {/* Poker Table Felt Surface */}
          <div 
            className="relative felt-texture vignette table-depth rounded-[200px] overflow-visible"
            style={{ 
              width: '800px', 
              height: '500px',
            }}
            data-testid="poker-table"
          >
            <AnimatePresence>
              {showPhaseTransition && (
                <motion.div
                  className="absolute inset-0 bg-black/50 rounded-[200px] z-40 border-4 border-poker-chipGold/80 shadow-lg shadow-poker-chipGold/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0], transition: { duration: 0.7, ease: "easeInOut" } }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            {/* Community Cards */}
            <CommunityCards cards={gameState.communityCards} phase={gameState.phase} />

            {/* Pot Display */}
            <PotDisplay 
              amount={gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)} 
              onRef={handlePotRef}
            />

            {/* Player Seats */}
            {gameState.players.map((player, index) => (
              <PlayerSeat
                key={player.id}
                player={player}
                position={index}
                totalPlayers={NUM_PLAYERS}
                isCurrentPlayer={index === gameState.currentPlayerIndex}
                isDealer={index === gameState.dealerIndex}
                isWinner={winningPlayerIds.includes(player.id)}
                phase={gameState.phase}
                lastAction={gameState.lastAction}
                winAmount={winAmounts[player.id] || 0}
                isProcessing={isProcessing}
              />
            ))}

            {/* Game Phase Indicator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseKey}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30"
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-poker-chipGold shadow-lg shadow-poker-chipGold/20">
                  <div className="text-base text-poker-chipGold font-bold tracking-wide" data-testid="text-game-phase">
                    {getPhaseTitle(gameState.phase)}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Winner Celebration */}
            {winningPlayerIds.length > 0 && winningPlayerIds.map(winnerId => {
              const winner = gameState.players.find(p => p.id === winnerId);
              return winner ? (
                <WinnerCelebration key={winnerId} isWinner={true} playerName={winner.name} />
              ) : null;
            })}

            {/* Last Action */}
            {gameState.lastAction && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="text-xs text-white" data-testid="text-last-action">
                    {gameState.lastAction}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full max-w-2xl">
          {/* Hand Strength Indicator - Only show when hand is in play */}
          {gameState.phase !== 'waiting' && humanPlayer.hand.length > 0 && (
            <div className="flex justify-center">
              <HandStrengthIndicator
                hand={humanPlayer.hand}
                communityCards={gameState.communityCards}
              />
            </div>
          )}

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
              onCall={handleCall}
              onBet={handleBet}
              onRaise={handleRaise}
              canCheck={canCheck}
              minBet={minBet}
              maxBet={maxBet}
              amountToCall={gameState.currentBet - humanPlayer.bet}
              currentBet={gameState.currentBet}
              minRaiseAmount={minRaiseAmount}
              potSize={gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)}
              playerChips={humanPlayer.chips}
              disabled={gameState.currentPlayerIndex !== 0 || isProcessing || humanPlayer.folded}
            />
          )}
        </div>
      </div>

      {/* Action History Sidebar */}
      <div className="h-[calc(100vh-2rem)] w-80" style={{ maxHeight: '800px' }}>
        <ActionHistory 
          history={gameState.actionHistory}
          currentPlayerName={humanPlayer.name}
        />
      </div>
    </div>
  );
}
