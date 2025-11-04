import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { 
  TournamentManager, 
  TournamentConfig, 
  TournamentState, 
  TournamentPlayer,
  TournamentEventType,
  TournamentEvent,
  subscribeToTournamentEvents,
  getTournamentStatus,
  getActiveTournaments,
  tournamentManager
} from '@/lib/tournamentManager';
import {
  Trophy,
  Users,
  Clock,
  Coins,
  ChevronLeft,
  Plus,
  Zap,
  Timer,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Star,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  Loader2
} from 'lucide-react';

// Tournament types
type TournamentFilter = 'all' | 'sit-n-go' | 'multi-table' | 'scheduled' | 'turbo';
type TournamentStatus = 'registering' | 'running' | 'completed';
type TournamentViewMode = 'grid' | 'list';

// Mock data for demo tournaments
const DEMO_TOURNAMENTS: TournamentState[] = [
  {
    id: 'demo-1',
    name: 'Daily Freeroll',
    type: 'multi_table',  // Fixed: use 'multi_table' instead of 'multi-table'
    status: 'registering',
    buyIn: 0,
    startingChips: 1500,
    maxPlayers: 100,
    currentPlayers: 67,
    prizePool: 5000,
    blindStructure: [],
    payoutStructure: [],
    currentBlindLevel: 0,
    players: new Map(),
    tables: new Map(),
    startTime: Date.now() + 3600000, // 1 hour from now
  },
  {
    id: 'demo-2',
    name: 'Turbo Sit & Go #42',
    type: 'sit_and_go',  // Fixed: use 'sit_and_go' instead of 'sit-n-go'
    status: 'registering',
    buyIn: 100,
    startingChips: 1000,
    maxPlayers: 6,
    currentPlayers: 4,
    prizePool: 600,
    blindStructure: [],
    payoutStructure: [],
    currentBlindLevel: 0,
    players: new Map(),
    tables: new Map(),
  },
  {
    id: 'demo-3',
    name: 'Big Sunday Special',
    type: 'scheduled',
    status: 'running',
    buyIn: 500,
    startingChips: 5000,
    maxPlayers: 200,
    currentPlayers: 156,
    prizePool: 100000,
    blindStructure: [],
    payoutStructure: [],
    currentBlindLevel: 3,
    blindTimer: 420000, // 7 minutes
    players: new Map(),
    tables: new Map(),
    startTime: Date.now() - 1800000, // Started 30 minutes ago
  },
  {
    id: 'demo-4',
    name: 'Heads Up Championship',
    type: 'sit_and_go',  // Fixed: use 'sit_and_go' instead of 'sit-n-go'
    status: 'completed',
    buyIn: 1000,
    startingChips: 3000,
    maxPlayers: 2,
    currentPlayers: 2,
    prizePool: 2000,
    blindStructure: [],
    payoutStructure: [],
    currentBlindLevel: 8,
    players: new Map(),
    tables: new Map(),
    endTime: Date.now() - 600000, // Ended 10 minutes ago
  },
];

// Helper functions
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getStatusColor(status: TournamentStatus): string {
  switch (status) {
    case 'registering':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'running':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'completed':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getTypeIcon(type: string): JSX.Element {
  switch (type) {
    case 'sit-n-go':
      return <Users className="w-4 h-4" />;
    case 'multi-table':
      return <Trophy className="w-4 h-4" />;
    case 'scheduled':
      return <Calendar className="w-4 h-4" />;
    case 'turbo':
      return <Zap className="w-4 h-4" />;
    default:
      return <Trophy className="w-4 h-4" />;
  }
}

// Tournament card component
function TournamentCard({ 
  tournament, 
  onRegister, 
  onJoin,
  viewMode = 'grid' 
}: { 
  tournament: TournamentState;
  onRegister: (tournamentId: string) => void;
  onJoin: (tournamentId: string) => void;
  viewMode?: TournamentViewMode;
}) {
  const isRegistering = tournament.status === 'registering';
  const isRunning = tournament.status === 'running';
  const isCompleted = tournament.status === 'completed';
  const isFull = tournament.currentPlayers >= tournament.maxPlayers;
  const fillPercentage = (tournament.currentPlayers / tournament.maxPlayers) * 100;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate transition-all">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getTypeIcon(tournament.type)}
            <div>
              <h4 className="font-semibold">{tournament.name}</h4>
              <p className="text-sm text-muted-foreground">
                Buy-in: ${tournament.buyIn}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Players:</span>{' '}
            <span className="font-medium">
              {tournament.currentPlayers}/{tournament.maxPlayers}
            </span>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Prize:</span>{' '}
            <span className="font-medium text-primary">
              ${tournament.prizePool.toLocaleString()}
            </span>
          </div>
          
          <Badge className={getStatusColor(tournament.status as TournamentStatus)}>
            {tournament.status}
          </Badge>
          
          <div className="flex gap-2">
            {isRegistering && !isFull && (
              <Button 
                size="sm" 
                onClick={() => onRegister(tournament.id)}
                data-testid={`button-register-${tournament.id}`}
              >
                Register
              </Button>
            )}
            {isRunning && (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onJoin(tournament.id)}
                data-testid={`button-spectate-${tournament.id}`}
              >
                Spectate
              </Button>
            )}
            {isCompleted && (
              <Button 
                size="sm"
                variant="ghost"
                disabled
                data-testid={`button-completed-${tournament.id}`}
              >
                Finished
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card backdrop-blur-lg border border-border overflow-hidden hover-elevate transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(tournament.type)}
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
          </div>
          <Badge className={getStatusColor(tournament.status as TournamentStatus)}>
            {tournament.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buy-in:</span>
            <span className="font-medium">
              {tournament.buyIn === 0 ? 'Free' : `$${tournament.buyIn}`}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Starting Chips:</span>
            <span className="font-medium">{tournament.startingChips.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prize Pool:</span>
            <span className="font-medium text-primary">
              ${tournament.prizePool.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Players:</span>
            <span className="font-medium">
              {tournament.currentPlayers}/{tournament.maxPlayers}
            </span>
          </div>
          
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
        
        {tournament.startTime && tournament.status === 'registering' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Starts in {formatTime(tournament.startTime - Date.now())}</span>
          </div>
        )}
        
        {tournament.status === 'running' && tournament.blindTimer && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Timer className="w-4 h-4" />
            <span>Level {tournament.currentBlindLevel + 1} - {formatTime(tournament.blindTimer)}</span>
          </div>
        )}
        
        {tournament.endTime && tournament.status === 'completed' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ended {formatTime(Date.now() - tournament.endTime)} ago</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isRegistering && !isFull && (
          <Button 
            className="w-full"
            onClick={() => onRegister(tournament.id)}
            data-testid={`button-register-${tournament.id}`}
          >
            Register
          </Button>
        )}
        {isRegistering && isFull && (
          <Button 
            className="w-full" 
            disabled
            data-testid={`button-full-${tournament.id}`}
          >
            Tournament Full
          </Button>
        )}
        {isRunning && (
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => onJoin(tournament.id)}
            data-testid={`button-spectate-${tournament.id}`}
          >
            <Play className="w-4 h-4 mr-2" />
            Spectate
          </Button>
        )}
        {isCompleted && (
          <Button 
            className="w-full"
            variant="ghost"
            disabled
            data-testid={`button-completed-${tournament.id}`}
          >
            Tournament Finished
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Main tournament lobby component
export default function TournamentLobby() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<TournamentState[]>(DEMO_TOURNAMENTS);
  const [filter, setFilter] = useState<TournamentFilter>('all');
  const [viewMode, setViewMode] = useState<TournamentViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentState | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [playerName, setPlayerName] = useState('Demo Player');
  const [createBuyIn, setCreateBuyIn] = useState(500);
  const [createType, setCreateType] = useState<'sit-n-go' | 'turbo'>('sit-n-go');
  
  // Tournament manager instance
  const tournamentManagerRef = useRef<TournamentManager>(new TournamentManager());
  const tournamentManager = tournamentManagerRef.current;
  
  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTournaments();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Tournament event listener
  useEffect(() => {
    const handleTournamentEvent = (event: TournamentEvent) => {
      console.log('Tournament event:', event);
      
      switch (event.type) {
        case 'player-registered':
          toast({
            title: 'Player Registered',
            description: `${event.data.playerName} joined ${event.data.tournamentName}`,
          });
          refreshTournaments();
          break;
          
        case 'tournament-started':
          toast({
            title: 'Tournament Started',
            description: `${event.data.tournamentName} has begun!`,
          });
          refreshTournaments();
          break;
          
        case 'blind-level-changed':
          refreshTournaments();
          break;
          
        case 'player-eliminated':
          toast({
            title: 'Player Eliminated',
            description: `${event.data.playerName} finished in position ${event.data.position}`,
          });
          refreshTournaments();
          break;
          
        case 'tournament-completed':
          toast({
            title: 'Tournament Complete',
            description: `${event.data.tournamentName} has finished! Winner: ${event.data.winner}`,
          });
          refreshTournaments();
          break;
      }
    };
    
    // Subscribe to all tournament events
    const unsubscribers: (() => void)[] = [];
    tournaments.forEach(tournament => {
      const unsubscribe = subscribeToTournamentEvents(tournament.id, handleTournamentEvent);
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      // Call all unsubscribe functions
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [tournaments]);
  
  // Refresh tournaments
  const refreshTournaments = async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get all active tournaments from the manager using direct call
    const activeTournaments = tournamentManager.getActiveTournaments();
    
    // Merge with existing demo tournaments, avoiding duplicates
    setTournaments(prevTournaments => {
      const existingIds = new Set(prevTournaments.map(t => t.id));
      const newTournaments = activeTournaments.filter(t => !existingIds.has(t.id));
      
      // Update existing tournaments and add new ones
      const updatedTournaments = prevTournaments.map(t => {
        const activeTourn = activeTournaments.find(at => at.id === t.id);
        if (activeTourn) {
          return activeTourn;
        }
        // Update timer for running tournaments
        if (t.status === 'running' && t.blindTimer) {
          return {
            ...t,
            blindTimer: Math.max(0, t.blindTimer - 5000)
          };
        }
        return t;
      });
      
      return [...updatedTournaments, ...newTournaments];
    });
    
    setIsRefreshing(false);
  };
  
  // Filter tournaments
  const filteredTournaments = useMemo(() => {
    let filtered = [...tournaments];
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(t => {
        if (filter === 'turbo') {
          return t.name.toLowerCase().includes('turbo');
        }
        // Fix: handle both 'sit-n-go' filter and 'sit_and_go' tournament type
        if (filter === 'sit-n-go') {
          return t.type === 'sit_and_go';
        }
        // Fix: handle both 'multi-table' filter and 'multi_table' tournament type  
        if (filter === 'multi-table') {
          return t.type === 'multi_table';
        }
        return t.type === filter;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by status (registering first, then running, then completed)
    filtered.sort((a, b) => {
      const statusOrder = { registering: 0, running: 1, completed: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    return filtered;
  }, [tournaments, filter, searchTerm]);
  
  // Handle registration
  const handleRegister = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
      setShowRegistrationDialog(true);
    }
  };
  
  // Confirm registration
  const confirmRegistration = () => {
    if (selectedTournament) {
      // Fix: registerPlayer expects (tournamentId, playerName, playerId?)
      const success = tournamentManager.registerPlayer(
        selectedTournament.id, 
        playerName,
        `player-${Date.now()}`
      );
      
      if (success) {
        toast({
          title: 'Registration Successful',
          description: `You're registered for ${selectedTournament.name}!`,
        });
        
        setShowRegistrationDialog(false);
        setSelectedTournament(null);
        refreshTournaments();
      } else {
        toast({
          title: 'Registration Failed',
          description: 'Unable to register for this tournament.',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Handle join/spectate
  const handleJoin = (tournamentId: string) => {
    // Navigate to tournament table with tournamentId
    setLocation(`/poker-game?tournamentId=${tournamentId}`);
  };
  
  // Create quick tournament
  const createQuickTournament = async () => {
    console.log('Creating tournament...', { createType, createBuyIn });
    
    const config: TournamentConfig = {
      name: createType === 'turbo' ? `Turbo Tournament #${Date.now()}` : `Sit & Go #${Date.now()}`,
      type: 'sit_and_go',  // Fixed: use 'sit_and_go' instead of 'sit-n-go'
      buyIn: createBuyIn,
      startingChips: createBuyIn * 10,
      maxPlayers: 6,
      blindStructureType: createType === 'turbo' ? 'turbo' : 'normal',
    };
    
    console.log('Tournament config:', config);
    
    try {
      const tournamentId = tournamentManager.createTournament(config);
      console.log('Tournament created with ID:', tournamentId);
      
      // Use direct manager calls instead of exported helper functions
      const allTournaments = tournamentManager.getActiveTournaments();
      console.log('All active tournaments after creation:', allTournaments);
      console.log('Number of active tournaments:', allTournaments.length);
      
      const newTournament = tournamentManager.getTournamentStatus(tournamentId);
      console.log('Tournament status:', newTournament);
      
      if (newTournament) {
        setTournaments(prev => [...prev, newTournament]);
        
        toast({
          title: 'Tournament Created',
          description: `${config.name} is ready for registration!`,
        });
      } else {
        console.error('Failed to get tournament status after creation');
        // Try to use refreshTournaments as fallback
        console.log('Attempting to refresh tournaments as fallback...');
        await refreshTournaments();
        
        // Check if it appears after refresh
        const afterRefresh = tournamentManager.getActiveTournaments();
        console.log('Active tournaments after refresh:', afterRefresh);
        
        if (afterRefresh.some(t => t.id === tournamentId)) {
          toast({
            title: 'Tournament Created',
            description: `${config.name} is ready for registration!`,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create tournament. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      });
    }
    
    setShowCreateDialog(false);
    refreshTournaments();
  };
  
  // Show info for tournament
  const showTournamentInfo = (tournament: TournamentState) => {
    setSelectedTournament(tournament);
    setShowInfoDialog(true);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/lobby')}
                data-testid="button-back-lobby"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Tournament Lobby</h1>
                <p className="text-sm text-muted-foreground">
                  {tournaments.length} tournaments available
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshTournaments}
                disabled={isRefreshing}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      {/* Controls Bar */}
      <div className="sticky top-[73px] z-40 border-b bg-background/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search and Filters */}
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              <Select value={filter} onValueChange={(value) => setFilter(value as TournamentFilter)}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sit-n-go">Sit & Go</SelectItem>
                  <SelectItem value="multi-table">Multi-Table</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="turbo">Turbo</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden lg:flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  data-testid="button-view-grid"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  data-testid="button-view-list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Button>
              </div>
            </div>
            
            {/* Quick Create Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateType('sit-n-go');
                  setShowCreateDialog(true);
                }}
                data-testid="button-create-sitgo"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Sit & Go
              </Button>
              <Button
                variant="outline"
                className="text-yellow-400 border-yellow-400/30"
                onClick={() => {
                  setCreateType('turbo');
                  setShowCreateDialog(true);
                }}
                data-testid="button-create-turbo"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Turbo
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingState />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tournaments Found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchTerm ? 
                `No tournaments match "${searchTerm}". Try a different search.` :
                'There are no tournaments available at the moment. Create one to get started!'
              }
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-create-first"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              <div className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" :
                "flex flex-col gap-2"
              }>
                {filteredTournaments
                  .filter(t => t.status === 'registering' || t.status === 'running')
                  .map(tournament => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onRegister={handleRegister}
                      onJoin={handleJoin}
                      viewMode={viewMode}
                    />
                  ))
                }
              </div>
            </TabsContent>
            
            <TabsContent value="upcoming" className="space-y-4">
              <div className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" :
                "flex flex-col gap-2"
              }>
                {filteredTournaments
                  .filter(t => t.status === 'registering' && t.startTime && t.startTime > Date.now())
                  .map(tournament => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onRegister={handleRegister}
                      onJoin={handleJoin}
                      viewMode={viewMode}
                    />
                  ))
                }
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" :
                "flex flex-col gap-2"
              }>
                {filteredTournaments
                  .filter(t => t.status === 'completed')
                  .map(tournament => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onRegister={handleRegister}
                      onJoin={handleJoin}
                      viewMode={viewMode}
                    />
                  ))
                }
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Tournament</DialogTitle>
            <DialogDescription>
              Confirm your registration for {selectedTournament?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTournament && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  data-testid="input-player-name"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buy-in:</span>
                  <span className="font-medium">
                    {selectedTournament.buyIn === 0 ? 'Free' : `$${selectedTournament.buyIn}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Chips:</span>
                  <span className="font-medium">{selectedTournament.startingChips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Players:</span>
                  <span className="font-medium">
                    {selectedTournament.currentPlayers}/{selectedTournament.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="font-medium text-primary">
                    ${selectedTournament.prizePool.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {selectedTournament.buyIn > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This tournament requires a ${selectedTournament.buyIn} buy-in.
                    Entry fee will be deducted from your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegistrationDialog(false)}
              data-testid="button-cancel-registration"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRegistration}
              disabled={!playerName.trim()}
              data-testid="button-confirm-registration"
            >
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Tournament Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create {createType === 'turbo' ? 'Turbo' : 'Sit & Go'} Tournament
            </DialogTitle>
            <DialogDescription>
              Set up a quick tournament with your preferred buy-in
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-in">Buy-in Amount</Label>
              <div className="flex gap-2">
                <Button
                  variant={createBuyIn === 100 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateBuyIn(100)}
                  data-testid="button-buyin-100"
                >
                  $100
                </Button>
                <Button
                  variant={createBuyIn === 500 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateBuyIn(500)}
                  data-testid="button-buyin-500"
                >
                  $500
                </Button>
                <Button
                  variant={createBuyIn === 1000 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateBuyIn(1000)}
                  data-testid="button-buyin-1000"
                >
                  $1,000
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {createType === 'turbo' ? 'Turbo (3 min blinds)' : 'Normal (10 min blinds)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Players:</span>
                <span className="font-medium">6 max</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starting Chips:</span>
                <span className="font-medium">{(createBuyIn * 10).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prize Pool:</span>
                <span className="font-medium text-primary">${(createBuyIn * 6).toLocaleString()}</span>
              </div>
            </div>
            
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                Tournament will start automatically when 6 players register.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={createQuickTournament}
              data-testid="button-confirm-create"
            >
              Create Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tournament Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTournament?.name} - Tournament Info</DialogTitle>
          </DialogHeader>
          
          {selectedTournament && (
            <div className="space-y-4">
              <Tabs defaultValue="blind" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="blind">Blind Structure</TabsTrigger>
                  <TabsTrigger value="payout">Payout Structure</TabsTrigger>
                  <TabsTrigger value="players">Players</TabsTrigger>
                </TabsList>
                
                <TabsContent value="blind" className="space-y-2">
                  <h4 className="font-medium mb-2">Blind Levels</h4>
                  <div className="rounded-lg border">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Level</th>
                          <th className="px-4 py-2 text-left">Duration</th>
                          <th className="px-4 py-2 text-left">Small</th>
                          <th className="px-4 py-2 text-left">Big</th>
                          <th className="px-4 py-2 text-left">Ante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map(level => (
                          <tr key={level} className="border-b last:border-b-0">
                            <td className="px-4 py-2">{level}</td>
                            <td className="px-4 py-2">10 min</td>
                            <td className="px-4 py-2">${level * 10}</td>
                            <td className="px-4 py-2">${level * 20}</td>
                            <td className="px-4 py-2">{level > 3 ? `$${level * 5}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="payout" className="space-y-2">
                  <h4 className="font-medium mb-2">Prize Distribution</h4>
                  <div className="rounded-lg border">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Position</th>
                          <th className="px-4 py-2 text-left">Percentage</th>
                          <th className="px-4 py-2 text-left">Prize</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            1st
                          </td>
                          <td className="px-4 py-2">50%</td>
                          <td className="px-4 py-2 font-medium text-primary">
                            ${(selectedTournament.prizePool * 0.5).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-gray-400" />
                            2nd
                          </td>
                          <td className="px-4 py-2">30%</td>
                          <td className="px-4 py-2 font-medium">
                            ${(selectedTournament.prizePool * 0.3).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-orange-700" />
                            3rd
                          </td>
                          <td className="px-4 py-2">20%</td>
                          <td className="px-4 py-2 font-medium">
                            ${(selectedTournament.prizePool * 0.2).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="players" className="space-y-2">
                  <h4 className="font-medium mb-2">
                    Registered Players ({selectedTournament.currentPlayers}/{selectedTournament.maxPlayers})
                  </h4>
                  <ScrollArea className="h-[300px] rounded-lg border p-4">
                    <div className="space-y-2">
                      {Array.from({ length: selectedTournament.currentPlayers }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium">{i + 1}</span>
                            </div>
                            <span className="font-medium">Player {i + 1}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedTournament.status === 'running' ? 
                              `${Math.floor(Math.random() * 10000 + 1000)} chips` :
                              'Registered'
                            }
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInfoDialog(false)}
              data-testid="button-close-info"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}