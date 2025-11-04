import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { GameState, GamePhase, Card, ActionHistoryEntry, PlayerAction, ACHIEVEMENT_LIST, BlindLevel, PayoutPosition } from '@shared/schema';
import { GameEngine } from '@/lib/gameEngine';
import { TournamentManager, TournamentState, TournamentPlayer, TournamentEventCallback } from '@/lib/tournamentManager';
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
import { HandStrengthIndicator } from '@/components/HandStrengthIndicator';
import { HandStrengthPanel } from '@/components/HandStrengthPanel';
import { PotOddsDisplay } from '@/components/PotOddsDisplay';
import { WinnerCelebration } from '@/components/WinnerCelebration';
import { MobileBottomSheet } from '@/components/MobileBottomSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingChip } from '@/components/Chip';
import { ChipPhysics, BettingAnimation, PotCollectionAnimation, createChipParticles, ChipAnimationEvent } from '@/components/ChipPhysics';
import { Trophy, TrendingUp, Users, Clock, AlertCircle, ChevronRight, ChevronLeft, Info, Medal, Crown, Star, Target, Zap } from 'lucide-react';
import { PokerLoader, PokerSpinner } from '@/components/PokerLoader';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsPanel, GameSettings } from '@/components/SettingsPanel';
import { useOrientation } from '@/hooks/useOrientation';
import { cn } from '@/lib/utils';

const MAX_HISTORY_ENTRIES = 30;

// Tournament phase determination
function getTournamentPhase(tournament: TournamentState): 'early' | 'middle' | 'bubble' | 'final' {
  const remainingPlayers = Array.from(tournament.players.values()).filter(p => p.status === 'playing').length;
  const totalPlayers = tournament.maxPlayers;
  const paidPositions = tournament.payoutStructure.length;
  
  if (remainingPlayers <= 9) return 'final';
  if (remainingPlayers <= paidPositions + 3) return 'bubble';
  if (remainingPlayers <= totalPlayers * 0.5) return 'middle';
  return 'early';
}

// Format timer
function formatTimer(milliseconds: number): string {
  if (!milliseconds || milliseconds <= 0) return '00:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Tournament Info Panel Component
function TournamentInfoPanel({ tournament, currentPlayer, isOpen, onToggle }: {
  tournament: TournamentState;
  currentPlayer?: TournamentPlayer;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const currentBlind = tournament.blindStructure[tournament.currentBlindLevel] || tournament.blindStructure[0];
  const nextBlind = tournament.blindStructure[tournament.currentBlindLevel + 1];
  const remainingPlayers = Array.from(tournament.players.values())
    .filter(p => p.status === 'playing')
    .sort((a, b) => b.chipCount - a.chipCount);
  
  const averageStack = remainingPlayers.reduce((acc, p) => acc + p.chipCount, 0) / remainingPlayers.length;
  const myPosition = currentPlayer ? remainingPlayers.findIndex(p => p.id === currentPlayer.id) + 1 : 0;
  
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{tournament.name}</SheetTitle>
          <SheetDescription>
            Tournament Information
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="blinds">Blinds</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <UICard>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Your Position</div>
                    <div className="text-2xl font-bold">{myPosition} / {remainingPlayers.length}</div>
                  </CardContent>
                </UICard>
                <UICard>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Avg Stack</div>
                    <div className="text-2xl font-bold">${Math.round(averageStack)}</div>
                  </CardContent>
                </UICard>
              </div>
              
              <UICard>
                <CardHeader>
                  <CardTitle className="text-sm">Remaining Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {remainingPlayers.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                            <span className="font-medium">#{index + 1}</span>
                            <span className={cn(player.id === currentPlayer?.id && "text-primary font-semibold")}>
                              {player.name}
                            </span>
                          </div>
                          <span className="font-mono">${player.chipCount}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </UICard>
            </div>
          </TabsContent>
          
          <TabsContent value="blinds" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {tournament.blindStructure.map((blind, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      index === tournament.currentBlindLevel && "bg-primary/20 border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === tournament.currentBlindLevel ? "default" : "outline"}>
                          Level {blind.level}
                        </Badge>
                        <span className="text-sm">
                          {blind.smallBlind}/{blind.bigBlind}
                          {blind.ante && ` (${blind.ante})`}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{blind.duration}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="payouts" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Prize Pool</span>
                <span className="font-bold text-lg">${tournament.prizePool}</span>
              </div>
              <Separator />
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {tournament.payoutStructure.map((payout, index) => {
                    const amount = Math.round(tournament.prizePool * (payout.percentage / 100));
                    const inTheMoney = myPosition > 0 && myPosition <= payout.position;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          inTheMoney && "bg-green-500/10 border border-green-500/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                          {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                          <span className="font-medium">#{payout.position}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${amount}</div>
                          <div className="text-xs text-muted-foreground">{payout.percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// Elimination Dialog Component
function EliminationDialog({ 
  isOpen, 
  position, 
  winnings, 
  totalPlayers,
  onSpectate,
  onBackToLobby 
}: {
  isOpen: boolean;
  position: number;
  winnings: number;
  totalPlayers: number;
  onSpectate: () => void;
  onBackToLobby: () => void;
}) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {winnings > 0 ? '🏆 Congratulations!' : 'Tournament Over'}
          </DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <div className="text-3xl font-bold text-primary">
              Finished #{position} of {totalPlayers}
            </div>
            {winnings > 0 && (
              <div className="text-xl">
                You won <span className="font-bold text-green-500">${winnings}</span>!
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button variant="outline" onClick={onSpectate} data-testid="button-spectate">
            <Users className="mr-2 h-4 w-4" />
            Spectate
          </Button>
          <Button onClick={onBackToLobby} data-testid="button-back-to-lobby">
            Back to Lobby
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Tournament Game Component
export default function TournamentGame() {
  const { tournamentId, tableNumber } = useParams();
  const [, navigate] = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<TournamentPlayer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [showEliminationDialog, setShowEliminationDialog] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [blindTimer, setBlindTimer] = useState<number>(0);
  const [phaseKey, setPhaseKey] = useState(0);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [winningPlayerIds, setWinningPlayerIds] = useState<string[]>([]);
  const [winAmounts, setWinAmounts] = useState<Record<string, number>>({});
  const [winningCardIds, setWinningCardIds] = useState<Set<string>>(new Set());
  const [flyingChips, setFlyingChips] = useState<any[]>([]);
  const [activeChipAnimations, setActiveChipAnimations] = useState<any[]>([]);
  const [isHandStrengthCollapsed, setIsHandStrengthCollapsed] = useState(false);
  
  const gameEngineRef = useRef<GameEngine | null>(null);
  const tournamentManagerRef = useRef<TournamentManager | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const playerPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const potPosition = useRef<{ x: number; y: number }>({ x: 400, y: 150 });
  const { toast } = useToast();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();
  const { isLandscape } = useOrientation();
  const { isOnline, isReconnecting } = useOnlineStatus();

  // Initialize tournament manager and load tournament
  useEffect(() => {
    if (!tournamentId) return;
    
    // Initialize tournament manager if not already done
    if (!tournamentManagerRef.current) {
      tournamentManagerRef.current = new TournamentManager();
    }
    
    // Get tournament state
    const tournamentState = tournamentManagerRef.current.getTournament(tournamentId);
    if (tournamentState) {
      setTournament(tournamentState);
      
      // Find current player (for now use player ID 0 for human player)
      const humanPlayer = Array.from(tournamentState.players.values()).find(p => p.name === 'You');
      if (humanPlayer) {
        setCurrentPlayer(humanPlayer);
        setIsEliminated(humanPlayer.status === 'eliminated');
      }
      
      // Get table state
      const table = tournamentState.tables.get(`table-${tableNumber}`);
      if (table) {
        setGameState(table.gameState);
        gameEngineRef.current = table.gameEngine;
      }
    } else {
      // Tournament not found, navigate back to lobby
      toast({
        title: "Tournament not found",
        description: "The tournament you're looking for doesn't exist.",
        variant: "destructive",
      });
      navigate('/tournament-lobby');
    }
  }, [tournamentId, tableNumber, navigate, toast]);

  // Subscribe to tournament events
  useEffect(() => {
    if (!tournamentManagerRef.current || !tournamentId) return;
    
    const handleTournamentEvent: TournamentEventCallback = (event) => {
      switch (event.type) {
        case 'blind-level-changed':
          const { newLevel } = event.data;
          toast({
            title: "Blinds Increased",
            description: `Level ${newLevel.level}: ${newLevel.smallBlind}/${newLevel.bigBlind}${newLevel.ante ? ` (${newLevel.ante})` : ''}`,
          });
          playSound('notification');
          triggerHaptic('medium');
          // Update game state with new blinds
          if (gameEngineRef.current && gameState) {
            const updatedState = gameEngineRef.current.postBlinds(gameState, newLevel.smallBlind, newLevel.bigBlind);
            setGameState(updatedState);
          }
          break;
          
        case 'player-eliminated':
          const { playerId, position, winnings } = event.data;
          if (currentPlayer && playerId === currentPlayer.id) {
            setIsEliminated(true);
            setCurrentPlayer({ ...currentPlayer, status: 'eliminated', position, winnings });
            setShowEliminationDialog(true);
            playSound('elimination');
            triggerHaptic('heavy');
          } else {
            toast({
              title: "Player Eliminated",
              description: `${event.data.playerName} finished in ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} place`,
            });
          }
          break;
          
        case 'tournament-completed':
          toast({
            title: "Tournament Complete!",
            description: "The tournament has ended.",
          });
          break;
          
        case 'timer-update':
          setBlindTimer(event.data.remainingTime);
          break;
      }
    };
    
    // Subscribe to events
    tournamentManagerRef.current.on(tournamentId, handleTournamentEvent);
    
    return () => {
      if (tournamentManagerRef.current) {
        tournamentManagerRef.current.off(tournamentId, handleTournamentEvent);
      }
    };
  }, [tournamentId, currentPlayer, gameState, toast, playSound, triggerHaptic]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setBlindTimer(prev => Math.max(0, prev - 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Game action handlers
  const handleAction = (action: PlayerAction, amount?: number) => {
    if (!gameState || !gameEngineRef.current || isProcessing || isEliminated) return;
    
    setIsProcessing(true);
    
    try {
      let newState = gameState;
      const currentPlayerIndex = newState.currentPlayerIndex;
      
      switch (action) {
        case 'fold':
          newState = gameEngineRef.current.playerFold(newState, currentPlayerIndex);
          break;
        case 'check':
          newState = gameEngineRef.current.playerCheck(newState, currentPlayerIndex);
          break;
        case 'call':
          newState = gameEngineRef.current.playerCall(newState, currentPlayerIndex);
          break;
        case 'bet':
          if (amount) {
            newState = gameEngineRef.current.playerBet(newState, currentPlayerIndex, amount);
          }
          break;
        case 'raise':
          if (amount) {
            newState = gameEngineRef.current.playerRaise(newState, currentPlayerIndex, amount);
          }
          break;
      }
      
      setGameState(newState);
      playSound(action);
      triggerHaptic('light');
      
      // Process bot actions if needed
      setTimeout(() => processBotTurns(newState), 500);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processBotTurns = (state: GameState) => {
    if (!gameEngineRef.current) return;
    
    let currentState = state;
    
    while (currentState.phase !== 'showdown' && currentState.phase !== 'waiting') {
      const currentPlayer = currentState.players[currentState.currentPlayerIndex];
      
      if (!currentPlayer.isHuman && !currentPlayer.folded) {
        const botAction = botAI.decideAction(currentState, currentPlayer.id);
        
        switch (botAction.action) {
          case 'fold':
            currentState = gameEngineRef.current.playerFold(currentState, currentState.currentPlayerIndex);
            break;
          case 'check':
            currentState = gameEngineRef.current.playerCheck(currentState, currentState.currentPlayerIndex);
            break;
          case 'call':
            currentState = gameEngineRef.current.playerCall(currentState, currentState.currentPlayerIndex);
            break;
          case 'bet':
          case 'raise':
            if (botAction.amount) {
              currentState = gameEngineRef.current.playerBet(currentState, currentState.currentPlayerIndex, botAction.amount);
            }
            break;
        }
      } else {
        break;
      }
    }
    
    setGameState(currentState);
  };
  
  const handleSpectate = () => {
    setIsSpectating(true);
    setShowEliminationDialog(false);
  };
  
  const handleBackToLobby = () => {
    navigate('/tournament-lobby');
  };

  if (!tournament || !gameState) {
    return <FullPageLoader />;
  }

  const humanPlayer = gameState.players.find(p => p.isHuman);
  const isMyTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.isHuman) && !isEliminated && !isSpectating;
  const tournamentPhase = getTournamentPhase(tournament);
  const currentBlind = tournament.blindStructure[tournament.currentBlindLevel] || tournament.blindStructure[0];
  const remainingPlayers = Array.from(tournament.players.values()).filter(p => p.status === 'playing');
  const averageStack = remainingPlayers.reduce((acc, p) => acc + p.chipCount, 0) / remainingPlayers.length;
  const myRank = currentPlayer ? remainingPlayers.sort((a, b) => b.chipCount - a.chipCount).findIndex(p => p.id === currentPlayer.id) + 1 : 0;
  const nextPrizePosition = tournament.payoutStructure.findIndex(p => p.position >= myRank);
  const inTheMoney = myRank > 0 && myRank <= tournament.payoutStructure.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Tournament Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{tournament.name}</h1>
              <Badge variant={tournamentPhase === 'final' ? 'default' : tournamentPhase === 'bubble' ? 'destructive' : 'outline'}>
                {tournamentPhase === 'final' && <Crown className="mr-1 h-3 w-3" />}
                {tournamentPhase === 'bubble' && <AlertCircle className="mr-1 h-3 w-3" />}
                {tournamentPhase.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Blind Level Timer */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">
                    Level {currentBlind.level}: {currentBlind.smallBlind}/{currentBlind.bigBlind}
                    {currentBlind.ante && ` (${currentBlind.ante})`}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatTimer(blindTimer)}</div>
                </div>
              </div>
              
              {/* Player Count */}
              <div className="text-sm">
                <span className="font-medium">{remainingPlayers.length}</span> of{' '}
                <span className="text-muted-foreground">{tournament.maxPlayers} players</span>
              </div>
              
              {/* Average Stack */}
              <div className="text-sm">
                Avg: <span className="font-mono font-medium">${Math.round(averageStack)}</span>
              </div>
              
              {/* My Position */}
              {!isEliminated && myRank > 0 && (
                <Badge variant={inTheMoney ? 'default' : 'secondary'}>
                  <Trophy className="mr-1 h-3 w-3" />
                  #{myRank}
                </Badge>
              )}
              
              {/* Info Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfoPanel(true)}
                data-testid="button-tournament-info"
              >
                <Info className="h-4 w-4" />
              </Button>
              
              <ThemeToggle />
            </div>
          </div>
          
          {/* Prize Bubble Indicator */}
          {tournamentPhase === 'bubble' && !inTheMoney && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span>Bubble Play - {tournament.payoutStructure.length + 1 - remainingPlayers.length} eliminations until the money!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="pt-20 h-screen flex">
        <div className="flex-1 relative">
          {/* Poker Table */}
          <div ref={tableRef} className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-4xl mx-auto px-8">
              <div 
                className="relative aspect-[3/2] rounded-[200px] bg-gradient-radial from-poker-felt to-poker-felt-dark border-[10px] border-poker-table shadow-2xl overflow-hidden"
                data-testid="poker-table"
              >
                {/* Community Cards */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2">
                  <CommunityCards cards={gameState.communityCards} winningCardIds={winningCardIds} />
                </div>

                {/* Pot Display */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2">
                  <PotDisplay pots={gameState.pots} />
                </div>

                {/* Player Seats */}
                {gameState.players.map((player, index) => {
                  const angle = (index / gameState.players.length) * 2 * Math.PI - Math.PI / 2;
                  const radiusX = 320;
                  const radiusY = 180;
                  const x = Math.cos(angle) * radiusX;
                  const y = Math.sin(angle) * radiusY;
                  
                  return (
                    <div
                      key={player.id}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <PlayerSeat
                        player={player}
                        isCurrentTurn={gameState.currentPlayerIndex === index}
                        isDealer={gameState.dealerIndex === index}
                        showCards={player.isHuman || gameState.phase === 'showdown'}
                        isWinner={winningPlayerIds.includes(player.id)}
                        winAmount={winAmounts[player.id]}
                        winningCardIds={winningCardIds}
                      />
                    </div>
                  );
                })}

                {/* Chip Animations */}
                <AnimatePresence>
                  {flyingChips.map((chip) => (
                    <FlyingChip
                      key={chip.id}
                      startX={chip.startX}
                      startY={chip.startY}
                      endX={chip.endX}
                      endY={chip.endY}
                      delay={chip.delay}
                    />
                  ))}
                </AnimatePresence>
                
                {/* Active Chip Physics Animations */}
                {activeChipAnimations.map((animation) => (
                  <ChipPhysics
                    key={animation.id}
                    animation={animation}
                    tableRef={tableRef}
                    onComplete={() => {
                      setActiveChipAnimations(prev => prev.filter(a => a.id !== animation.id));
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          {!isEliminated && !isSpectating && humanPlayer && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t">
              <ActionControls
                gameState={gameState}
                player={humanPlayer}
                onAction={handleAction}
                disabled={!isMyTurn || isProcessing}
              />
            </div>
          )}
          
          {/* Elimination/Spectator Banner */}
          {(isEliminated || isSpectating) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isEliminated ? (
                    <>
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        Eliminated - #{currentPlayer?.position}
                      </Badge>
                      {currentPlayer && currentPlayer.winnings > 0 && (
                        <Badge variant="default" className="text-lg px-4 py-2">
                          Won ${currentPlayer.winnings}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      Spectating
                    </Badge>
                  )}
                </div>
                <Button onClick={handleBackToLobby} data-testid="button-back-to-lobby">
                  Back to Tournament Lobby
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Hand Strength (Desktop) */}
        {humanPlayer && !isEliminated && isLandscape && (
          <div className="w-80 border-l bg-card p-4">
            <Collapsible
              open={!isHandStrengthCollapsed}
              onOpenChange={setIsHandStrengthCollapsed}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full mb-4">
                <h3 className="font-semibold">Hand Analysis</h3>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  !isHandStrengthCollapsed && "transform rotate-90"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4">
                  <HandStrengthIndicator 
                    hand={humanPlayer.hand}
                    communityCards={gameState.communityCards}
                    phase={gameState.phase}
                  />
                  <PotOddsDisplay
                    pot={gameState.pots[0]?.amount || 0}
                    toCall={Math.max(0, gameState.currentBet - humanPlayer.bet)}
                    playerChips={humanPlayer.chips}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet for Hand Analysis */}
      {humanPlayer && !isEliminated && !isLandscape && (
        <MobileBottomSheet>
          <div className="p-4 space-y-4">
            <HandStrengthPanel
              hand={humanPlayer.hand}
              communityCards={gameState.communityCards}
              phase={gameState.phase}
              pot={gameState.pots[0]?.amount || 0}
              toCall={Math.max(0, gameState.currentBet - humanPlayer.bet)}
              playerChips={humanPlayer.chips}
            />
          </div>
        </MobileBottomSheet>
      )}

      {/* Tournament Info Panel */}
      <TournamentInfoPanel
        tournament={tournament}
        currentPlayer={currentPlayer || undefined}
        isOpen={showInfoPanel}
        onToggle={() => setShowInfoPanel(!showInfoPanel)}
      />

      {/* Elimination Dialog */}
      {currentPlayer && (
        <EliminationDialog
          isOpen={showEliminationDialog}
          position={currentPlayer.position || remainingPlayers.length + 1}
          winnings={currentPlayer.winnings}
          totalPlayers={tournament.maxPlayers}
          onSpectate={handleSpectate}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {/* Winner Celebration */}
      <AnimatePresence>
        {winningPlayerIds.length > 0 && gameState.phase === 'showdown' && (
          <WinnerCelebration
            winners={winningPlayerIds.map(id => {
              const player = gameState.players.find(p => p.id === id);
              return {
                name: player?.name || 'Unknown',
                amount: winAmounts[id] || 0,
                handDescription: '' // Would need hand evaluation here
              };
            })}
          />
        )}
      </AnimatePresence>

      {/* Final Table Special Effects */}
      {tournamentPhase === 'final' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-full"
          >
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-yellow-500">FINAL TABLE</span>
            <Crown className="h-5 w-5 text-yellow-500" />
          </motion.div>
        </div>
      )}
    </div>
  );
}