import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Plus, 
  Spade, 
  Heart, 
  Diamond, 
  Club, 
  LogOut, 
  RefreshCw,
  Search,
  Filter,
  Coins,
  Clock,
  UserPlus,
  Loader2
} from 'lucide-react';
import type { PokerTable } from '@shared/schema';

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Skeleton card component for loading state
function TableCardSkeleton() {
  return (
    <Card className="bg-card backdrop-blur-lg border border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-6 w-32 bg-muted/20" />
          <Skeleton className="h-5 w-20 rounded-full bg-muted/20" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded bg-muted/20" />
            <Skeleton className="h-4 w-24 bg-muted/20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded bg-muted/20" />
            <Skeleton className="h-4 w-20 bg-muted/20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded bg-muted/20" />
            <Skeleton className="h-4 w-28 bg-muted/20" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Skeleton className="h-10 w-full bg-muted/20" />
      </CardFooter>
    </Card>
  );
}

export default function Lobby() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [joinBuyIn, setJoinBuyIn] = useState(500);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'in_progress'>('all');
  const [filterBlinds, setFilterBlinds] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterAvailable, setFilterAvailable] = useState(false);
  
  // Form state for Create Table modal
  const [tableName, setTableName] = useState('High Stakes');
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [minBuyIn, setMinBuyIn] = useState(200);
  const [maxBuyIn, setMaxBuyIn] = useState(1000);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Update last updated timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastUpdated(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch active tables
  const { data: tablesData, isLoading, refetch } = useQuery<{ tables: any[] }>({
    queryKey: ['/api/tables'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update refresh state when data changes
  useEffect(() => {
    if (tablesData) {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }, [tablesData]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter tables based on search and filters
  const filteredTables = useMemo(() => {
    let tables = tablesData?.tables || [];
    
    // Search filter
    if (searchTerm) {
      tables = tables.filter((table: PokerTable) => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      tables = tables.filter((table: PokerTable) => {
        const status = table.currentPlayers === 0 ? 'waiting' : 'in_progress';
        return status === filterStatus;
      });
    }
    
    // Blinds filter
    if (filterBlinds !== 'all') {
      tables = tables.filter((table: PokerTable) => {
        const bigBlind = table.bigBlind;
        if (filterBlinds === 'low') return bigBlind <= 20;
        if (filterBlinds === 'medium') return bigBlind > 20 && bigBlind <= 50;
        if (filterBlinds === 'high') return bigBlind > 50;
        return true;
      });
    }
    
    // Available seats filter
    if (filterAvailable) {
      tables = tables.filter((table: PokerTable) => 
        table.currentPlayers < table.maxPlayers
      );
    }
    
    return tables;
  }, [tablesData?.tables, searchTerm, filterStatus, filterBlinds, filterAvailable]);

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      smallBlind: number;
      bigBlind: number;
      minBuyIn: number;
      maxBuyIn: number;
      maxPlayers: number;
    }) => {
      const res = await apiRequest('POST', '/api/tables', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Table created',
        description: 'Your table has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create table. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Join table mutation
  const joinTableMutation = useMutation({
    mutationFn: async ({ tableId, buyIn }: { tableId: number; buyIn: number }) => {
      const res = await apiRequest('POST', `/api/tables/${tableId}/join`, {
        buyInAmount: buyIn,
        seatNumber: Math.floor(Math.random() * 6), // Random seat for now
        playerName: 'Player',
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Joined table',
        description: 'You have successfully joined the table.',
      });
      // Navigate to the game with the table ID
      setLocation(`/game?tableId=${variables.tableId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join table. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Validation function for the form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    }
    
    if (bigBlind < smallBlind) {
      newErrors.bigBlind = 'Big blind must be greater than or equal to small blind';
    }
    
    if (minBuyIn > maxBuyIn) {
      newErrors.minBuyIn = 'Minimum buy-in must be less than or equal to maximum buy-in';
    }
    
    if (minBuyIn < bigBlind * 10) {
      newErrors.minBuyIn = `Minimum buy-in should be at least ${bigBlind * 10} (10x big blind)`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleCreateTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    createTableMutation.mutate({
      name: tableName,
      smallBlind: smallBlind,
      bigBlind: bigBlind,
      minBuyIn: minBuyIn,
      maxBuyIn: maxBuyIn,
      maxPlayers: 6,
    });
  };
  
  const resetForm = () => {
    setTableName('High Stakes');
    setSmallBlind(10);
    setBigBlind(20);
    setMinBuyIn(200);
    setMaxBuyIn(1000);
    setErrors({});
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetForm();
    } else {
      // Set focus to first input when dialog opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Add keyboard event handling for better accessibility
  useEffect(() => {
    if (isCreateDialogOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDialogOpenChange(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCreateDialogOpen]);
  
  // Real-time validation for related fields
  useEffect(() => {
    // Skip validation on initial render or when dialog is closed
    if (!isCreateDialogOpen) return;
    
    const newErrors: Record<string, string> = {};
    
    // Validate small blind vs big blind
    if (bigBlind < smallBlind) {
      newErrors.smallBlind = 'Small blind must be less than or equal to big blind';
    }
    
    // Validate min vs max buy-in
    if (minBuyIn > maxBuyIn) {
      newErrors.maxBuyIn = 'Maximum buy-in must be greater than or equal to minimum buy-in';
    }
    
    // Validate min buy-in vs big blind
    if (minBuyIn < bigBlind * 10) {
      newErrors.minBuyIn = `Minimum buy-in should be at least ${bigBlind * 10} (10x big blind)`;
    }
    
    // Update errors, preserving unrelated errors and clearing fixed ones
    setErrors(prev => {
      const updated = { ...prev };
      
      // Clear errors for fields that are now valid
      if (bigBlind >= smallBlind) {
        delete updated.smallBlind;
        delete updated.bigBlind;
      }
      if (minBuyIn <= maxBuyIn) {
        delete updated.maxBuyIn;
      }
      if (minBuyIn >= bigBlind * 10) {
        // Only clear minBuyIn error if it was specifically about the 10x rule
        if (prev.minBuyIn?.includes('10x big blind')) {
          delete updated.minBuyIn;
        }
      }
      
      // Add new errors
      return { ...updated, ...newErrors };
    });
  }, [smallBlind, bigBlind, minBuyIn, maxBuyIn, isCreateDialogOpen]);

  const handleJoinTable = (tableId: number, minBuyIn: number, maxBuyIn: number) => {
    setSelectedTable(tableId);
    setJoinBuyIn(Math.min(maxBuyIn, Math.max(minBuyIn, 500)));
  };

  const confirmJoinTable = () => {
    if (selectedTable) {
      joinTableMutation.mutate({ tableId: selectedTable, buyIn: joinBuyIn });
    }
  };

  // Get table status with color
  const getTableStatus = (table: PokerTable) => {
    if (table.currentPlayers === 0) {
      return { text: 'Waiting', variant: 'secondary' as const, color: 'text-yellow-500' };
    }
    if (table.currentPlayers >= table.maxPlayers) {
      return { text: 'Full', variant: 'destructive' as const, color: 'text-red-500' };
    }
    return { text: 'In Progress', variant: 'default' as const, color: 'text-green-500' };
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* Subtle pattern background overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="mx-auto max-w-7xl relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2 opacity-60">
              <Spade className="h-6 w-6 fill-current text-foreground" />
              <Heart className="h-6 w-6 fill-current text-red-500" />
              <Diamond className="h-6 w-6 fill-current text-red-500" />
              <Club className="h-6 w-6 fill-current text-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Texas Hold'em Lobby</h1>
          <p className="text-muted-foreground">Choose a table to join or create your own</p>
        </div>

        {/* Quick Play Button - For Demo */}
        <div className="mb-6 flex justify-center">
          <Link href="/demo">
            <Button
              size="lg"
              className="font-semibold px-6 py-5 text-base shadow-sm"
              data-testid="button-quick-play"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Quick Play (Demo)
            </Button>
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar and Refresh Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tables"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span data-testid="text-last-updated">Updated {getRelativeTime(lastUpdated)}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="ml-2"
                data-testid="button-refresh"
                aria-label="Refresh tables"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-1">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                data-testid="filter-status-all"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'waiting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('waiting')}
                data-testid="filter-status-waiting"
              >
                Waiting
              </Button>
              <Button
                variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('in_progress')}
                data-testid="filter-status-progress"
              >
                In Progress
              </Button>
            </div>

            {/* Blinds Filter */}
            <div className="flex gap-1">
              <Button
                variant={filterBlinds === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlinds('all')}
                data-testid="filter-blinds-all"
              >
                All Blinds
              </Button>
              <Button
                variant={filterBlinds === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlinds('low')}
                data-testid="filter-blinds-low"
              >
                Low ($1-$20)
              </Button>
              <Button
                variant={filterBlinds === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlinds('medium')}
                data-testid="filter-blinds-medium"
              >
                Medium ($21-$50)
              </Button>
              <Button
                variant={filterBlinds === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBlinds('high')}
                data-testid="filter-blinds-high"
              >
                High ($51+)
              </Button>
            </div>

            {/* Available Seats Filter */}
            <Button
              variant={filterAvailable ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAvailable(!filterAvailable)}
              data-testid="filter-available"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Available Seats
            </Button>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {/* Create New Table Card - Compact Design */}
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-dashed border-muted hover:border-primary/50 transition-all cursor-pointer hover:bg-card/70 h-full min-h-[220px] flex items-center justify-center" data-testid="button-create-table">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Create Table</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">Set your own stakes</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent 
              ref={dialogRef}
              className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
              aria-labelledby="create-table-title"
              aria-describedby="create-table-description"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                firstInputRef.current?.focus();
              }}
            >
              <form onSubmit={handleCreateTable} noValidate>
                <DialogHeader>
                  <DialogTitle id="create-table-title">Create New Table</DialogTitle>
                  <DialogDescription id="create-table-description">
                    Configure your poker table settings. Other players can join once it's created.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  {/* Table Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="tableName">
                      Table Name
                    </Label>
                    <Input
                      ref={firstInputRef}
                      id="tableName"
                      name="tableName"
                      value={tableName}
                      onChange={(e) => {
                        setTableName(e.target.value);
                        if (errors.tableName) {
                          setErrors(prev => ({ ...prev, tableName: '' }));
                        }
                      }}
                      className="h-12"
                      placeholder="e.g., Friday Night Game"
                      aria-invalid={!!errors.tableName}
                      aria-describedby={errors.tableName ? 'tableName-error' : undefined}
                      data-testid="input-table-name"
                    />
                    {errors.tableName && (
                      <p id="tableName-error" className="text-sm text-destructive" role="alert">
                        {errors.tableName}
                      </p>
                    )}
                  </div>

                  {/* Small Blind Field */}
                  <div className="space-y-2">
                    <Label htmlFor="smallBlind">
                      Small Blind
                    </Label>
                    <NumberInput
                      id="smallBlind"
                      name="smallBlind"
                      value={smallBlind}
                      onChange={(value) => {
                        setSmallBlind(value);
                        if (errors.bigBlind) {
                          setErrors(prev => ({ ...prev, bigBlind: '' }));
                        }
                      }}
                      min={1}
                      max={1000}
                      step={1}
                      prefix="$"
                      helperText="Typical: $5-$25 for casual games"
                      errorMessage={errors.smallBlind}
                      data-testid="input-small-blind"
                    />
                  </div>

                  {/* Big Blind Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bigBlind">
                      Big Blind
                    </Label>
                    <NumberInput
                      id="bigBlind"
                      name="bigBlind"
                      value={bigBlind}
                      onChange={(value) => {
                        setBigBlind(value);
                        if (errors.bigBlind) {
                          setErrors(prev => ({ ...prev, bigBlind: '' }));
                        }
                      }}
                      min={1}
                      max={2000}
                      step={1}
                      prefix="$"
                      helperText="Usually 2x the small blind"
                      errorMessage={errors.bigBlind}
                      data-testid="input-big-blind"
                    />
                  </div>

                  {/* Min Buy-in Field */}
                  <div className="space-y-2">
                    <Label htmlFor="minBuyIn">
                      Minimum Buy-in
                    </Label>
                    <NumberInput
                      id="minBuyIn"
                      name="minBuyIn"
                      value={minBuyIn}
                      onChange={(value) => {
                        setMinBuyIn(value);
                        if (errors.minBuyIn) {
                          setErrors(prev => ({ ...prev, minBuyIn: '' }));
                        }
                      }}
                      min={1}
                      max={10000}
                      step={10}
                      prefix="$"
                      helperText="Recommended: 20-50x big blind"
                      errorMessage={errors.minBuyIn}
                      data-testid="input-min-buyin"
                    />
                  </div>

                  {/* Max Buy-in Field */}
                  <div className="space-y-2">
                    <Label htmlFor="maxBuyIn">
                      Maximum Buy-in
                    </Label>
                    <NumberInput
                      id="maxBuyIn"
                      name="maxBuyIn"
                      value={maxBuyIn}
                      onChange={(value) => {
                        setMaxBuyIn(value);
                        if (errors.maxBuyIn) {
                          setErrors(prev => ({ ...prev, maxBuyIn: '' }));
                        }
                      }}
                      min={1}
                      max={50000}
                      step={10}
                      prefix="$"
                      helperText="Recommended: 100-200x big blind"
                      errorMessage={errors.maxBuyIn}
                      data-testid="input-max-buyin"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTableMutation.isPending}
                    data-testid="button-create-submit"
                  >
                    {createTableMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Table
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Show skeleton loaders when loading */}
          {isLoading ? (
            <>
              <TableCardSkeleton />
              <TableCardSkeleton />
              <TableCardSkeleton />
              <TableCardSkeleton />
            </>
          ) : filteredTables.length === 0 ? (
            <Card className="col-span-full bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tables found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm || filterStatus !== 'all' || filterBlinds !== 'all' || filterAvailable
                    ? "No tables match your filters. Try adjusting your search criteria."
                    : "No active tables yet. Create one to get started!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Active Table Cards */
            filteredTables.map((table: PokerTable) => {
              const status = getTableStatus(table);
              const isFull = table.currentPlayers >= table.maxPlayers;
              
              return (
                <Card 
                  key={table.id} 
                  className="bg-card backdrop-blur-lg border border-border hover:shadow-lg transition-all h-full min-h-[220px] flex flex-col"
                  data-testid={`card-table-${table.id}`}
                >
                  <CardHeader className="pb-3 flex-none">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {table.name}
                      </CardTitle>
                      <Badge 
                        variant={status.variant} 
                        className={`${status.color} shrink-0`}
                        data-testid={`status-table-${table.id}`}
                      >
                        {status.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-muted-foreground shrink-0" aria-label="Blinds" />
                      <span className="font-medium">${table.smallBlind}/${table.bigBlind}</span>
                      <span className="text-muted-foreground">blinds</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" aria-label="Players" />
                      <span className="font-medium">{table.currentPlayers}/{table.maxPlayers}</span>
                      <span className="text-muted-foreground">players</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" aria-label="Buy-in" />
                      <span className="font-medium">${table.minBuyIn}-${table.maxBuyIn}</span>
                      <span className="text-muted-foreground">buy-in</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 flex-none">
                    <Button
                      className="w-full font-medium"
                      variant={isFull ? "secondary" : "default"}
                      disabled={isFull}
                      onClick={() => handleJoinTable(table.id, table.minBuyIn, table.maxBuyIn)}
                      data-testid={`button-join-${table.id}`}
                    >
                      {isFull ? "Table Full" : "Join Table"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>

        {/* Join Table Dialog */}
        <Dialog open={selectedTable !== null} onOpenChange={(open) => !open && setSelectedTable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose Your Buy-in</DialogTitle>
              <DialogDescription>
                Select the amount of chips you want to bring to the table.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="buyInSlider">Buy-in Amount: ${joinBuyIn}</Label>
                <Slider
                  id="buyInSlider"
                  min={200}
                  max={1000}
                  step={50}
                  value={[joinBuyIn]}
                  onValueChange={(value) => setJoinBuyIn(value[0])}
                  className="w-full"
                  data-testid="slider-buyin"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$200</span>
                  <span>$1000</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTable(null)}
                data-testid="button-join-cancel"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmJoinTable}
                disabled={joinTableMutation.isPending}
                data-testid="button-join-confirm"
              >
                {joinTableMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Join with ${joinBuyIn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}