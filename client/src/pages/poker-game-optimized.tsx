import { useState, useEffect, useRef, lazy, Suspense, memo, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { GameState, GamePhase, Card, ActionHistoryEntry, PlayerAction, ACHIEVEMENT_LIST, PokerTable } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
// Use memoized versions of components
import { PlayerSeat, CommunityCards, ActionControls } from '@/components/MemoizedComponents';
import { PotDisplay } from '@/components/PotDisplay';
import { RightSidebarPanel } from '@/components/RightSidebarPanel';
import { AchievementToast } from '@/components/AchievementToast';
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
import { FloatingActionMenu } from '@/components/FloatingActionMenu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { WinnerCelebration } from '@/components/WinnerCelebration';
import { HandStrengthIndicator } from '@/components/HandStrengthIndicator';
import { HandStrengthPanel } from '@/components/HandStrengthPanel';
import { PotOddsDisplay } from '@/components/PotOddsDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from '@/components/Chip';
import { Trash2, ChevronRight, ChevronLeft, TrendingUp, Settings, Menu } from 'lucide-react';
import { PokerLoader, PokerSpinner } from '@/components/PokerLoader';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useSwipe } from '@/hooks/useSwipe';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GameSettings } from '@/components/SettingsPanel';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { apiRequest } from '@/lib/queryClient';
import { useOrientation } from '@/hooks/useOrientation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { throttle, debounce } from '@/lib/throttle';
import { 
  LazyHandDistributionChart, 
  LazyAchievementsList, 
  LazySettingsPanel,
  ChartSkeleton, 
  AchievementsSkeleton,
  SettingsSkeleton,
  LazyComponentWrapper 
} from '@/components/LazyComponents';

const NUM_PLAYERS = 6;
const MAX_HISTORY_ENTRIES = 30;

interface FlyingChipData {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Memoize action history function
const addActionHistory = memo((
  state: GameState,
  type: ActionHistoryEntry['type'],
  message: string,
  playerName?: string,
  action?: PlayerAction,
  amount?: number
): GameState => {
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
});

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [winningPlayerIds, setWinningPlayerIds] = useState<string[]>([]);
  const [winAmounts, setWinAmounts] = useState<Record<string, number>>({});
  const [phaseKey, setPhaseKey] = useState(0);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [flyingChips, setFlyingChips] = useState<FlyingChipData[]>([]);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isHandStrengthCollapsed, setIsHandStrengthCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTabletPanelOpen, setIsTabletPanelOpen] = useState(false);
  const [tableAspect, setTableAspect] = useState<string>('3 / 2');
  const potPosition = useRef<{ x: number; y: number }>({ x: 400, y: 150 });
  const { toast } = useToast();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();
  const { user, isAuthenticated, isStandalone } = useTelegramAuth();
  const { isLandscape } = useOrientation();
  const { isOnline, isReconnecting, checkConnection } = useNetworkStatus();
  
  // Get tableId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const tableId = searchParams.get('tableId');
  
  // Query to fetch table data if tableId exists
  const { data: tableData, isLoading: isLoadingTable } = useQuery<{
    table: PokerTable;
    players: any[];
  }>({
    queryKey: [`/api/tables/${tableId}`],
    enabled: !!tableId,
    refetchInterval: tableId ? 5000 : false, // Refresh every 5 seconds to get latest state
  });

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('pokerGameSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Check for system reduced motion preference if no manual setting
        if (parsed.reducedAnimations === undefined) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          parsed.reducedAnimations = prefersReducedMotion;
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return {
      soundEnabled: true,
      soundVolume: 0.5,
      hapticFeedback: true,
      autoPlay: false,
      botSpeed: 'normal' as const,
      showHandStrength: true,
      colorblindMode: false,
      reducedAnimations: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      smallBlind: 10,
      bigBlind: 20,
      startingChips: 1000
    };
  });
  
  // Throttled settings update for better performance
  const updateSettings = useCallback(
    throttle((newSettings: Partial<GameSettings>) => {
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem('pokerGameSettings', JSON.stringify(updated));
        return updated;
      });
    }, 100),
    []
  );

  // Memoize expensive calculations
  const currentPlayerData = useMemo(() => {
    if (!gameState) return null;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isHumanTurn = currentPlayer?.isHuman && !currentPlayer.folded;
    const humanPlayer = gameState.players.find(p => p.isHuman);
    
    return {
      currentPlayer,
      isHumanTurn,
      humanPlayer,
      activePlayers: gameState.players.filter(p => !p.folded),
      maxBet: Math.max(...gameState.players.map(p => p.bet))
    };
  }, [gameState]);

  // Debounced bot processing for better performance
  const processBotTurn = useCallback(
    debounce(async () => {
      if (!gameState || !currentPlayerData) return;
      
      const { currentPlayer, isHumanTurn } = currentPlayerData;
      
      if (isHumanTurn || !currentPlayer || currentPlayer.folded || gameState.phase === 'showdown') {
        return;
      }

      const botDelay = settings.botSpeed === 'fast' ? 800 : settings.botSpeed === 'slow' ? 2500 : 1500;
      
      setIsProcessing(true);
      
      setTimeout(() => {
        const botAction = botAI.decideAction(gameState, gameState.currentPlayerIndex);
        
        if (settings.soundEnabled) {
          if (botAction.action === 'fold') {
            playSound('fold', { volume: settings.soundVolume * 0.4 });
          } else if (botAction.action === 'raise' || botAction.action === 'bet') {
            playSound('raise', { volume: settings.soundVolume * 0.5 });
          } else if (botAction.action === 'call') {
            playSound('button-click', { volume: settings.soundVolume * 0.3 });
          }
        }
        
        const updatedState = gameEngine.processAction(gameState, botAction);
        const finalState = addActionHistory(
          updatedState,
          'player-action',
          `${currentPlayer.name} ${botAction.action}${botAction.amount ? ` $${botAction.amount}` : ''}`,
          currentPlayer.name,
          botAction.action,
          botAction.amount
        );
        
        setGameState(finalState);
        setIsProcessing(false);
      }, botDelay);
    }, 200), // Debounce delay
    [gameState, currentPlayerData, settings, playSound]
  );

  // Process bot turn when needed
  useEffect(() => {
    if (!gameState || !currentPlayerData) return;
    
    if (!currentPlayerData.isHumanTurn && currentPlayerData.currentPlayer && !currentPlayerData.currentPlayer.folded && gameState.phase !== 'showdown') {
      processBotTurn();
    }
  }, [gameState, currentPlayerData, processBotTurn]);

  // Initialize game
  useEffect(() => {
    const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
    setGameState(initialState);
  }, []);

  // Handle offline status
  useEffect(() => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Connection Lost",
        description: "You are offline. Game progress may not be saved.",
        duration: 5000,
      });
    }
  }, [isOnline, toast]);

  // Optimized action handlers with useCallback
  const handleStartNewHand = useCallback(() => {
    if (!gameState) return;
    
    let newState = gameEngine.startNewHand(gameState);
    newState = gameEngine.postBlinds(newState, settings.smallBlind, settings.bigBlind);
    newState = addActionHistory(newState, 'blinds-posted', `Blinds posted: $${settings.smallBlind}/$${settings.bigBlind}`);
    
    setGameState(newState);
    setWinningPlayerIds([]);
    setWinAmounts({});
    
    if (settings.soundEnabled) {
      playSound('shuffle', { volume: settings.soundVolume * 0.6 });
    }
  }, [gameState, settings, playSound]);

  const handlePlayerAction = useCallback((action: PlayerAction, amount?: number) => {
    if (!gameState || isProcessing) return;
    
    const updatedState = gameEngine.processAction(gameState, { action, amount });
    const humanPlayer = updatedState.players.find(p => p.isHuman);
    
    const finalState = addActionHistory(
      updatedState,
      'player-action',
      `${humanPlayer?.name} ${action}${amount ? ` $${amount}` : ''}`,
      humanPlayer?.name,
      action,
      amount
    );
    
    setGameState(finalState);
    
    if (settings.hapticFeedback) {
      triggerHaptic(action === 'fold' ? 'light' : action === 'raise' || action === 'bet' ? 'heavy' : 'medium');
    }
  }, [gameState, isProcessing, settings, triggerHaptic]);

  // Memoized component props
  const actionControlsProps = useMemo(() => {
    if (!gameState || !currentPlayerData) return null;
    
    const { humanPlayer, maxBet } = currentPlayerData;
    if (!humanPlayer) return null;

    const amountToCall = maxBet - humanPlayer.bet;
    const minRaiseAmount = maxBet * 2;
    
    return {
      onFold: () => handlePlayerAction('fold'),
      onCheck: () => handlePlayerAction('check'),
      onCall: () => handlePlayerAction('call'),
      onBet: (amount: number) => handlePlayerAction('bet', amount),
      onRaise: (amount: number) => handlePlayerAction('raise', amount),
      canCheck: humanPlayer.bet === maxBet,
      minBet: settings.bigBlind,
      maxBet: humanPlayer.chips,
      amountToCall,
      currentBet: humanPlayer.bet,
      minRaiseAmount,
      potSize: gameState.pots.reduce((sum, pot) => sum + pot.amount, 0),
      playerChips: humanPlayer.chips,
      disabled: isProcessing || !currentPlayerData.isHumanTurn || humanPlayer.folded,
      animationSpeed: settings.reducedAnimations ? 0.1 : 1,
      playerFolded: humanPlayer.folded
    };
  }, [gameState, currentPlayerData, settings, handlePlayerAction, isProcessing]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <PokerLoader />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b">
          <Button
            variant="outline"
            onClick={handleStartNewHand}
            disabled={isProcessing || gameState.phase !== 'waiting'}
          >
            New Hand
          </Button>
          <ThemeToggle />
        </div>

        {/* Game Table */}
        <div className="flex-1 relative">
          {/* Community Cards */}
          <CommunityCards cards={gameState.communityCards} />
          
          {/* Pot Display */}
          <PotDisplay amount={gameState.pots[0]?.amount || 0} />
          
          {/* Player Seats */}
          {gameState.players.map((player, index) => (
            <PlayerSeat
              key={player.id}
              player={player}
              position={index}
              totalPlayers={gameState.players.length}
              isCurrentPlayer={index === gameState.currentPlayerIndex}
              isDealer={index === gameState.dealerIndex}
              isWinner={winningPlayerIds.includes(player.id)}
              phase={gameState.phase}
              lastAction={gameState.lastAction}
              winAmount={winAmounts[player.id]}
              isProcessing={isProcessing}
              colorblindMode={settings.colorblindMode}
              soundEnabled={settings.soundEnabled}
              soundVolume={settings.soundVolume}
            />
          ))}
        </div>

        {/* Action Controls */}
        {actionControlsProps && (
          <div className="p-4 border-t">
            <ActionControls {...actionControlsProps} />
          </div>
        )}
      </div>

      {/* Right Sidebar - Optimized with lazy loading */}
      <RightSidebarPanel
        gameState={gameState}
        isCollapsed={isRightPanelCollapsed}
        onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
      />

      {/* Lazy loaded settings panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </Button>
            <Suspense fallback={<SettingsSkeleton />}>
              <LazySettingsPanel
                settings={settings}
                onSettingsChange={updateSettings}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}