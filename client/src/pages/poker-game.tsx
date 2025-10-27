import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { GameState, GamePhase, Card, ActionHistoryEntry, PlayerAction, ACHIEVEMENT_LIST, PokerTable } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState, FullPageLoader } from '@/components/LoadingState';
import { logError, ErrorCategory } from '@/lib/errorHandler';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PlayerSeat } from '@/components/PlayerSeat';
import { CommunityCards } from '@/components/CommunityCards';
import { PotDisplay } from '@/components/PotDisplay';
import { ActionControls } from '@/components/ActionControls';
import { ActionHistory } from '@/components/ActionHistory';
import { SessionStats } from '@/components/SessionStats';
import { RightSidebarPanel } from '@/components/RightSidebarPanel';
import { HandDistributionChart } from '@/components/HandDistributionChart';
import { AchievementsList } from '@/components/AchievementsList';
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
import { Trash2, ChevronRight, ChevronLeft, TrendingUp, Settings, Menu, HelpCircle } from 'lucide-react';
import { PokerLoader, PokerSpinner } from '@/components/PokerLoader';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useSwipe } from '@/hooks/useSwipe';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsPanel, GameSettings } from '@/components/SettingsPanel';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { apiRequest } from '@/lib/queryClient';
import { useOrientation } from '@/hooks/useOrientation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { GameTip } from '@/components/GameTip';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useGameTips } from '@/hooks/useGameTips';

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
  const { isOnline: networkOnline, isReconnecting: networkReconnecting, checkConnection } = useNetworkStatus();
  const { isOnline, isReconnecting, queueAction } = useOnlineStatus();
  const [, navigate] = useLocation();
  const [connectionError, setConnectionError] = useState(false);
  const [gameError, setGameError] = useState<{ message: string; canRetry: boolean } | null>(null);
  
  // Onboarding and tips hooks
  const { 
    isOnboardingActive, 
    hasCompletedOnboarding, 
    startOnboarding 
  } = useOnboarding();
  
  const { 
    triggerTip, 
    tipsEnabled 
  } = useGameTips();
  
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
      console.error('Failed to load settings from localStorage:', error);
    }
    // Check system preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      soundEnabled: true,
      soundVolume: 0.5,
      animationSpeed: 1,
      tableTheme: 'classic',
      colorblindMode: false,
      isPaused: false,
      reducedAnimations: prefersReducedMotion
    };
  });

  // Mutation to save stats to backend (only for authenticated Telegram users)
  const saveStatsMutation = useMutation({
    mutationFn: async (stats: { handsPlayed: number; handsWon: number; biggestPot: number; totalWinnings: number; achievements: string[] }) => {
      if (!isOnline) {
        throw new Error('Cannot save stats while offline');
      }
      await apiRequest('PATCH', '/api/users/me/stats', { stats });
    },
    onError: (error: any) => {
      logError(error, { context: 'save_stats' }, { category: ErrorCategory.SERVER });
      
      if (!isOnline) {
        // Queue the action for when online
        queueAction(
          () => saveStatsMutation.mutateAsync(saveStatsMutation.variables!),
          'Save game statistics'
        );
        toast({
          title: 'Stats queued',
          description: 'Your stats will be saved when connection is restored',
          variant: 'default' as any,
          duration: 3000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to save stats',
          description: 'Your stats could not be saved. They will be retried automatically.',
          duration: 3000,
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveStatsMutation.mutate(saveStatsMutation.variables!)}
            >
              Retry Now
            </Button>
          ),
        });
      }
    },
  });

  // Mutation to save bankroll to backend (only for authenticated Telegram users)
  const saveBankrollMutation = useMutation({
    mutationFn: async (bankroll: number) => {
      if (!isOnline) {
        throw new Error('Cannot save bankroll while offline');
      }
      await apiRequest('PATCH', '/api/users/me/bankroll', { bankroll });
    },
    onError: (error: any) => {
      logError(error, { context: 'save_bankroll', critical: true }, { category: ErrorCategory.SERVER });
      
      if (!isOnline) {
        // Queue the critical action for when online
        queueAction(
          () => saveBankrollMutation.mutateAsync(saveBankrollMutation.variables!),
          'Save bankroll (critical)'
        );
        toast({
          title: 'Bankroll queued',
          description: 'Your bankroll will be saved when connection is restored',
          variant: 'default' as any,
          duration: 3000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: '⚠️ Critical: Failed to save bankroll',
          description: 'Your bankroll could not be saved. Please retry to avoid losing your winnings.',
          duration: Infinity,
          action: (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => saveBankrollMutation.mutate(saveBankrollMutation.variables!)}
            >
              Retry Now
            </Button>
          ),
        });
      }
    },
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pokerGameSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  // Responsively tune table aspect ratio for better mobile fit
  useEffect(() => {
    const computeAspect = () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (vw < 480) {
        // Phone portrait: wider table to spread seats
        return '1.9 / 1';
      } else if (vw < 768) {
        // Small tablets/large phones
        return '1.85 / 1';
      } else {
        // Tablets/desktop
        return '3 / 2';
      }
    };

    const apply = () => setTableAspect(computeAspect());
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [isLandscape]);

  const handleSettingsChange = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handlePauseToggle = () => {
    setSettings(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  // Double-tap gesture detection for check/call
  const lastTapTime = useRef(0);
  const doubleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const handleDoubleTap = (e: TouchEvent | MouseEvent) => {
      // Don't trigger if clicking on buttons or interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]') || 
          target.closest('input') || target.closest('textarea') ||
          target.closest('.action-controls')) {
        return;
      }
      
      // Check if it's player's turn and game is ready
      if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing || settings.isPaused) {
        return;
      }
      
      const currentTime = Date.now();
      const tapTimeDiff = currentTime - lastTapTime.current;
      
      if (tapTimeDiff < 300 && tapTimeDiff > 0) {
        // Double tap detected!
        e.preventDefault();
        
        // Clear any pending timeout
        if (doubleTapTimeout.current) {
          clearTimeout(doubleTapTimeout.current);
          doubleTapTimeout.current = null;
        }
        
        // Trigger haptic feedback for double tap
        triggerHaptic('medium');
        
        // Determine if we should check or call
        const canCheck = gameState.currentBet === 0 || gameState.currentBet === gameState.players[0].bet;
        
        if (canCheck) {
          playSound('check', { volume: settings.soundVolume * 0.3 });
          handleCheck();
          toast({
            title: "Double Tap",
            description: "Checked",
            duration: 1500
          });
        } else {
          playSound('button-click', { volume: settings.soundVolume * 0.3 });
          handleCall();
          const amountToCall = gameState.currentBet - gameState.players[0].bet;
          toast({
            title: "Double Tap",
            description: `Called $${amountToCall}`,
            duration: 1500
          });
        }
        
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = currentTime;
        
        // Set timeout to reset if no second tap
        if (doubleTapTimeout.current) {
          clearTimeout(doubleTapTimeout.current);
        }
        doubleTapTimeout.current = setTimeout(() => {
          lastTapTime.current = 0;
        }, 300);
      }
    };
    
    // Add event listeners for both touch and mouse events
    document.addEventListener('touchend', handleDoubleTap);
    document.addEventListener('click', handleDoubleTap);
    
    return () => {
      document.removeEventListener('touchend', handleDoubleTap);
      document.removeEventListener('click', handleDoubleTap);
      if (doubleTapTimeout.current) {
        clearTimeout(doubleTapTimeout.current);
      }
    };
  }, [gameState, isProcessing, settings.isPaused, settings.soundVolume, triggerHaptic, playSound, toast]);

  // Global swipe gestures using the existing useSwipe hook
  useSwipe({
    onSwipeLeft: () => {
      if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing || settings.isPaused) return;
      triggerHaptic('light');
      playSound('fold', { volume: settings.soundVolume * 0.3 });
      handleFold();
      toast({
        title: "Swipe Left",
        description: "Folded",
        duration: 1500
      });
    },
    onSwipeRight: () => {
      if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing || settings.isPaused) return;
      const canCheck = gameState.currentBet === 0 || gameState.currentBet === gameState.players[0].bet;
      triggerHaptic('medium');
      if (canCheck) {
        playSound('check', { volume: settings.soundVolume * 0.3 });
        handleCheck();
        toast({
          title: "Swipe Right",
          description: "Checked",
          duration: 1500
        });
      } else {
        playSound('button-click', { volume: settings.soundVolume * 0.3 });
        handleCall();
        const amountToCall = gameState.currentBet - gameState.players[0].bet;
        toast({
          title: "Swipe Right",
          description: `Called $${amountToCall}`,
          duration: 1500
        });
      }
    },
  }, { minSwipeDistance: 80 });

  const handleResetGame = () => {
    localStorage.removeItem('pokerGameState');
    const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
    
    // If authenticated with Telegram, use user's displayName and bankroll
    if (isAuthenticated && user) {
      initialState.players[0].name = user.displayName;
      initialState.players[0].chips = user.bankroll;
    }
    
    setGameState(initialState);
    setWinningPlayerIds([]);
    setWinAmounts({});
    setPhaseKey(0);
    toast({
      title: "Game Reset",
      description: "A new game has started.",
      duration: 3000,
    });
  };

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
    // If we have a tableId, load from table data
    if (tableId && tableData?.table) {
      const table = tableData.table as PokerTable;
      
      // If table has a saved game state, use it
      if (table.gameState) {
        setGameState(table.gameState);
      } else {
        // Initialize a new game for this table
        const initialState = gameEngine.createInitialGameState(table.maxPlayers || NUM_PLAYERS);
        
        // Set up players based on table players
        if (tableData.players && tableData.players.length > 0) {
          // TODO: Set up players from table data
        }
        
        setGameState(initialState);
      }
    } else {
      // No tableId - use local storage (demo mode)
      try {
        const savedGame = localStorage.getItem('pokerGameState');
        if (savedGame) {
          setGameState(JSON.parse(savedGame));
        } else {
          const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
          
          // If authenticated with Telegram, use user's displayName and bankroll
          if (isAuthenticated && user) {
            initialState.players[0].name = user.displayName;
            initialState.players[0].chips = user.bankroll;
          }
          
          setGameState(initialState);
        }
      } catch (error) {
        console.error("Failed to load game state from local storage:", error);
        const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
        
        // If authenticated with Telegram, use user's displayName and bankroll
        if (isAuthenticated && user) {
          initialState.players[0].name = user.displayName;
          initialState.players[0].chips = user.bankroll;
        }
        
        setGameState(initialState);
      }
    }
  }, [isAuthenticated, user, tableId, tableData]);

  // Mutation to save game state to table
  const saveTableGameStateMutation = useMutation({
    mutationFn: async (gameState: GameState) => {
      if (!tableId) throw new Error('No tableId');
      const res = await apiRequest('PATCH', `/api/tables/${tableId}/gamestate`, { gameState });
      return res.json();
    },
    onError: (error) => {
      console.error('Failed to save table game state:', error);
    }
  });

  useEffect(() => {
    // Save game state
    if (gameState) {
      if (tableId) {
        // Save to table in database
        saveTableGameStateMutation.mutate(gameState);
      } else {
        // Save to local storage for demo mode
        try {
          localStorage.setItem('pokerGameState', JSON.stringify(gameState));
          
          // Also save a recovery timestamp for session recovery
          localStorage.setItem('pokerGameRecoveryTime', Date.now().toString());
        } catch (error) {
          console.error("Failed to save game state to local storage:", error);
          
          // Show user-friendly error message
          toast({
            variant: 'destructive',
            title: 'Storage Error',
            description: 'Unable to save game progress. Your browser storage might be full.',
            duration: 4000,
          });
          
          // Try to clear old data if storage is full
          try {
            const recoveryTime = localStorage.getItem('pokerGameRecoveryTime');
            if (recoveryTime && Date.now() - parseInt(recoveryTime) > 7 * 24 * 60 * 60 * 1000) {
              // Clear old game state if older than 7 days
              localStorage.removeItem('pokerGameState');
              localStorage.removeItem('pokerGameRecoveryTime');
              
              // Try saving again
              localStorage.setItem('pokerGameState', JSON.stringify(gameState));
              localStorage.setItem('pokerGameRecoveryTime', Date.now().toString());
            }
          } catch (retryError) {
            console.error("Failed to clear and retry save:", retryError);
          }
        }
      }
    }
  }, [gameState, toast, tableId, saveTableGameStateMutation]);

  // Save stats and bankroll to backend when hand ends (for authenticated users)
  useEffect(() => {
    if (!gameState || !isAuthenticated || !user) return;
    
    // Only save when phase is 'waiting' (hand just ended)
    if (gameState.phase === 'waiting' && gameState.sessionStats.handsPlayed > 0) {
      const humanPlayer = gameState.players[0];
      
      // Save bankroll if it changed
      if (humanPlayer.chips !== user.bankroll) {
        saveBankrollMutation.mutate(humanPlayer.chips);
      }
      
      // Save stats (combine session stats with player stats)
      const stats = {
        handsPlayed: gameState.sessionStats.handsPlayed,
        handsWon: humanPlayer.stats.handsWon,
        biggestPot: humanPlayer.stats.biggestPot,
        totalWinnings: humanPlayer.chips - 1000, // Calculate total winnings from starting bankroll
        achievements: Object.keys(gameState.achievements).filter(
          key => gameState.achievements[key as keyof typeof gameState.achievements].unlockedAt
        ),
      };
      
      saveStatsMutation.mutate(stats);
    }
  }, [gameState?.phase, gameState?.sessionStats.handsPlayed, isAuthenticated, user]);

  // Start onboarding for first-time users
  useEffect(() => {
    if (!hasCompletedOnboarding && gameState && !isOnboardingActive) {
      // Small delay to let the game render first
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, gameState, isOnboardingActive, startOnboarding]);

  // Trigger contextual tips based on game events
  useEffect(() => {
    if (!gameState || !tipsEnabled) return;

    // First turn tip
    if (gameState.currentPlayerIndex === 0 && gameState.phase === 'pre-flop') {
      triggerTip('first_turn');
      triggerTip('keyboard_available');
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, triggerTip, tipsEnabled]);

  useEffect(() => {
    if (!gameState || !tipsEnabled) return;

    // Cards dealt tip
    if (gameState.phase === 'pre-flop' && 
        gameState.players && 
        gameState.players[0] && 
        gameState.players[0].cards && 
        gameState.players[0].cards.length === 2) {
      triggerTip('cards_dealt');
    }
  }, [gameState?.phase, gameState?.players, triggerTip, tipsEnabled]);

  useEffect(() => {
    if (!gameState || !tipsEnabled) return;

    // Big pot tip
    const totalPot = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
    if (totalPot > 500) {
      triggerTip('big_pot');
    }
  }, [gameState?.pots, triggerTip, tipsEnabled]);

  useEffect(() => {
    if (!gameState || !tipsEnabled) return;

    // First bet tip
    if (gameState.currentBet > 0 && gameState.currentPlayerIndex === 0) {
      triggerTip('first_bet');
    }
  }, [gameState?.currentBet, gameState?.currentPlayerIndex, triggerTip, tipsEnabled]);

  // Mobile-specific tips
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && tipsEnabled) {
      triggerTip('mobile_first_time');
    }
  }, [triggerTip, tipsEnabled]);

  // Keyboard shortcut for help (? key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Check for ? key (shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        navigate('/help');
      }

      // Additional shortcuts for panels
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsRightPanelCollapsed(!isRightPanelCollapsed);
      }
      
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHandStrengthCollapsed(!isHandStrengthCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isRightPanelCollapsed, isHandStrengthCollapsed]);

  const startNewHand = () => {
    if (!gameState) return;
    
    // Sound and haptic for shuffling
    if (settings.soundEnabled) {
      playSound('card-shuffle', { volume: settings.soundVolume * 0.3 });
    }
    triggerHaptic('light');
    
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
    
    // Play card dealing sounds with delays
    if (settings.soundEnabled) {
      // Deal hole cards to each player (2 cards each)
      for (let i = 0; i < NUM_PLAYERS * 2; i++) {
        setTimeout(() => {
          playSound('card-deal', { volume: settings.soundVolume * 0.2 });
        }, i * 150); // Stagger card dealing sounds
      }
    }
    
    // Post blinds (small blind $10, big blind $20)
    const smallBlindIndex = (newState.dealerIndex + 1) % NUM_PLAYERS;
    const bigBlindIndex = (newState.dealerIndex + 2) % NUM_PLAYERS;
    newState = gameEngine.postBlinds(newState, 10, 20);
    
    // Safety check: ensure players array exists
    if (!newState.players || newState.players.length === 0) {
      console.error('Failed to initialize players in new hand');
      return;
    }
    
    // Sound for blinds posting
    if (settings.soundEnabled) {
      setTimeout(() => {
        playSound('chip-place', { volume: settings.soundVolume * 0.15 });
      }, NUM_PLAYERS * 2 * 150 + 200);
    }
    
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
    // Don't process bot actions if game is paused
    if (settings.isPaused) {
      return;
    }
    
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
        setGameState(currentState);
      } else if (botAction.action === 'check') {
        currentState = gameEngine.playerCheck(currentState, currentState.currentPlayerIndex);
        currentState = addActionHistory(
          currentState,
          'player-action',
          'checked',
          currentPlayer.name,
          'check'
        );
        setGameState(currentState);
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
        setGameState(currentState);
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
        const winnerNames = winners.map(player => player.name).join(', ');
        
        const winnerIds = winners.map(player => player.id);
        setWinningPlayerIds(winnerIds);
        
        // Calculate win amount per winner
        const totalPot = currentState.pots.reduce((sum, pot) => sum + pot.amount, 0);
        const winAmountPerWinner = Math.floor(totalPot / winners.length);
        const newWinAmounts: Record<string, number> = {};
        winners.forEach(player => {
          newWinAmounts[player.id] = winAmountPerWinner;
        });
        setWinAmounts(newWinAmounts);
        
        toast({
          variant: "success" as any,
          title: "Hand Complete!",
          description: `${winnerNames} wins the pot - ${winningHand}`,
          duration: 5000,
        });
        
        const { newState, unlockedAchievements } = gameEngine.awardPots(currentState);
        let finalState = newState;

        if (unlockedAchievements.length > 0) {
          unlockedAchievements.forEach(id => {
            toast({
              duration: 5000,
              // @ts-ignore
              description: <AchievementToast achievement={ACHIEVEMENT_LIST[id]} />,
            });
          });
        }
        
        // Add pot award history
        winners.forEach(player => {
          finalState = addActionHistory(
            finalState,
            'pot-award',
            `won $${winAmountPerWinner} - ${winningHand}`,
            player.name,
            undefined,
            winAmountPerWinner
          );
        });
        
        finalState = { ...finalState, phase: 'waiting' as GamePhase };
        setGameState(finalState);
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
      const winnerIds = winners.map(player => player.id);
      setWinningPlayerIds(winnerIds);

      const winnerNames = winners.map(player => player.name).join(', ');
      
      // Calculate win amount per winner
      const totalPot = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
      const winAmountPerWinner = Math.floor(totalPot / winners.length);
      const newWinAmounts: Record<string, number> = {};
      winners.forEach(player => {
        newWinAmounts[player.id] = winAmountPerWinner;
      });
      setWinAmounts(newWinAmounts);
      
      // Trigger haptic feedback and sound for winning
      const humanWon = winners.some(w => w.id === 'player-0');
      if (humanWon) {
        triggerHaptic('success');
        // Play victory sound based on pot size
        if (settings.soundEnabled) {
          if (totalPot > 500) {
            playSound('victory-big', { volume: settings.soundVolume * 0.5 });
          } else {
            playSound('victory-small', { volume: settings.soundVolume * 0.4 });
          }
        }
      } else {
        // Smaller sound for when human loses
        if (settings.soundEnabled) {
          playSound('chip-collect', { volume: settings.soundVolume * 0.25 });
        }
      }
      
      toast({
        variant: humanWon ? "success" : "info" as any,
        title: "Hand Complete!",
        description: `${winnerNames} wins the pot - ${winningHand}`,
        duration: 5000,
      });
      
      // Award pot
      const { newState, unlockedAchievements } = gameEngine.awardPots(state);
      let finalState = newState;

      if (unlockedAchievements.length > 0) {
        unlockedAchievements.forEach(id => {
          toast({
            duration: 5000,
            // @ts-ignore
            description: <AchievementToast achievement={ACHIEVEMENT_LIST[id]} />,
          });
        });
      }
      
      // Add pot award history
      winners.forEach(player => {
        finalState = addActionHistory(
          finalState,
          'pot-award',
          `won $${winAmountPerWinner} - ${winningHand}`,
          player.name,
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
      const winnerNames = winners.map(player => player.name).join(', ');
      const winnerIds = winners.map(player => player.id);
      setWinningPlayerIds(winnerIds);
      
      // Calculate win amount per winner
      const totalPot = newState.pots.reduce((sum, pot) => sum + pot.amount, 0);
      const winAmountPerWinner = Math.floor(totalPot / winners.length);
      const newWinAmounts: Record<string, number> = {};
      winners.forEach(player => {
        newWinAmounts[player.id] = winAmountPerWinner;
      });
      setWinAmounts(newWinAmounts);
      
      // Trigger haptic feedback for winning
      if (winners.some(w => w.id === 'player-0')) {
        triggerHaptic('success');
      }
      
      toast({
        variant: "success" as any,
        title: "Hand Complete!",
        description: `${winnerNames} wins the pot - ${winningHand}`,
        duration: 5000,
      });
      
      const { newState: awardedState, unlockedAchievements } = gameEngine.awardPots(newState);
      let finalState = awardedState;
      
      if (unlockedAchievements.length > 0) {
        unlockedAchievements.forEach(id => {
          toast({
            duration: 5000,
            // @ts-ignore
            description: <AchievementToast achievement={ACHIEVEMENT_LIST[id]} />,
          });
        });
      }
      
      // Add pot award history
      winners.forEach(player => {
        finalState = addActionHistory(
          finalState,
          'pot-award',
          `won $${winAmountPerWinner} - ${winningHand}`,
          player.name,
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
    if (!gameState || isProcessing || settings.isPaused) return;
    setIsProcessing(true);
    
    // Haptic feedback for fold
    triggerHaptic('light');
    // Sound effect for fold with volume control
    if (settings.soundEnabled) {
      playSound('fold', { volume: settings.soundVolume * 0.3 });
    }
    
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
    if (!gameState || isProcessing || settings.isPaused) return;
    setIsProcessing(true);
    
    // Haptic feedback for check
    triggerHaptic('light');
    // Sound effect for check with volume control
    if (settings.soundEnabled) {
      playSound('check', { volume: settings.soundVolume * 0.25 });
    }
    
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
    if (!gameState || isProcessing || settings.isPaused) return;
    setIsProcessing(true);
    const amountToCall = gameState.currentBet - gameState.players[0].bet;
    
    // Haptic feedback for call (medium for money action)
    triggerHaptic('medium');
    // Sound effect for chips being placed
    if (settings.soundEnabled) {
      playSound('chip-place', { volume: settings.soundVolume * 0.3 });
    }
    
    // Trigger chip animation from player to pot
    if (!settings.reducedAnimations && amountToCall > 0) {
      const playerSeat = document.querySelector('[data-testid="player-seat-0"]');
      const pot = document.querySelector('[data-testid="pot-display"]');
      
      if (playerSeat && pot) {
        const playerRect = playerSeat.getBoundingClientRect();
        const potRect = pot.getBoundingClientRect();
        
        // Create multiple chips for larger amounts
        const numChips = Math.min(Math.ceil(amountToCall / 100), 5);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2,
              endY: potRect.top + potRect.height / 2
            }]);
          }, i * 100);
        }
      }
    }
    
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
    if (!gameState || isProcessing || settings.isPaused) return;
    setIsProcessing(true);
    
    // Haptic feedback based on bet size
    const humanPlayer = gameState.players[0];
    const isAllIn = amount >= humanPlayer.chips;
    const isLargeBet = amount > humanPlayer.chips * 0.5;
    
    if (isAllIn) {
      triggerHaptic('heavy');
      if (settings.soundEnabled) {
        playSound('raise', { volume: settings.soundVolume * 0.4 });
        // Additional dramatic sound for all-in
        setTimeout(() => {
          playSound('chip-stack', { volume: settings.soundVolume * 0.4 });
        }, 200);
      }
    } else if (isLargeBet) {
      triggerHaptic('medium');
      if (settings.soundEnabled) {
        playSound('chip-place', { volume: settings.soundVolume * 0.35 });
      }
    } else {
      triggerHaptic('light');
      if (settings.soundEnabled) {
        playSound('chip-place', { volume: settings.soundVolume * 0.25 });
      }
    }
    
    // Trigger chip animation from player to pot
    if (!settings.reducedAnimations && amount > 0) {
      const playerSeat = document.querySelector('[data-testid="player-seat-0"]');
      const pot = document.querySelector('[data-testid="pot-display"]');
      
      if (playerSeat && pot) {
        const playerRect = playerSeat.getBoundingClientRect();
        const potRect = pot.getBoundingClientRect();
        
        // Create multiple chips for larger amounts
        const numChips = Math.min(Math.ceil(amount / 100), 7);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2,
              endY: potRect.top + potRect.height / 2
            }]);
          }, i * 80);
        }
      }
    }
    
    let newState = gameEngine.playerBet(gameState, 0, amount);
    newState = addActionHistory(
      newState,
      'player-action',
      isAllIn ? `went all-in $${amount}` : `bet $${amount}`,
      gameState.players[0].name,
      'bet',
      amount
    );
    handlePlayerAction(newState);
  };

  const handleRaise = (amount: number) => {
    if (!gameState || isProcessing || settings.isPaused) return;
    setIsProcessing(true);
    const currentPlayerBet = gameState.players[0].bet;
    
    // Haptic feedback for raise (always medium to heavy)
    const humanPlayer = gameState.players[0];
    const isAllIn = amount >= humanPlayer.chips;
    const isLargeRaise = amount > humanPlayer.chips * 0.5;
    
    if (isAllIn) {
      triggerHaptic('heavy');
      if (settings.soundEnabled) {
        playSound('raise', { volume: settings.soundVolume * 0.45 });
        // Additional dramatic sound for all-in
        setTimeout(() => {
          playSound('chip-stack', { volume: settings.soundVolume * 0.4 });
        }, 200);
      }
    } else if (isLargeRaise) {
      triggerHaptic('medium');
      if (settings.soundEnabled) {
        playSound('raise', { volume: settings.soundVolume * 0.35 });
      }
    } else {
      triggerHaptic('medium');
      if (settings.soundEnabled) {
        playSound('chip-place', { volume: settings.soundVolume * 0.3 });
      }
    }
    
    // Trigger chip animation from player to pot
    if (!settings.reducedAnimations && amount > 0) {
      const playerSeat = document.querySelector('[data-testid="player-seat-0"]');
      const pot = document.querySelector('[data-testid="pot-display"]');
      
      if (playerSeat && pot) {
        const playerRect = playerSeat.getBoundingClientRect();
        const potRect = pot.getBoundingClientRect();
        
        // Create more chips for raises (they're bigger bets)
        const numChips = Math.min(Math.ceil(amount / 75), 10);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2,
              endY: potRect.top + potRect.height / 2
            }]);
          }, i * 60);
        }
      }
    }
    
    let newState = gameEngine.playerBet(gameState, 0, amount);
    newState = addActionHistory(
      newState,
      'player-action',
      isAllIn ? `went all-in raising to $${currentPlayerBet + amount}` : `raised to $${currentPlayerBet + amount}`,
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

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <PokerLoader 
          size="lg" 
          message="Shuffling the deck..."
        />
      </div>
    );
  }


  const humanPlayer = gameState.players[0];
  const canCheck = gameState.currentBet === 0 || gameState.currentBet === humanPlayer.bet;
  const minBet = gameState.currentBet - humanPlayer.bet || 10;
  const maxBet = humanPlayer.chips;
  const minRaiseAmount = gameState.currentBet + (gameState.currentBet - (gameState.players.find(p => p.bet < gameState.currentBet)?.bet || 0));

  // Table theme colors
  const tableThemeColors = {
    classic: 'hsl(140 70% 25%)',
    blue: 'hsl(220 70% 30%)',
    red: 'hsl(0 60% 30%)',
    purple: 'hsl(280 60% 28%)'
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden" role="main" aria-label="Poker game table">
      {/* Desktop Sidebar - Left Side (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:block w-[300px] h-screen border-r bg-background flex-shrink-0">
        <HandStrengthPanel gameState={gameState} />
      </div>
      
      {/* Tablet Overlay Panel */}
      {isTabletPanelOpen && (
        <div className="hidden md:block lg:hidden">
          <HandStrengthPanel 
            gameState={gameState} 
            isTablet={true}
            onClose={() => setIsTabletPanelOpen(false)}
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Tablet Toggle Button (Hidden on Mobile and Desktop) */}
        <Button
          variant="outline"
          size="icon"
          className="hidden md:flex lg:hidden fixed left-4 top-20 z-50 h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm"
          onClick={() => setIsTabletPanelOpen(!isTabletPanelOpen)}
          data-testid="button-toggle-tablet-panel"
          aria-label={isTabletPanelOpen ? "Hide Hand Analysis panel" : "Show Hand Analysis panel"}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Skip link for keyboard users */}
        <a 
          href="#action-controls" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-poker-chipGold focus:text-black focus:px-4 focus:py-2 focus:rounded-md focus:font-bold"
          data-testid="skip-to-controls"
        >
          Skip to action controls
        </a>
        
        {/* Network Status Indicator */}
      {(!isOnline || isReconnecting) && (
        <div 
          className="fixed top-[calc(var(--safe-area-top,0px)+4.5rem)] left-1/2 -translate-x-1/2 z-[140] 
                     bg-destructive/95 text-destructive-foreground px-4 py-2 rounded-full 
                     shadow-lg backdrop-blur-sm flex items-center gap-2 animate-pulse"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="network-status-indicator"
        >
          {isReconnecting ? (
            <>
              <PokerSpinner size={16} />
              <span className="text-xs font-medium">Reconnecting...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
              <span className="text-xs font-medium">Offline Mode</span>
            </>
          )}
        </div>
      )}
      
      {/* Live region for game status announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {gameState.lastAction || `${getPhaseTitle(gameState.phase)} phase`}
      </div>
      
      {/* Header Controls - Fixed Top Right with safe-area padding */}
      <div className="fixed top-[calc(1rem+var(--safe-area-top))] right-[calc(1rem+var(--safe-area-right))] z-50 flex gap-2">
        <ThemeToggle />
        {tableId && (
          <Link href="/lobby">
            <Button 
              variant="outline" 
              size="default"
              aria-label="Back to Lobby"
              data-testid="button-back-to-lobby"
              className="min-h-11"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Lobby
            </Button>
          </Link>
        )}
        <Link href="/help">
          <Button 
            variant="outline" 
            size="icon"
            aria-label="Help and Documentation"
            data-testid="button-help"
            className="min-h-11 min-w-11"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/settings">
          <Button 
            variant="outline" 
            size="icon"
            aria-label="Application Settings"
            data-testid="button-admin-settings"
            className="min-h-11 min-w-11"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
        <SettingsPanel 
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onPauseToggle={handlePauseToggle}
          disabled={isProcessing}
        />
      </div>

      {/* Main Game Content - Center */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 lg:p-6">
        <div className="w-full max-w-5xl flex flex-col gap-4 items-center">
          {/* Poker Table with Wood Border */}
          <div 
            className="rounded-[100px] xs:rounded-[120px] sm:rounded-[165px] md:rounded-[190px] lg:rounded-[220px] wood-grain p-[7px] xs:p-[8px] sm:p-[10px] md:p-[11px] lg:p-[12px] table-edge-glow w-full max-w-[96%] xs:max-w-[97%] sm:max-w-[98%] md:max-w-full md:min-h-[60vh] lg:min-h-[70vh] max-h-[min(68vh,720px)] xs:max-h-[min(70vh,760px)] sm:max-h-[min(72vh,780px)] md:max-h-[min(75vh,800px)] mx-auto"
            style={{ 
              aspectRatio: tableAspect,
            }}
          >
            {/* Poker Table Felt Surface */}
            <div 
              className="relative felt-texture vignette table-depth rounded-[95px] xs:rounded-[118px] sm:rounded-[158px] md:rounded-[181px] lg:rounded-[210px] overflow-visible w-full h-full"
              style={{ 
                zIndex: 0,
                backgroundColor: tableThemeColors[settings.tableTheme]
              }}
              data-testid="poker-table"
              aria-label={`Poker table - ${getPhaseTitle(gameState.phase)} phase - ${gameState.players.filter(p => !p.folded).length} players active`}
            >
              {/* Community Cards */}
              <CommunityCards 
                cards={gameState.communityCards} 
                phase={gameState.phase}
                colorblindMode={settings.colorblindMode}
              />

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
                  colorblindMode={settings.colorblindMode}
                  onFold={index === 0 ? handleFold : undefined}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                />
              ))}

              {/* Game Phase Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={phaseKey}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2"
                  style={{ zIndex: 10 }}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-poker-chipGold shadow-lg shadow-poker-chipGold/20">
                    <div className="text-base md:text-base sm:text-lg text-poker-chipGold font-bold tracking-wide" data-testid="text-game-phase">
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
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
                  <div className="bg-black/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20">
                    <div className="text-[0.625rem] sm:text-xs text-white" data-testid="text-last-action">
                      {gameState.lastAction}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Paused Overlay */}
              {settings.isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[113px] sm:rounded-[152px] md:rounded-[181px] lg:rounded-[210px]" style={{ zIndex: 100 }}>
                  <div className="bg-card/95 backdrop-blur-md px-8 py-6 rounded-lg border-2 border-poker-chipGold shadow-2xl">
                    <div className="text-2xl font-bold text-center text-poker-chipGold" data-testid="text-game-paused">
                      Game Paused
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Click Resume in Settings to continue
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div id="action-controls" className="w-full max-w-3xl md:max-w-none bg-card/90 sm:bg-card/85 md:bg-card/80 backdrop-blur-lg sm:backdrop-blur-xl rounded-lg border border-card-border shadow-lg p-4 xs:p-5 sm:p-6 md:p-4 pb-[calc(1rem+var(--safe-area-bottom))] sm:pb-[calc(1.25rem+var(--safe-area-bottom))] md:pb-[calc(1rem+var(--safe-area-bottom))]" style={{ zIndex: 5 }}>
            {gameState.phase === 'waiting' ? (
              <Button 
                onClick={startNewHand}
                size="lg"
                className="w-full min-h-[48px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold text-base sm:text-lg"
                data-testid="button-start-hand"
                aria-label="Start new hand"
              >
                Start New Hand
              </Button>
            ) : (
              <>
                {/* Pot Odds and Win Probability Display */}
                {gameState.currentPlayerIndex === 0 && 
                 !humanPlayer.folded && 
                 gameState.currentBet > humanPlayer.bet && (
                  <div className="mb-3">
                    <PotOddsDisplay
                      amountToCall={gameState.currentBet - humanPlayer.bet}
                      potSize={gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)}
                      playerCards={humanPlayer.hand}
                      communityCards={gameState.communityCards}
                      numOpponents={gameState.players.filter(p => !p.folded && p !== humanPlayer).length}
                    />
                  </div>
                )}

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
                  disabled={gameState.currentPlayerIndex !== 0 || isProcessing || settings.isPaused}
                  animationSpeed={settings.animationSpeed}
                  playerFolded={humanPlayer.folded}
                />
              </>
            )}
          </div>
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

      {/* Mobile Swipe Hint with safe-area padding */}
      <div className="fixed bottom-[calc(5rem+var(--safe-area-bottom))] left-1/2 transform -translate-x-1/2 lg:hidden">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-white/70 text-center">
          Swipe left to fold • Swipe right to call/check
        </div>
      </div>

      {/* Floating Action Menu for easy access to secondary features */}
      <FloatingActionMenu
        onStatsClick={() => {
          setIsMobileMenuOpen(true);
          // Set the tab to stats when opened via FAB
          setTimeout(() => {
            const statsTab = document.querySelector('[data-testid="tab-essential"]') as HTMLButtonElement;
            if (statsTab) statsTab.click();
          }, 100);
        }}
        onHistoryClick={() => {
          setIsMobileMenuOpen(true);
          // Set the tab to history when opened via FAB
          setTimeout(() => {
            const historyTab = document.querySelector('[data-testid="tab-history"]') as HTMLButtonElement;
            if (historyTab) historyTab.click();
          }, 100);
        }}
        onTableInfoClick={() => {
          setIsMobileMenuOpen(true);
          // Set the tab to hand analysis when opened via FAB
          setTimeout(() => {
            const analysisTab = document.querySelector('[data-testid="tab-hand-analysis"]') as HTMLButtonElement;
            if (analysisTab) analysisTab.click();
          }, 100);
        }}
        onSettingsClick={() => {
          // Navigate to settings page
          const settingsButton = document.querySelector('[data-testid="button-admin-settings"]') as HTMLButtonElement;
          if (settingsButton) settingsButton.click();
        }}
        className="lg:hidden"
      />

      {/* Mobile Bottom Sheet - Only visible on xs: and hidden on lg: */}
      <div className="xs:block lg:hidden">
        <MobileBottomSheet
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          gameState={gameState}
        />
      </div>

      {/* Desktop Right Sidebar Panel - Action History and Stats */}
      <div className="hidden lg:block absolute top-0 right-0 h-full">
        <RightSidebarPanel 
          gameState={gameState} 
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
        />
      </div>

      {/* Onboarding Flow Overlay */}
      <OnboardingFlow />

      {/* Game Tips */}
      <GameTip position="top-right" />
    </div>
  );
}
