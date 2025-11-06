import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { GameState, GamePhase, Card as PlayingCard, ActionHistoryEntry, PlayerAction, ACHIEVEMENT_LIST, AchievementId } from '@shared/schema';
import { gameEngine } from '@/lib/gameEngine';
import { botAI } from '@/lib/botAI';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState, FullPageLoader } from '@/components/LoadingState';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { 
  ChipPhysics, 
  BettingAnimation, 
  PotCollectionAnimation,
  createChipParticles
} from '@/components/ChipPhysics';
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
import { DevOverlay } from '@/components/DevOverlay';
import { FPSOverlay } from '@/components/FPSOverlay';
import { DevEventLog } from '@/components/DevEventLog';

const NUM_PLAYERS = 6;
const MAX_HISTORY_ENTRIES = 30;

interface FlyingChipData {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay?: number;
}

// Interface for chip physics animation data
interface ChipPhysicsAnimation {
  id: string;
  type: 'bet' | 'pot-collection';
  playerPosition?: { x: number; y: number };
  potPosition?: { x: number; y: number };
  amount: number;
  isAllIn?: boolean;
  isSplitPot?: boolean;
  splitCount?: number;
  winnerId?: string;
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
  const [winningCardIds, setWinningCardIds] = useState<Set<string>>(new Set());
  const [phaseKey, setPhaseKey] = useState(0);
  const [resetKey, setResetKey] = useState(0); // Add a reset key to force re-render PlayerSeats
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [flyingChips, setFlyingChips] = useState<FlyingChipData[]>([]);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isHandStrengthCollapsed, setIsHandStrengthCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTabletPanelOpen, setIsTabletPanelOpen] = useState(false);
  const [showDevOverlay, setShowDevOverlay] = useState(false);
  const [showFps, setShowFps] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [tableAspect, setTableAspect] = useState<string>('3 / 2');
  const potPosition = useRef<{ x: number; y: number }>({ x: 400, y: 150 });
  
  // Chip physics animation state
  const [activeChipAnimations, setActiveChipAnimations] = useState<ChipPhysicsAnimation[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const playerPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
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
    table: any; // Table data from lobby
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
      reducedAnimations: prefersReducedMotion,
      uiScale: 1
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

  // CRITICAL FIX: Memoize pot calculation to ensure all PotDisplay components get the same value
  // This MUST be defined BEFORE any conditional returns to follow React's rules of hooks
  const totalPotAmount = useMemo(() => {
    if (!gameState) return 0;
    
    // The pots array already includes all bets that have been collected by calculatePots
    // We should ONLY use the pots amount, not add current player bets
    const potAmount = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
    
    // Log for debugging pot synchronization
    console.log('[PokerGame] Pot calculation:', {
      pots: gameState.pots,
      potAmount,
      phase: gameState.phase
    });
    
    return potAmount;
  }, [gameState?.pots]);

  // Memoize side pots as well
  const sidePots = useMemo(() => gameState ? gameState.pots.map(p => p.amount) : [], [gameState?.pots]);

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
    
    // Reset ALL players to $1000 for a fresh start
    initialState.players = initialState.players.map((player, index) => ({
      ...player,
      chips: 1000,  // Force all players to start with $1000
      name: index === 0 ? (isAuthenticated && user ? user.displayName : 'You') : player.name
    }));
    
    // Clear any existing game state
    setGameState(initialState);
    setWinningPlayerIds([]);
    setWinAmounts({});
    setWinningCardIds(new Set());
    setFlyingChips([]);
    setPhaseKey(0);
    setResetKey(prev => prev + 1); // Increment reset key to force complete re-render
    
    console.log('Game reset - all players set to $1000:', initialState.players.map(p => ({ name: p.name, chips: p.chips })));
    
    toast({
      title: "Game Reset",
      description: "A new game has started - all players reset to $1000.",
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
      const table = tableData.table;
      
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

  // Set up chip animation callback on game engine
  useEffect(() => {
    const handleChipAnimation = (event: any) => {
      if (settings.reducedAnimations) return;
      
      // Get player position
      const playerSeat = document.querySelector(`[data-testid="player-seat-${event.playerId}"]`);
      const pot = document.querySelector('[data-testid="pot-display"]');
      
      if (!playerSeat || !pot) return;
      
      const playerRect = playerSeat.getBoundingClientRect();
      const potRect = pot.getBoundingClientRect();
      
      const playerPos = {
        x: playerRect.left + playerRect.width / 2,
        y: playerRect.top + playerRect.height / 2
      };
      
      const potPos = {
        x: potRect.left + potRect.width / 2,
        y: potRect.top + potRect.height / 2
      };
      
      // Create chip physics animation
      const animationId = `chip-anim-${Date.now()}-${Math.random()}`;
      
      if (event.type === 'pot-win' || event.type === 'split-pot') {
        // Pot collection animation
        setActiveChipAnimations(prev => [...prev, {
          id: animationId,
          type: 'pot-collection',
          potPosition: potPos,
          playerPosition: playerPos,
          amount: event.amount,
          isSplitPot: event.isSplitPot,
          splitCount: event.splitCount,
          winnerId: event.winnerId,
          winType: event.winType // Pass win type for special effects
        }]);
      } else {
        // Betting animation
        setActiveChipAnimations(prev => [...prev, {
          id: animationId,
          type: 'bet',
          playerPosition: playerPos,
          potPosition: potPos,
          amount: event.amount,
          isAllIn: event.isAllIn
        }]);
      }
      
      // Clean up animation after 4 seconds
      setTimeout(() => {
        setActiveChipAnimations(prev => prev.filter(a => a.id !== animationId));
      }, 4000);
    };
    
    // Register the callback
    gameEngine.onChipAnimation(handleChipAnimation);
    
    // No cleanup needed as the callback is on the singleton gameEngine
  }, [settings.reducedAnimations]);
  
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
        gameState.players[0].hand && 
        gameState.players[0].hand.length === 2) {
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

      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDevOverlay(prev => !prev);
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFps(prev => !prev);
      }

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowEventLog(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isRightPanelCollapsed, isHandStrengthCollapsed]);

  const startNewHand = () => {
    if (!gameState) {
      console.error('Cannot start new hand: gameState is null');
      // Initialize game if not already initialized
      const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
      setGameState(initialState);
      return;
    }
    
    // Sound and haptic for shuffling
    if (settings.soundEnabled) {
      playSound('card-shuffle', { volume: settings.soundVolume * 0.3 });
    }
    triggerHaptic('light');
    
    setWinningPlayerIds([]);
    setWinAmounts({});
    setFlyingChips([]);
    let newState = gameEngine.startNewHand(gameState);
    
    // Check if game is over (human player eliminated)
    if (newState.gameOver) {
      setGameState(newState);
      
      // Save final stats to backend if authenticated
      if (isAuthenticated && user) {
        const humanPlayer = newState.players.find(p => p.isHuman);
        if (humanPlayer) {
          saveBankrollMutation.mutate(humanPlayer.chips); // Should be 0
          saveStatsMutation.mutate({
            handsPlayed: newState.sessionStats.handsPlayed,
            handsWon: newState.sessionStats.handsWonByPlayer,
            biggestPot: humanPlayer.stats?.biggestPot || 0,
            totalWinnings: 0,
            achievements: Object.entries(newState.achievements)
              .filter(([_, ach]) => ach.unlockedAt !== undefined)
              .map(([id]) => id as AchievementId)
          });
        }
      }
      
      // Show game over notification
      toast({
        variant: "destructive",
        title: "Game Over",
        description: "You are out of chips! Your session stats have been saved.",
        duration: Infinity,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResetGame()}
          >
            Start New Game
          </Button>
        ),
      });
      return;
    }
    
    // Safety check: ensure players array exists (but don't reset for game over)
    if (!newState.players || newState.players.length === 0) {
      console.error('Failed to initialize players in new hand:', newState);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start new hand. Please refresh the page.",
        duration: 5000,
      });
      return;
    }
    
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
    
    // Post blinds (small blind $5, big blind $10)
    const smallBlindIndex = (newState.dealerIndex + 1) % NUM_PLAYERS;
    const bigBlindIndex = (newState.dealerIndex + 2) % NUM_PLAYERS;
    newState = gameEngine.postBlinds(newState, 5, 10);
    
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
      5  // Corrected to actual small blind amount
    );
    newState = addActionHistory(
      newState,
      'blinds-posted',
      'posted big blind',
      newState.players[bigBlindIndex].name,
      undefined,
      10  // Corrected to actual big blind amount
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
    let iterations = 0;
    const MAX_ITERATIONS = 50; // Prevent infinite loops
    const startTime = Date.now();
    const MAX_TIME = 30000; // 30 second timeout

    while (currentState.currentPlayerIndex !== 0 && !gameEngine.isRoundComplete(currentState)) {
      // Safety checks to prevent infinite loops
      iterations++;
      if (iterations > MAX_ITERATIONS) {
        console.error('Bot action processing exceeded maximum iterations');
        toast({
          variant: "destructive",
          title: "Game Error",
          description: "Bot processing stalled. Advancing to next round.",
          duration: 5000,
        });
        // Force advance to next phase as fallback
        if (currentState.phase !== 'showdown' && currentState.phase !== 'waiting') {
          currentState = gameEngine.advancePhase(currentState);
          setGameState(currentState);
        }
        break;
      }
      
      // Check for timeout
      if (Date.now() - startTime > MAX_TIME) {
        console.error('Bot action processing timed out');
        toast({
          variant: "destructive",
          title: "Game Timeout",
          description: "Bot decision took too long. Advancing to next round.",
          duration: 5000,
        });
        // Force advance to next phase as fallback
        if (currentState.phase !== 'showdown' && currentState.phase !== 'waiting') {
          currentState = gameEngine.advancePhase(currentState);
          setGameState(currentState);
        }
        break;
      }
      
      const currentPlayer = currentState.players[currentState.currentPlayerIndex];
      
      if (currentPlayer.folded) {
        currentState = {
          ...currentState,
          currentPlayerIndex: gameEngine.getNextPlayerIndex(currentState)
        };
        continue;
      }

      // Get bot action with error handling
      let botAction;
      try {
        botAction = botAI.getAction(currentPlayer, currentState);
      } catch (error) {
        console.error('Error getting bot action:', error);
        // Default to check/fold as fallback
        botAction = currentState.currentBet > currentPlayer.bet 
          ? { action: 'fold' as const }
          : { action: 'check' as const };
      }
      
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
      
      // Check if we should fast-forward (all players are all-in or folded)
      const shouldFastForward = currentState.players.filter(p => !p.folded && !p.allIn).length === 0;
      
      if (activePlayers.length === 1) {
        const { winners, winningHand, bestCombos } = gameEngine.resolveShowdown(currentState);
        const winnerNames = winners.map(player => player.name).join(', ');
        
        const winnerIds = winners.map(player => player.id);
        setWinningPlayerIds(winnerIds);
        const idSet = new Set<string>();
        Object.values(bestCombos || {}).forEach(cards => cards?.forEach(c => idSet.add(c.id)));
        setWinningCardIds(idSet);
        
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
      
      // Fast-forward through remaining phases if all players are all-in
      if (shouldFastForward && currentState.phase !== 'river' && currentState.phase !== 'showdown') {
        toast({
          variant: "info" as any,
          title: "All-In Showdown",
          description: "Fast-forwarding to showdown - all players are all-in!",
          duration: 3000,
        });
        
        // Quickly advance through remaining phases
        while (currentState.phase !== 'river' && currentState.phase !== 'showdown') {
          currentState = gameEngine.advancePhase(currentState);
          
          // Add history for community cards
          if (currentState.phase === 'flop') {
            currentState = addActionHistory(currentState, 'cards-dealt', 'Flop cards dealt');
          } else if (currentState.phase === 'turn') {
            currentState = addActionHistory(currentState, 'cards-dealt', 'Turn card dealt');
          } else if (currentState.phase === 'river') {
            currentState = addActionHistory(currentState, 'cards-dealt', 'River card dealt');
          }
          
          setGameState({ ...currentState });
          setPhaseKey(prev => prev + 1);
          
          // Short delay between phase transitions for visual effect
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Now resolve the showdown
        await resolveShowdown(currentState);
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
    const { winners, winningHand, bestCombos } = gameEngine.resolveShowdown(state);
    
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
      const idSet = new Set<string>();
      Object.values(bestCombos || {}).forEach(cards => cards?.forEach(c => idSet.add(c.id)));
      setWinningCardIds(idSet);
      
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
    if (!settings.reducedAnimations && amountToCall > 0 && !document.hidden) {
      const playerSeat = document.querySelector('[data-testid="player-seat-0"]');
      const pot = document.querySelector('[data-testid="pot-display"]');
      
      if (playerSeat && pot) {
        const playerRect = playerSeat.getBoundingClientRect();
        const potRect = pot.getBoundingClientRect();
        
        // Create multiple chips for larger amounts
        const base = Math.min(Math.ceil(amountToCall / 100), 5);
        const smallScreen = (typeof window !== 'undefined') && window.innerWidth < 480;
        const numChips = Math.min(base, smallScreen ? 4 : base);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            const jitterX = (Math.random() * 14 - 7);
            const jitterY = (Math.random() * 10 - 5);
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2 + jitterX,
              endY: potRect.top + potRect.height / 2 + jitterY
            }]);
          }, i * 90);
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
        const baseChips = Math.min(Math.ceil(amount / 100), 7);
        let numChips = isAllIn ? baseChips + 8 : baseChips;
        numChips = Math.min(numChips, 20);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            const jitterX = isAllIn ? (Math.random() * 30 - 15) : 0;
            const jitterY = isAllIn ? (Math.random() * 20 - 10) : 0;
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2 + jitterX,
              endY: potRect.top + potRect.height / 2 + jitterY
            }]);
          }, i * (isAllIn ? 50 : 80));
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
        const baseChips = Math.min(Math.ceil(amount / 75), 10);
        let numChips = isAllIn ? baseChips + 10 : baseChips;
        numChips = Math.min(numChips, 20);
        for (let i = 0; i < numChips; i++) {
          setTimeout(() => {
            const jitterX = isAllIn ? (Math.random() * 40 - 20) : 0;
            const jitterY = isAllIn ? (Math.random() * 25 - 12) : 0;
            setFlyingChips(prev => [...prev, {
              id: Date.now() + i,
              startX: playerRect.left + playerRect.width / 2,
              startY: playerRect.top + playerRect.height / 2,
              endX: potRect.left + potRect.width / 2 + jitterX,
              endY: potRect.top + potRect.height / 2 + jitterY
            }]);
          }, i * (isAllIn ? 45 : 60));
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

  // Check if players are initialized
  if (!gameState.players || gameState.players.length === 0) {
    console.error('GameState has no players:', gameState);
    // Try to initialize the game
    const initialState = gameEngine.createInitialGameState(NUM_PLAYERS);
    setGameState(initialState);
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <PokerLoader 
          size="lg" 
          message="Setting up the table..."
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
  const tableThemeColors: Record<string, string> = {
    classic: 'hsl(140 70% 25%)',
    blue: 'hsl(220 70% 30%)',
    red: 'hsl(0 60% 30%)',
    purple: 'hsl(280 60% 28%)',
    luxury: '#0f3b16', // deep green with subtle luxury vibe
    saloon: '#5e4426', // wood-brown felt
    minimal: '#184a3b', // modern teal-green
    neon: '#112244' // dark base; neon accents via table-edge glow css
  };

  return (
    <div className={`min-h-screen bg-background ${settings.highContrast ? 'high-contrast' : ''} ${settings.largeText ? 'large-text' : ''}`} role="main" aria-label="Poker game table">
      {/* Desktop Layout (lg+): Three-zone layout with grid */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr_320px] lg:h-screen lg:overflow-hidden">
        {/* Desktop Left Sidebar - Hand Analysis */}
        <div className="border-r bg-background overflow-y-auto">
          <HandStrengthPanel gameState={gameState} />
        </div>
        
        {/* Desktop Center Column - Game Area + Controls */}
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Enhanced Header with Navigation - in center column */}
          <div className="flex justify-between items-center p-4 gap-2 border-b bg-background/95 backdrop-blur-sm app-header">
            {/* Left side - Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              {tableId ? (
                <>
                  <Link href="/lobby" className="text-muted-foreground hover:text-foreground transition-colors">
                    Lobby
                  </Link>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">Table {tableId}</span>
                </>
              ) : (
                <span className="text-foreground font-medium">Demo Game</span>
              )}
            </nav>
            
            {/* Mobile Menu Button - Triggers existing mobile sheet */}
            <div className="sm:hidden">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                data-testid="button-hamburger-menu"
                className="min-h-11 min-w-11"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {tableId && (
                <Link href="/lobby" className="hidden sm:block">
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
              <Link href="/help" className="hidden sm:block">
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
              <Link href="/settings" className="hidden sm:block">
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
                settings={{
                  ...settings,
                  performanceMetrics: gameState.performanceMetrics ? {
                    winRate: gameState.performanceMetrics.winRate,
                    consecutiveWins: gameState.performanceMetrics.consecutiveWins,
                    consecutiveLosses: gameState.performanceMetrics.consecutiveLosses,
                    bankrollTrend: gameState.performanceMetrics.bankrollTrend
                  } : undefined,
                  currentDifficulty: gameState.difficultySettings?.currentLevel,
                  difficultyMode: gameState.difficultySettings?.mode
                }}
                onSettingsChange={handleSettingsChange}
                onPauseToggle={handlePauseToggle}
                disabled={isProcessing}
              />
          </div>
          
          {/* Game Table Area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-6">
            <div className="w-full max-w-5xl">
              {/* Crypto Gaming Table */}
              <div 
                className="crypto-table crypto-table-border rounded-[220px] w-full mx-auto relative"
                style={{ 
                  aspectRatio: tableAspect,
                  overflow: 'visible',
                  minHeight: '420px'
                }}
              >
                {/* Glow orbs for corner effects */}
                <div className="glow-orb glow-orb-purple" style={{ top: '-150px', left: '-150px' }} />
                <div className="glow-orb glow-orb-pink" style={{ top: '-150px', right: '-150px' }} />
                <div className="glow-orb glow-orb-cyan" style={{ bottom: '-150px', left: '-100px' }} />
                <div className="glow-orb glow-orb-cyan" style={{ bottom: '-150px', right: '-100px' }} />
                
                {/* Grid pattern overlay */}
                <div className="crypto-table-grid rounded-[220px]" />
                
                {/* Ambient particles */}
                <div className="ambient-particle" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
                <div className="ambient-particle" style={{ top: '30%', right: '15%', animationDelay: '2s' }} />
                <div className="ambient-particle" style={{ top: '70%', left: '20%', animationDelay: '4s' }} />
                <div className="ambient-particle" style={{ bottom: '20%', right: '25%', animationDelay: '6s' }} />
                
                {/* Inner Table Surface */}
                <div 
                  className="relative rounded-[210px] overflow-visible w-full h-full"
                  style={{ 
                    zIndex: 2
                  }}
                  data-testid="poker-table"
                  aria-label={`Poker table - ${getPhaseTitle(gameState.phase)} phase - ${gameState.players.filter(p => !p.folded).length} players active`}
                >
                  {/* Community Cards */}
                  <CommunityCards 
                    cards={gameState.communityCards} 
                    phase={gameState.phase}
                    colorblindMode={settings.colorblindMode}
                    highlightIds={winningCardIds}
                  />

                  {/* Pot Display */}
                  <PotDisplay 
                    amount={totalPotAmount} 
                    onRef={handlePotRef}
                    sidePots={sidePots}
                  />

                  {/* Player Seats */}
                  {gameState.players.map((player, index) => (
                    <PlayerSeat
                      key={`${player.id}-${resetKey}`}
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
                      highlightCardIds={winningCardIds}
                    />
                  ))}

                  {/* Game Over Overlay */}
                  {gameState.gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 rounded-[210px] bg-black/80">
                      <div className="bg-card p-8 rounded-lg shadow-2xl text-center max-w-md">
                        <h2 className="text-3xl font-bold mb-4 text-destructive">Game Over</h2>
                        <p className="text-lg mb-6">You've run out of chips!</p>
                        
                        {/* Display session stats */}
                        <div className="bg-background rounded-lg p-4 mb-6">
                          <h3 className="text-sm font-semibold mb-3">Session Stats</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hands Played:</span>
                              <span className="font-medium">{gameState.sessionStats.handsPlayed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hands Won:</span>
                              <span className="font-medium">{gameState.sessionStats.handsWonByPlayer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Win Rate:</span>
                              <span className="font-medium">
                                {gameState.sessionStats.handsPlayed > 0 
                                  ? `${Math.round((gameState.sessionStats.handsWonByPlayer / gameState.sessionStats.handsPlayed) * 100)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Biggest Pot Won:</span>
                              <span className="font-medium">${humanPlayer.stats?.biggestPot || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => handleResetGame()}
                            variant="default"
                            size="lg"
                            data-testid="button-new-game-after-game-over"
                          >
                            Start New Game
                          </Button>
                          {tableId && (
                            <Link href="/lobby">
                              <Button
                                variant="outline"
                                size="lg"
                                data-testid="button-back-to-lobby-after-game-over"
                              >
                                Back to Lobby
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                        <div className="text-base text-poker-chipGold font-bold tracking-wide" data-testid="text-game-phase">
                          {getPhaseTitle(gameState.phase)}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Chip Physics Animations */}
                  {activeChipAnimations.map(animation => {
                    if (animation.type === 'bet' && animation.playerPosition && animation.potPosition) {
                      return (
                        <BettingAnimation
                          key={animation.id}
                          playerPosition={animation.playerPosition}
                          betPosition={animation.potPosition}
                          amount={animation.amount}
                          isAllIn={animation.isAllIn}
                          onComplete={() => {
                            setActiveChipAnimations(prev => prev.filter(a => a.id !== animation.id));
                          }}
                        />
                      );
                    } else if (animation.type === 'pot-collection' && animation.potPosition && animation.playerPosition) {
                      return (
                        <PotCollectionAnimation
                          key={animation.id}
                          potPosition={animation.potPosition}
                          winnerPosition={animation.playerPosition}
                          amount={animation.amount}
                          isSplitPot={animation.isSplitPot}
                          splitCount={animation.splitCount}
                          onComplete={() => {
                            setActiveChipAnimations(prev => prev.filter(a => a.id !== animation.id));
                          }}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Winner Celebration */}
                  {winningPlayerIds.length > 0 && (
                    <>
                      {winningPlayerIds.map(winnerId => {
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
                    </>
                  )}

                  {/* Last Action */}
                  {gameState.lastAction && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
                      <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                        <div className="text-xs text-white" data-testid="text-last-action">
                          {gameState.lastAction}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Game Paused Overlay */}
                  {settings.isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[210px]" style={{ zIndex: 100 }}>
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
            </div>
          </div>
          </div>
          
          {/* Action Controls Dock - Fixed at Bottom of Center Column */}
          <div className="border-t bg-background p-4">
            <div id="action-controls" className="w-full max-w-3xl mx-auto" style={{ transform: `scale(${settings.uiScale ?? 1})`, transformOrigin: 'bottom center' }}>
              {gameState.phase === 'waiting' ? (
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={startNewHand}
                    size="lg"
                    className="w-full min-h-[48px] btn-gradient-primary font-bold text-base"
                    data-testid="button-start-hand"
                    aria-label="Start new hand"
                  >
                    Start New Hand
                  </Button>
                  <Button 
                    onClick={handleResetGame}
                    size="lg"
                    variant="outline"
                    className="w-full min-h-[48px] font-bold text-base"
                    data-testid="button-start-new-game"
                    aria-label="Start new game - reset all chips to $1000"
                  >
                    Start New Game (Reset All Chips to $1000)
                  </Button>
                </div>
              ) : gameState.currentPlayerIndex === 0 && !humanPlayer.folded ? (
                <>
                  {/* Pot Odds Display */}
                  {gameState.currentBet > humanPlayer.bet && (
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

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`controls-${gameState.currentPlayerIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
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
                        disabled={isProcessing || settings.isPaused}
                        animationSpeed={settings.animationSpeed}
                        playerFolded={humanPlayer.folded}
                        isProcessing={isProcessing}
                        logScale={true}
                      />
                    </motion.div>
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex items-center justify-center gap-3 py-3 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"></div>
                  <span>Waiting for your turn...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Desktop Right Sidebar - Action History and Stats */}
        <div className="border-l bg-background overflow-y-auto">
          <RightSidebarPanel 
            gameState={gameState} 
            isCollapsed={false}
          />
        </div>
      </div>
      
      {/* Mobile and Tablet Layout (< lg) */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Mobile/Tablet Header with Safe Area */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b"
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0px)',
          }}
        >
          <div 
            className="flex justify-between items-center p-4 gap-2"
            style={{ 
              paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
            }}>
            <div className="flex gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Tablet Toggle Button */}
              <Button
                variant="outline"
                size="icon"
                className="hidden md:flex lg:hidden"
                onClick={() => setIsTabletPanelOpen(!isTabletPanelOpen)}
                data-testid="button-toggle-tablet-panel"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {tableId && (
                <Link href="/lobby">
                  <Button 
                    variant="outline" 
                    size="sm"
                    aria-label="Back to Lobby"
                    data-testid="button-back-to-lobby-mobile"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="flex gap-2">
              <ThemeToggle />
              <Link href="/help">
                <Button 
                  variant="outline" 
                  size="icon"
                  aria-label="Help and Documentation"
                  data-testid="button-help-mobile"
                  className="min-h-10 min-w-10"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button 
                  variant="outline" 
                  size="icon"
                  aria-label="Application Settings"
                  data-testid="button-admin-settings-mobile"
                  className="min-h-10 min-w-10"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile Game Area with safe area padding for header and bottom */}
        <div 
          className="flex-1 relative overflow-hidden"
          style={{
            marginTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
            marginBottom: 'calc(13rem + env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.5rem)',
            paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)',
          }}>
          {/* Mobile Game Table */}
          <div className="flex items-center justify-center h-full p-4">
            <div className="w-full max-w-lg">
              {/* Crypto Gaming Table - Mobile */}
              <div 
                className="crypto-table crypto-table-border rounded-[220px] w-full mx-auto relative"
                style={{ 
                  aspectRatio: tableAspect,
                  overflow: 'visible',
                  minHeight: '300px'
                }}
              >
                {/* Glow orbs for corner effects - smaller for mobile */}
                <div className="glow-orb glow-orb-purple" style={{ top: '-100px', left: '-100px', transform: 'scale(0.7)' }} />
                <div className="glow-orb glow-orb-pink" style={{ top: '-100px', right: '-100px', transform: 'scale(0.7)' }} />
                <div className="glow-orb glow-orb-cyan" style={{ bottom: '-80px', left: '-80px', transform: 'scale(0.6)' }} />
                <div className="glow-orb glow-orb-cyan" style={{ bottom: '-80px', right: '-80px', transform: 'scale(0.6)' }} />
                
                {/* Grid pattern overlay */}
                <div className="crypto-table-grid rounded-[220px]" />
                
                {/* Ambient particles - fewer for mobile performance */}
                <div className="ambient-particle" style={{ top: '25%', left: '15%', animationDelay: '0s' }} />
                <div className="ambient-particle" style={{ bottom: '25%', right: '20%', animationDelay: '3s' }} />
                
                {/* Inner Table Surface */}
                <div 
                  className="relative rounded-[210px] overflow-visible w-full h-full"
                  style={{ 
                    zIndex: 2
                  }}
                  data-testid="poker-table-mobile"
                  aria-label={`Poker table - ${getPhaseTitle(gameState.phase)} phase - ${gameState.players.filter(p => !p.folded).length} players active`}
                >
                  {/* Community Cards */}
                  <CommunityCards 
                    cards={gameState.communityCards} 
                    phase={gameState.phase}
                    colorblindMode={settings.colorblindMode}
                    highlightIds={winningCardIds}
                  />

                  {/* Pot Display */}
                  <PotDisplay 
                    amount={totalPotAmount} 
                    onRef={handlePotRef}
                    sidePots={sidePots}
                  />

                  {/* Player Seats */}
                  {gameState.players.map((player, index) => (
                    <PlayerSeat
                      key={`${player.id}-${resetKey}`}
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
                      highlightCardIds={winningCardIds}
                    />
                  ))}

                  {/* Game Over Overlay */}
                  {gameState.gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 rounded-[210px] bg-black/80">
                      <div className="bg-card p-8 rounded-lg shadow-2xl text-center max-w-md">
                        <h2 className="text-3xl font-bold mb-4 text-destructive">Game Over</h2>
                        <p className="text-lg mb-6">You've run out of chips!</p>
                        
                        {/* Display session stats */}
                        <div className="bg-background rounded-lg p-4 mb-6">
                          <h3 className="text-sm font-semibold mb-3">Session Stats</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hands Played:</span>
                              <span className="font-medium">{gameState.sessionStats.handsPlayed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hands Won:</span>
                              <span className="font-medium">{gameState.sessionStats.handsWonByPlayer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Win Rate:</span>
                              <span className="font-medium">
                                {gameState.sessionStats.handsPlayed > 0 
                                  ? `${Math.round((gameState.sessionStats.handsWonByPlayer / gameState.sessionStats.handsPlayed) * 100)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Biggest Pot Won:</span>
                              <span className="font-medium">${humanPlayer.stats?.biggestPot || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => handleResetGame()}
                            variant="default"
                            size="lg"
                            data-testid="button-new-game-after-game-over"
                          >
                            Start New Game
                          </Button>
                          {tableId && (
                            <Link href="/lobby">
                              <Button
                                variant="outline"
                                size="lg"
                                data-testid="button-back-to-lobby-after-game-over"
                              >
                                Back to Lobby
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Game Phase Indicator */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phaseKey}
                      className="absolute top-2 left-1/2 transform -translate-x-1/2"
                      style={{ zIndex: 10 }}
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-poker-chipGold shadow-lg shadow-poker-chipGold/20">
                        <div className="text-xs text-poker-chipGold font-bold tracking-wide" data-testid="text-game-phase-mobile">
                          {getPhaseTitle(gameState.phase)}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Last Action */}
                  {gameState.lastAction && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                        <div className="text-xs text-white" data-testid="text-last-action-mobile">
                          {gameState.lastAction}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Game Paused Overlay */}
                  {settings.isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[210px]" style={{ zIndex: 100 }}>
                      <div className="bg-card/95 backdrop-blur-md px-6 py-4 rounded-lg border-2 border-poker-chipGold shadow-2xl">
                        <div className="text-lg font-bold text-center text-poker-chipGold" data-testid="text-game-paused-mobile">
                          Game Paused
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          Click Resume in Settings
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Bottom Sheet for Action Controls with Safe Area */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg"
          style={{ 
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)',
            paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0px)',
            paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0px)',
          }}
        >
          {gameState.phase === 'waiting' ? (
            <div className="p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={startNewHand}
                  size="lg"
                  className="w-full min-h-[48px] btn-gradient-primary font-bold text-base"
                  data-testid="button-start-hand-mobile"
                  aria-label="Start new hand"
                >
                  Start New Hand
                </Button>
                <Button 
                  onClick={handleResetGame}
                  size="lg"
                  variant="outline"
                  className="w-full min-h-[48px] font-bold text-base"
                  data-testid="button-start-new-game-mobile"
                  aria-label="Start new game - reset all chips to $1000"
                >
                  Start New Game (Reset All Chips to $1000)
                </Button>
              </div>
            </div>
          ) : gameState.currentPlayerIndex === 0 && !humanPlayer.folded ? (
            <div className="p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
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
                disabled={isProcessing || settings.isPaused}
                animationSpeed={settings.animationSpeed}
                playerFolded={humanPlayer.folded}
                isProcessing={isProcessing}
                logScale={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 p-4 text-sm text-muted-foreground" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
              <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"></div>
              <span>Waiting for your turn...</span>
            </div>
          )}
        </div>
        
        {/* Mobile Menu Sheet (for stats, history, etc) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-[300px] sm:w-[400px] p-0 bg-background/95 backdrop-blur-sm"
          >
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Game Menu</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="p-4 space-y-4">
                {/* Navigation Links */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Navigation</h3>
                  <div className="flex flex-col gap-2">
                    <Link href="/" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Home</span>
                    </Link>
                    <Link href="/lobby" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Lobby</span>
                    </Link>
                    <Link href="/help" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                      <HelpCircle className="w-4 h-4" />
                      <span>Help & Rules</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
                <Separator />
                
                {/* Hand Strength Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Hand Analysis</h3>
                  <HandStrengthPanel gameState={gameState} />
                </div>
                
                {/* Game Stats */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Game Statistics</h3>
                  <Card className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Players</span>
                        <span>{gameState.players.filter(p => p).length}/{gameState.players.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pot Size</span>
                        <span className="font-bold">${gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)}</span>
                      </div>
                      {gameState.performanceMetrics && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate</span>
                            <span>{gameState.performanceMetrics.winRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Streak</span>
                            <span>
                              {gameState.performanceMetrics.consecutiveWins > 0 
                                ? `🔥 ${gameState.performanceMetrics.consecutiveWins} wins`
                                : gameState.performanceMetrics.consecutiveLosses > 0
                                ? `${gameState.performanceMetrics.consecutiveLosses} losses`
                                : 'None'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
                
                {/* Action History */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Recent Actions</h3>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                    {gameState.actionHistory?.slice(-10).reverse().map((action, idx) => (
                      <div key={idx} className="text-xs py-1">
                        <span className="text-muted-foreground">{action.message}</span>
                      </div>
                    )) || <div className="text-xs text-muted-foreground">No actions yet</div>}
                  </ScrollArea>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Common Elements for both layouts */}
      
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

      {/* Mobile Bottom Sheet - Only visible on mobile and tablet, hidden on desktop */}
      <div className="block lg:hidden">
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
      {showDevOverlay && <DevOverlay state={gameState} />}
      {showFps && <FPSOverlay />}
      {showEventLog && <DevEventLog history={gameState?.actionHistory || []} />}
    </div>
  );
}
