import { useState, useEffect, useRef } from 'react';
import { GameState, GamePhase, Card } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
import { PlayerSeat } from '@/components/PlayerSeat';
import { CommunityCards } from '@/components/CommunityCards';
import { PotDisplay } from '@/components/PotDisplay';
import { ActionControls } from '@/components/ActionControls';
import { ActionHistory } from '@/components/ActionHistory';
import { HandStrengthIndicator } from '@/components/HandStrengthIndicator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { WinnerCelebration } from '@/components/WinnerCelebration';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from '@/components/Chip';
import { useSound } from '@/hooks/useSound';
import { useSwipe } from '@/hooks/useSwipe';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react';

const NUM_PLAYERS = 6;

interface FlyingChipData {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [winningPlayerIds, setWinningPlayerIds] = useState<string[]>([]);
  const [winAmounts, setWinAmounts] = useState<Record<string, number>>({});
  const [phaseKey, setPhaseKey] = useState(0);
  const [flyingChips, setFlyingChips] = useState<FlyingChipData[]>([]);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isHandStrengthCollapsed, setIsHandStrengthCollapsed] = useState(false);
  const potPosition = useRef<{ x: number; y: number }>({ x: 400, y: 150 });
  const { toast } = useToast();
  const { playSound } = useSound();

  // Swipe gestures for mobile (only when it's player's turn and not processing)
  useSwipe({
    onSwipeLeft: () => {
      if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing) return;
      handleFold();
    },
    onSwipeRight: () => {
      if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing) return;
      const canCheck = gameState.currentBet === 0 || gameState.currentBet === gameState.players[0].bet;
      if (canCheck) {
        handleCheck();
      } else {
        handleCall();
      }
    },
  }, { minSwipeDistance: 80 });

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
    
    // Play card shuffle sound
    playSound('card-shuffle', { volume: 0.2 });
    
    setWinningPlayerIds([]);
    setWinAmounts({});
    setFlyingChips([]);
    let newState = gameEngine.startNewHand(gameState);
    
    // Post blinds (small blind $10, big blind $20)
    newState = gameEngine.postBlinds(newState, 10, 20);
    
    // First action is from player after big blind
    const bigBlindIndex = (newState.dealerIndex + 2) % NUM_PLAYERS;
    newState = {
      ...newState,
      currentPlayerIndex: (bigBlindIndex + 1) % NUM_PLAYERS
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
      } else if (botAction.action === 'check') {
        currentState = gameEngine.playerCheck(currentState, currentState.currentPlayerIndex);
      } else if (botAction.action === 'bet' || botAction.action === 'call' || botAction.action === 'raise') {
        currentState = gameEngine.playerBet(currentState, currentState.currentPlayerIndex, botAction.amount || 0);
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
        currentState = { ...currentState, phase: 'waiting' as GamePhase };
        setGameState({ ...currentState });
        setIsProcessing(false);
        return;
      }
      
      if (currentState.phase === 'river') {
        await resolveShowdown(currentState);
      } else if (currentState.phase !== 'showdown' && currentState.phase !== 'waiting') {
        currentState = gameEngine.advancePhase(currentState);
        
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
    const newState = gameEngine.playerFold(gameState, 0);
    handlePlayerAction(newState);
  };

  const handleCheck = () => {
    if (!gameState || isProcessing) return;
    const newState = gameEngine.playerCheck(gameState, 0);
    handlePlayerAction(newState);
  };

  const handleCall = () => {
    if (!gameState || isProcessing) return;
    const amountToCall = gameState.currentBet - gameState.players[0].bet;
    const newState = gameEngine.playerBet(gameState, 0, amountToCall);
    handlePlayerAction(newState);
  };

  const handleBet = (amount: number) => {
    if (!gameState || isProcessing) return;
    const newState = gameEngine.playerBet(gameState, 0, amount);
    handlePlayerAction(newState);
  };

  const handleRaise = (amount: number) => {
    if (!gameState || isProcessing) return;
    const newState = gameEngine.playerBet(gameState, 0, amount);
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

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const humanPlayer = gameState.players[0];
  const canCheck = gameState.currentBet === 0 || gameState.currentBet === humanPlayer.bet;
  const minBet = gameState.currentBet - humanPlayer.bet || 10;
  const maxBet = humanPlayer.chips;
  const minRaiseAmount = gameState.currentBet + (gameState.currentBet - (gameState.players.find(p => p.bet < gameState.currentBet)?.bet || 0));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4 relative">
      {/* Theme Toggle - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Responsive Grid Layout */}
      <div className="w-full max-w-[1800px] grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[320px_1fr_380px] gap-4 items-start">
        
        {/* Hand Strength Indicator - Left Sidebar (Desktop) / Collapsible (Mobile) */}
        <div className="lg:sticky lg:top-4">
          {/* Mobile Toggle Button - Always Visible */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed left-2 top-20 z-50 h-11 w-11 rounded-full shadow-lg bg-card/95 backdrop-blur-sm"
            onClick={() => setIsHandStrengthCollapsed(!isHandStrengthCollapsed)}
            data-testid="button-toggle-hand-strength"
          >
            {isHandStrengthCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>

          {/* Panel Content */}
          <div className={`bg-card/80 backdrop-blur-sm border border-card-border rounded-lg p-4 ${isHandStrengthCollapsed ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-poker-chipGold" />
                Hand Strength
              </h3>
            </div>
            {gameState && (
              <HandStrengthIndicator
                hand={gameState.players[0].hand}
                communityCards={gameState.communityCards}
              />
            )}
          </div>
        </div>

        {/* Main Game Area - Center */}
        <div className="flex flex-col gap-4 items-center">
          {/* Poker Table with Wood Border */}
          <div 
            className="rounded-[105px] sm:rounded-[150px] lg:rounded-[210px] wood-grain p-[6px] sm:p-[8px] lg:p-[10px] table-edge-glow w-full max-w-[380px] sm:max-w-[560px] lg:max-w-[820px]"
            style={{ 
              aspectRatio: '820 / 520',
            }}
          >
            {/* Poker Table Felt Surface */}
            <div 
              className="relative felt-texture vignette table-depth rounded-[100px] sm:rounded-[143px] lg:rounded-[200px] overflow-visible w-full h-full"
              data-testid="poker-table"
            >
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
                    <div className="text-base sm:text-lg text-poker-chipGold font-bold tracking-wide" data-testid="text-game-phase">
                      {getPhaseTitle(gameState.phase)}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Winner Celebration */}
              {winningPlayerIds.length > 0 && winningPlayerIds.map(winnerId => {
                const winner = gameState.players.find(p => p.id === winnerId);
                return winner ? (
                  <WinnerCelebration 
                    key={winnerId} 
                    isWinner={true} 
                    playerName={winner.name} 
                    winAmount={winAmounts[winnerId] || 0}
                  />
                ) : null;
              })}

              {/* Last Action */}
              {gameState.lastAction && (
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="bg-black/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20">
                    <div className="text-[10px] sm:text-xs text-white" data-testid="text-last-action">
                      {gameState.lastAction}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full">
            {gameState.phase === 'waiting' ? (
              <Button 
                onClick={startNewHand}
                size="lg"
                className="w-full min-h-[44px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold text-base sm:text-lg"
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

        {/* Action History - Right Sidebar (Desktop) / Collapsible (Mobile) */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
          {/* Mobile Toggle Button - Always Visible */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed right-2 top-20 z-50 h-11 w-11 rounded-full shadow-lg bg-card/95 backdrop-blur-sm"
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            data-testid="button-toggle-action-history"
          >
            {isHistoryCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>

          {/* Panel Content */}
          <div className={`${isHistoryCollapsed ? 'hidden lg:block' : ''}`}>
            <ActionHistory 
              history={gameState.actionHistory} 
              currentPlayerName={gameState.players[0].name}
            />
          </div>
        </div>
      </div>

      {/* Flying Chips Animation */}
      {flyingChips.map((chip) => (
        <FlyingChip
          key={chip.id}
          startX={chip.startX}
          startY={chip.startY}
          endX={chip.endX}
          endY={chip.endY}
          onComplete={() => {
            setFlyingChips(prev => prev.filter(c => c.id !== chip.id));
          }}
        />
      ))}

      {/* Mobile Swipe Hint */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 lg:hidden">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-white/70 text-center">
          Swipe left to fold • Swipe right to call/check
        </div>
      </div>
    </div>
  );
}
